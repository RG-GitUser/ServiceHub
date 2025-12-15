# ServiceHub - Modern E-commerce & Service Booking Platform

A modern, full-featured web application for browsing products and booking services, built with Next.js 14, TypeScript, Tailwind CSS, and Appwrite.

## Features

- 🎨 **Modern UI/UX** - Beautiful, responsive design with smooth animations
- 🔐 **Appwrite Authentication** - Complete signup, signin, and forgot password functionality powered by Appwrite
- 🛍️ **Product Browsing** - Browse products with category filtering
- 📅 **Service Booking** - Book services with date and time selection
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile devices
- ⚡ **Fast & Optimized** - Built with Next.js for optimal performance
- 💾 **User Storage** - User data stored securely in Appwrite

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Appwrite account (free at [cloud.appwrite.io](https://cloud.appwrite.io))

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Appwrite:
   - Create a new project in your [Appwrite Console](https://cloud.appwrite.io)
   - Copy your Project ID and Endpoint URL
   - (Optional) Create a Database and Collection for storing additional user data
   - Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here (optional)
   NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=your_collection_id_here (optional)
   ```

3. Configure Appwrite Authentication:
   - In your Appwrite project, go to **Auth** → **Settings**
   - Enable **Email/Password** authentication
   - Add your domain to **Platforms** (for local development, add `localhost`)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
ecommerce-sample/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home/welcome page
│   ├── signup/            # Signup page
│   ├── signin/            # Signin page
│   ├── forgot-password/   # Forgot password page
│   ├── reset-password/    # Reset password page (from email link)
│   ├── products/          # Products browsing page
│   └── services/          # Services booking page
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context (Appwrite)
├── lib/                   # Utility functions
│   ├── appwrite.ts        # Appwrite client configuration
│   └── auth.ts           # Auth helpers
└── public/               # Static assets
```

## Authentication with Appwrite

This app uses [Appwrite](https://appwrite.io) for authentication and user management. Appwrite provides:

- ✅ Secure user authentication with email/password
- ✅ Session management
- ✅ Password recovery via email
- ✅ User data storage
- ✅ Built-in security features

### Appwrite Setup Steps

1. **Create an Appwrite Project**
   - Sign up at [cloud.appwrite.io](https://cloud.appwrite.io)
   - Create a new project
   - Copy your Project ID

2. **Configure Authentication**
   - Go to **Auth** → **Settings** in your Appwrite console
   - Enable **Email/Password** provider
   - Add your platform:
     - For development: Add `http://localhost` or `http://localhost:3000`
     - For production: Add your production domain

3. **Optional: Set up Database for User Profiles**
   - Create a Database in Appwrite
   - Create a Collection (e.g., "users")
   - Set up permissions (users can read/write their own documents)
   - Add the Database ID and Collection ID to your `.env.local`

4. **Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Appwrite credentials

### Password Reset Flow

When users request a password reset:
1. They enter their email on the forgot password page
2. Appwrite sends a recovery email with a reset link
3. The link redirects to `/reset-password` with `userId` and `secret` parameters
4. Users can then set a new password

## Adding Images

To add product/service images:

1. Place your images in the `public/` directory
2. Update the product/service objects in `app/products/page.tsx` and `app/services/page.tsx`
3. Replace the placeholder divs with `<Image>` components from `next/image`

Example:
```tsx
import Image from 'next/image'

<Image
  src="/images/product-1.jpg"
  alt={product.name}
  width={400}
  height={400}
  className="w-full h-full object-cover"
/>
```

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Appwrite** - Backend-as-a-Service for authentication and user management
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## License

MIT

# ServiceHub
