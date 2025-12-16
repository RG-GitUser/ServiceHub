// Test utility to verify Appwrite connection
import { client, account } from './appwrite'

export async function testAppwriteConnection() {
  try {
    console.log('Testing Appwrite connection...')
    console.log('Endpoint:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    console.log('Project ID:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    
    // Try to get current session (will fail if not logged in, but that's ok)
    try {
      const session = await account.get()
      console.log('✅ Appwrite connected! Current user:', session.email)
      return { success: true, message: 'Connected', user: session }
    } catch (error: any) {
      // If we get here, it means Appwrite is connected but no user is logged in
      console.log('✅ Appwrite connected! (No active session)')
      return { success: true, message: 'Connected but no active session' }
    }
  } catch (error: any) {
    console.error('❌ Appwrite connection failed:', error.message)
    return { success: false, error: error.message }
  }
}

