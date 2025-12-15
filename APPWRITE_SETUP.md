# Appwrite Setup Guide

This guide will help you set up Appwrite for authentication and user storage in this application.

## Step 1: Create an Appwrite Account

1. Go to [cloud.appwrite.io](https://cloud.appwrite.io)
2. Sign up for a free account (or sign in if you already have one)

## Step 2: Create a New Project

1. Click **"Create Project"** in your Appwrite console
2. Give it a name (e.g., "ServiceHub")
3. Click **"Create"**

## Step 3: Get Your Project Credentials

1. In your project dashboard, go to **Settings** → **General**
2. Copy your **Project ID**
3. Note your **API Endpoint** (usually `https://cloud.appwrite.io/v1`)

## Step 4: Configure Authentication

1. Go to **Auth** → **Settings** in the left sidebar
2. Enable **Email/Password** authentication
3. Go to **Auth** → **Platforms**
4. Click **"Add Platform"** → **"Web App"**
5. Add your platform:
   - **Name**: Development (or Production)
   - **Hostname**: `localhost` (for development) or your production domain
   - Click **"Save"**

## Step 5: Set Up Environment Variables

1. Create a `.env.local` file in the root of your project
2. Add the following variables:

```env
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
```

3. Replace `your_project_id_here` with your actual Project ID from Step 3

## Step 6: Optional - Set Up Database for User Profiles

If you want to store additional user data (like profile information):

1. Go to **Databases** in the left sidebar
2. Click **"Create Database"**
3. Give it a name (e.g., "main")
4. Click **"Create"**
5. Copy the Database ID
6. Create a Collection:
   - Click **"Create Collection"**
   - Name it "users" (or any name you prefer)
   - Copy the Collection ID
7. Set up Collection Permissions:
   - Go to **Settings** → **Permissions**
   - Add rule: **Users** can **Read** and **Write** their own documents
   - Use `userId` as the attribute for user matching
8. Add attributes to your collection:
   - `userId` (String, required)
   - `email` (String, required)
   - `name` (String, optional)
   - `createdAt` (String, optional)
9. Add these to your `.env.local`:

```env
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=your_collection_id_here
```

## Step 7: Test Your Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Navigate to `http://localhost:3000`
4. Try signing up with a new account
5. Check your Appwrite console → **Auth** → **Users** to see the new user

## Troubleshooting

### "Invalid credentials" error
- Make sure your Project ID is correct in `.env.local`
- Ensure the environment variables are prefixed with `NEXT_PUBLIC_`
- Restart your development server after changing `.env.local`

### "Platform not allowed" error
- Make sure you've added `localhost` as a platform in Appwrite
- Check that the platform is enabled in **Auth** → **Platforms**

### Password reset email not working
- Check your Appwrite email settings
- For development, Appwrite may use a test email (check your Appwrite console)
- Make sure the reset URL in your Appwrite settings matches your app's URL

### Database errors (if using optional database)
- Verify your Database ID and Collection ID are correct
- Check that permissions are set correctly
- Ensure all required attributes are created in the collection

## Next Steps

Once Appwrite is set up, you can:
- Customize user profiles
- Add more user data fields
- Set up email verification
- Add OAuth providers (Google, GitHub, etc.)
- Set up file storage for user avatars
- Create additional collections for products and services

For more information, visit the [Appwrite Documentation](https://appwrite.io/docs).

