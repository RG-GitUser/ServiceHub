import { databases, ID } from '@/lib/appwrite'
import type { CartItem } from '@/contexts/CartContext'
import { Permission, Role } from 'appwrite'

type AppwriteError = {
  code?: number
  message?: string
  type?: string
  response?: any
}

function truncate(value: string, max: number) {
  if (!value) return ''
  return value.length > max ? value.slice(0, max) : value
}

function sanitizeId(value: string) {
  return (value || '').replace(/[^a-zA-Z0-9_]/g, '_')
}

function isUnknownAttributeError(err: AppwriteError) {
  const msg = (err?.message || '').toLowerCase()
  return msg.includes('unknown attribute') || msg.includes('invalid document structure')
}

function isItemIdRangeError(err: AppwriteError) {
  const msg = (err?.message || '').toLowerCase()
  return msg.includes('attribute "itemid"') && msg.includes('valid range')
}

function permissionsForUser(userId?: string) {
  if (!userId) return undefined
  const safe = sanitizeId(userId)
  return [
    Permission.read(Role.user(safe)),
    Permission.update(Role.user(safe)),
    Permission.delete(Role.user(safe)),
  ]
}

function getDbConfig() {
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
  const purchasesCollectionId =
    process.env.NEXT_PUBLIC_APPWRITE_PURCHASES_COLLECTION_ID || 'sh-purchases'
  const itemsCollectionId =
    process.env.NEXT_PUBLIC_APPWRITE_ITEMS_COLLECTION_ID || 'sh-items'
  const usersCollectionId =
    process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || 'sh-users'

  // Common misconfiguration: using a Collection ID where a Database ID is expected.
  if (databaseId && (databaseId === purchasesCollectionId || databaseId === itemsCollectionId)) {
    throw new Error(
      `Invalid Database ID: looks like you set a Collection ID (${databaseId}). Set NEXT_PUBLIC_APPWRITE_DATABASE_ID to your Database ID from Appwrite Console → Databases → Settings.`
    )
  }
  if (databaseId && (databaseId === 'sh-purchases' || databaseId === 'sh-items')) {
    throw new Error(
      'Invalid Database ID: sh-purchases/sh-items are collection IDs. Set NEXT_PUBLIC_APPWRITE_DATABASE_ID to your Database ID from Appwrite Console → Databases → Settings.'
    )
  }

  return { databaseId, purchasesCollectionId, itemsCollectionId, usersCollectionId }
}

async function createPurchasedItemDocument(params: {
  cartItem: CartItem
  userId?: string
  userEmail?: string
  purchaseDateIso: string
}) {
  const { databaseId, itemsCollectionId } = getDbConfig()
  if (!databaseId) {
    throw new Error('Database not configured (NEXT_PUBLIC_APPWRITE_DATABASE_ID)')
  }

  // Recommended mapping:
  // - itemName: cart item name (max 100)
  // - itemID: cart item id (integer). Note: if your Items.itemID min/max only allows 3..5,
  //   update the schema to accept your product IDs or change itemID to string.
  // - itemType: category (max 100)
  // - userEmail: (often required in your schema)
  const basePayload: Record<string, any> = {
    itemName: truncate(params.cartItem.name, 100),
    itemID: params.cartItem.id,
    itemType: truncate(params.cartItem.category, 100),
    ...(params.userEmail ? { userEmail: params.userEmail } : {}),
  }

  // Optional fields (only saved if your Items schema includes them).
  const payloadWithOptionals: Record<string, any> = {
    ...basePayload,
    ...(params.userId ? { userId: params.userId } : {}),
    ...(params.purchaseDateIso ? { purchaseDate: params.purchaseDateIso } : {}),
  }

  try {
    return await databases.createDocument(
      databaseId,
      itemsCollectionId,
      ID.unique(),
      payloadWithOptionals,
      permissionsForUser(params.userId)
    )
  } catch (err: any) {
    const e: AppwriteError = err
    if (isItemIdRangeError(e)) {
      throw new Error(
        'Items.itemID is restricted by your Appwrite schema (e.g. 3–5), but your product IDs don’t fit that range. Update sh-items → Attributes → itemID to allow your product IDs (e.g. 1–6), then retry checkout.'
      )
    }
    if (isUnknownAttributeError(e)) {
      // Retry with only required fields for the Items schema.
      // IMPORTANT: basePayload still includes userEmail when provided (your schema requires it).
      return await databases.createDocument(
        databaseId,
        itemsCollectionId,
        ID.unique(),
        basePayload,
        permissionsForUser(params.userId)
      )
    }
    throw err
  }
}

