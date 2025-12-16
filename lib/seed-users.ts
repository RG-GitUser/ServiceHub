import { databases, ID } from '@/lib/appwrite'
import { Permission, Role } from 'appwrite'

type AppwriteError = {
  code?: number
  message?: string
}

function sanitizeId(value: string) {
  return (value || '').replace(/[^a-zA-Z0-9_]/g, '_')
}

function isUnknownAttributeError(err: AppwriteError) {
  const msg = (err?.message || '').toLowerCase()
  return msg.includes('unknown attribute') || msg.includes('invalid document structure')
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
  const usersCollectionId = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || 'sh-users'

  if (databaseId && databaseId === usersCollectionId) {
    throw new Error(
      `Invalid Database ID: looks like you set a Collection ID (${databaseId}). Set NEXT_PUBLIC_APPWRITE_DATABASE_ID to your Database ID from Appwrite Console → Databases → Settings.`
    )
  }
  if (databaseId && databaseId === 'sh-users') {
    throw new Error(
      'Invalid Database ID: sh-users is a collection ID. Set NEXT_PUBLIC_APPWRITE_DATABASE_ID to your Database ID from Appwrite Console → Databases → Settings.'
    )
  }

  return { databaseId, usersCollectionId }
}

export async function seedCurrentUserToUsers(params: {
  userId?: string
  userEmail: string
  userName?: string
}) {
  const { databaseId, usersCollectionId } = getDbConfig()
  if (!databaseId) throw new Error('Database not configured (NEXT_PUBLIC_APPWRITE_DATABASE_ID)')
  if (!params.userId) throw new Error('Missing userId')

  const nameToUse = (params.userName || params.userEmail.split('@')[0] || '').trim()
  const passPlaceholder = 'TESTPASS'

  const docId = `user_${sanitizeId(params.userId)}`

  try {
    // Try the simplest "required fields" first to avoid noisy 400s.
    const candidates: Array<Record<string, any>> = [
      { Name: nameToUse, Email: params.userEmail, Pass: passPlaceholder },
      { Name: nameToUse, Email: params.userEmail, UserEmail: params.userEmail, Pass: passPlaceholder },

      { name: nameToUse, userEmail: params.userEmail, Pass: passPlaceholder },

      // Minimal variants (avoid lowercase "email" unless you actually have it)
      { Email: params.userEmail, Pass: passPlaceholder },
      { UserEmail: params.userEmail, Pass: passPlaceholder },
    ]

    for (const candidate of candidates) {
      try {
        await databases.createDocument(
          databaseId,
          usersCollectionId,
          ID.custom(docId),
          candidate,
          permissionsForUser(params.userId)
        )
        return { created: true, skipped: false }
      } catch (inner: any) {
        const ie: AppwriteError = inner
        if (ie?.code === 409) return { created: false, skipped: true }
        // Keep trying other shapes; Appwrite may throw "invalid document structure" for missing required attrs.
        if (isUnknownAttributeError(ie)) continue
        throw inner
      }
    }

    await databases.createDocument(
      databaseId,
      usersCollectionId,
      ID.custom(docId),
      { Name: nameToUse, Email: params.userEmail, Pass: passPlaceholder },
      permissionsForUser(params.userId)
    )
    return { created: true, skipped: false }
  } catch (err: any) {
    const e: AppwriteError = err
    if (e?.code === 409) return { created: false, skipped: true }
    throw err
  }
}


