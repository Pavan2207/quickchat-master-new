# QuickChat - Real-time Messaging Application

A full-stack real-time chat application built with Next.js, Convex, and Clerk.

## Features

- **Authentication**: Clerk-based authentication with email/social login
- **User Discovery**: Browse and search for other users
- **Direct Messaging**: One-on-one private conversations with real-time updates
- **Message Timestamps**: Smart time formatting (today, yesterday, date+time)
- **Online Status**: Real-time online/offline indicators
- **Typing Indicators**: See when the other person is typing
- **Unread Counts**: Badge notifications for unread messages
- **Message Reactions**: React to messages with emojis (👍 ❤️ 😂 😮 😢)
- **Delete Messages**: Soft delete messages
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Convex (database, real-time subscriptions, API)
- **Authentication**: Clerk
- **UI Components**: Custom components with Tailwind

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Clerk account (free tier available)
- A Convex account (free tier available)

### Installation

1. Clone the repository:
```
bash
git clone <your-repo-url>
cd quickchat
```

2. Install dependencies:
```
bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file with your credentials:

```
env
# Clerk Authentication
# Get your keys from https://clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex URL (from your Convex dashboard)
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
```

4. Set up Clerk:
   - Go to https://clerk.com and create a new application
   - Copy your Publishable Key and Secret Key
   - Add them to `.env.local`
   - Configure redirect URLs in Clerk Dashboard:
     - http://localhost:3000
     - http://localhost:3000/api/auth/callback/clerk

5. Set up Convex:
   
```
bash
   npx convex dev
   
```
   This will:
   - Create a Convex project
   - Generate the necessary types
   - Start the local Convex dev server

6. Run the development server:
```
bash
npm run dev
```

7. Open http://localhost:3000 in your browser

## Project Structure

```
quickchat/
├── convex/
│   ├── schema.ts         # Database schema
│   ├── users.ts          # User queries/mutations
│   ├── conversations.ts  # Conversation queries/mutations
│   ├── messages.ts       # Message queries/mutations
│   └── typing.ts         # Typing status
├── src/
│   ├── app/
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx     # Main page
│   │   └── globals.css  # Global styles
│   ├── components/
│   │   ├── providers.tsx # Auth providers
│   │   ├── Sidebar.tsx  # Conversation list
│   │   └── Chat.tsx     # Chat interface
│   └── lib/
│       ├── convex.ts    # Convex client
│       └── utils.ts     # Utility functions
├── .env.local           # Environment variables
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx convex dev` - Start Convex dev server

## License

MIT