async function ensureUserDocument(params: { userId?: string; userEmail?: string; userName?: string }) {
  const { databaseId, usersCollectionId } = getDbConfig()
  if (!databaseId) {
    throw new Error('Database not configured (NEXT_PUBLIC_APPWRITE_DATABASE_ID)')
  }
  if (!params.userId) return null

  const emailToUse = params.userEmail || ''
  const nameToUse = (params.userName || emailToUse.split('@')[0] || '').trim()
  const passPlaceholder = 'TESTPASS'

  const candidates: Array<Record<string, any>> = [
    { Name: nameToUse, Email: emailToUse, Pass: passPlaceholder },
    { Name: nameToUse, Email: emailToUse, UserEmail: emailToUse, Pass: passPlaceholder },
    { name: nameToUse, userEmail: emailToUse, Pass: passPlaceholder },
    { Email: emailToUse, Pass: passPlaceholder },
    { UserEmail: emailToUse, Pass: passPlaceholder },
    { userEmail: emailToUse, Pass: passPlaceholder },
  ]

  const docId = `user_${sanitizeId(params.userId)}`

  try {
    for (const candidate of candidates) {
      try {
        return await databases.createDocument(
          databaseId,
          usersCollectionId,
          ID.custom(docId),
          candidate,
          permissionsForUser(params.userId)
        )
      } catch (inner: any) {
        const ie: AppwriteError = inner
        if (ie?.code === 409) return null
        if (isUnknownAttributeError(ie)) continue
        throw inner
      }
    }
  } catch (err: any) {
    const e: AppwriteError = err
    // If user doc already exists, that's OK.
    if (e?.code === 409) return null
    throw err
  }
}

async function createPurchaseDocument(params: {
  cartItem: CartItem
  purchaseDateIso: string
  userId?: string
  userEmail?: string
}) {
  const { databaseId, purchasesCollectionId } = getDbConfig()
  if (!databaseId) {
    throw new Error('Database not configured (NEXT_PUBLIC_APPWRITE_DATABASE_ID)')
  }

  const purchaseType = truncate(params.cartItem.category, 50)
  const item = truncate(params.cartItem.name, 50)

  // User-aligned payload: include userEmail/userId if your Purchases collection has them.
  const payloadWithUser: Record<string, any> = {
    purchaseDate: params.purchaseDateIso,
    purchaseType,
    item,
    ...(params.userEmail ? { userEmail: params.userEmail } : {}),
    ...(params.userId ? { userId: params.userId } : {}),
  }

  try {
    return await databases.createDocument(
      databaseId,
      purchasesCollectionId,
      ID.unique(),
      payloadWithUser,
      permissionsForUser(params.userId)
    )
  } catch (err: any) {
    const e: AppwriteError = err
    // If schema doesn't include userId/userEmail, retry with smaller payloads so required fields still persist.
    if (isUnknownAttributeError(e)) {
      // Keep userEmail in the base when provided (your schema may require it).
      const base: Record<string, any> = {
        purchaseDate: params.purchaseDateIso,
        purchaseType,
        item,
        ...(params.userEmail ? { userEmail: params.userEmail } : {}),
      }

      // Try dropping userId first; only drop userEmail as a last resort.
      const candidates: Array<Record<string, any>> = []
      if (params.userId) candidates.push({ ...base, userId: params.userId })
      candidates.push(base)
      candidates.push({ purchaseDate: params.purchaseDateIso, purchaseType, item }) // last resort: no user fields

      for (const candidate of candidates) {
        try {
          return await databases.createDocument(
            databaseId,
            purchasesCollectionId,
            ID.unique(),
            candidate,
            permissionsForUser(params.userId)
          )
        } catch (innerErr: any) {
          const inner: AppwriteError = innerErr
          if (!isUnknownAttributeError(inner)) throw innerErr
        }
      }
    }
    throw err
  }
}

export async function checkoutCartToAppwrite(params: {
  userId?: string
  userEmail?: string
  userName?: string
  items: CartItem[]
}) {
  const purchaseDateIso = new Date().toISOString()

  // Ensure the purchasing user exists in the users collection (best-effort).
  await ensureUserDocument({
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName,
  }).catch(() => null)

  // Purchases schema has no quantity field, so we create one purchase per quantity.
  for (const cartItem of params.items) {
    const count = Math.max(1, cartItem.quantity || 1)
    for (let i = 0; i < count; i++) {
      // Create one Items row per purchased unit (matches the Purchases rows).
      await createPurchasedItemDocument({
        cartItem,
        userId: params.userId,
        userEmail: params.userEmail,
        purchaseDateIso,
      })

      await createPurchaseDocument({
        cartItem,
        purchaseDateIso,
        userId: params.userId,
        userEmail: params.userEmail,
      })
    }
  }

  return { purchaseDateIso }
}


