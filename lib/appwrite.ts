import { Client, Account, Databases, Storage, ID } from 'appwrite'

// Get Appwrite configuration from environment variables with fallbacks
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://tor.cloud.appwrite.io/v1'
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '693f4a370022ade56c94'

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)

const account = new Account(client)
const databases = new Databases(client)
const storage = new Storage(client)

export { client, account, databases, storage, ID }

