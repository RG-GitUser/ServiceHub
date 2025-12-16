import { databases, ID } from '@/lib/appwrite'
import { products } from '@/lib/products'
import { Permission, Role } from 'appwrite'

type AppwriteError = {
  code?: number
  message?: string
  response?: { code?: number; message?: string }
}

function truncate(value: string, max: number) {
  if (!value) return ''
  return value.length > max ? value.slice(0, max) : value
}

function isConflictError(err: AppwriteError) {
  const code = err?.code ?? err?.response?.code
  if (code === 409) return true
  const msg = (err?.message || err?.response?.message || '').toLowerCase()
  return msg.includes('already exists') || msg.includes('document with the requested id')
}

function isUnknownAttributeError(err: AppwriteError) {
  const msg = (err?.message || '').toLowerCase()
  return msg.includes('unknown attribute') || msg.includes('invalid document structure')
}

function isItemIdRangeError(err: AppwriteError) {
  const msg = (err?.message || '').toLowerCase()
  return msg.includes('attribute "itemid"') && msg.includes('valid range')
}

function itemIdRangeHelp() {
  return 'Your Appwrite Items attribute "itemID" is restricted to the range 3–5, but this app has product IDs 1–6. Update sh-items → Attributes → itemID to allow 1–6 (or remove the range / change itemID to string), then try seeding again.'
}

function sanitizeId(value: string) {
  return (value || '').replace(/[^a-zA-Z0-9_]/g, '_')
}

function getDbConfig() {
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
  const itemsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_ITEMS_COLLECTION_ID || 'sh-items'

  if (databaseId && (databaseId === itemsCollectionId || databaseId === 'sh-items')) {
    throw new Error(
      'Invalid Database ID: sh-items is a collection ID. Set NEXT_PUBLIC_APPWRITE_DATABASE_ID to your Database ID from Appwrite Console → Databases → Settings.'
    )
  }

  return { databaseId, itemsCollectionId }
}

function permissionsForCatalog(userId?: string) {
  if (!userId) return undefined
  const safe = sanitizeId(userId)
  return [
    Permission.read(Role.any()), // allow viewing seeded catalog across users
    Permission.update(Role.user(safe)),
    Permission.delete(Role.user(safe)),
  ]
}

export async function seedAllProductsToItems(params: { userId?: string; userEmail?: string } = {}) {
  const { databaseId, itemsCollectionId } = getDbConfig()
  if (!databaseId) throw new Error('Database not configured (NEXT_PUBLIC_APPWRITE_DATABASE_ID)')
  if (!params.userEmail) {
    throw new Error('Missing required attribute "userEmail": pass the signed-in user email to the seeder.')
  }

  let created = 0
  let skipped = 0

  for (const p of products) {
    const docId = `product_${p.id}`

    // Base schema you said exists in Items (plus required userEmail in your schema):
    // Note: userId is NOT included here because some schemas won't have it.
    const basePayload: Record<string, any> = {
      itemName: truncate(p.name, 100),
      itemID: p.id,
      itemType: truncate(p.category, 100),
      userEmail: params.userEmail,
    }

    const payloadWithUserId: Record<string, any> = {
      ...basePayload,
      ...(params.userId ? { userId: params.userId } : {}),
    }

    // Optional extras if you later add columns:
    const payloadWithExtras: Record<string, any> = {
      ...payloadWithUserId,
      description: p.description,
      price: p.price,
      rating: p.rating,
    }

    const payloadWithExtrasNoUserId: Record<string, any> = {
      ...basePayload,
      description: p.description,
      price: p.price,
      rating: p.rating,
    }

    try {
      await databases.createDocument(
        databaseId,
        itemsCollectionId,
        ID.custom(docId),
        payloadWithExtras,
        permissionsForCatalog(params.userId)
      )
      created++
    } catch (err: any) {
      const e: AppwriteError = err
      if (isItemIdRangeError(e)) {
        throw new Error(itemIdRangeHelp())
      }
      if (isConflictError(e)) {
        skipped++
        continue
      }
      if (isUnknownAttributeError(e)) {
        // Retry: drop fields until schema accepts it.
        // 1) extras without userId (common)
        try {
          await databases.createDocument(
            databaseId,
            itemsCollectionId,
            ID.custom(docId),
            payloadWithExtrasNoUserId,
            permissionsForCatalog(params.userId)
          )
          created++
          continue
        } catch (e2: any) {
          if (isConflictError(e2)) {
            skipped++
            continue
          }
          if (isItemIdRangeError(e2)) throw new Error(itemIdRangeHelp())
          if (!isUnknownAttributeError(e2)) throw e2
        }

        // 2) base with userId
        try {
          await databases.createDocument(
            databaseId,
            itemsCollectionId,
            ID.custom(docId),
            payloadWithUserId,
            permissionsForCatalog(params.userId)
          )
          created++
          continue
        } catch (e3: any) {
          if (isConflictError(e3)) {
            skipped++
            continue
          }
          if (isItemIdRangeError(e3)) throw new Error(itemIdRangeHelp())
          if (!isUnknownAttributeError(e3)) throw e3
        }

        // 3) base without userId (minimal required)
        try {
          await databases.createDocument(
            databaseId,
            itemsCollectionId,
            ID.custom(docId),
            basePayload,
            permissionsForCatalog(params.userId)
          )
          created++
          continue
        } catch (e4: any) {
          if (isConflictError(e4)) {
            skipped++
            continue
          }
          if (isItemIdRangeError(e4)) throw new Error(itemIdRangeHelp())
          throw e4
        }
      }
      throw err
    }
  }

  return { created, skipped, total: products.length }
}

