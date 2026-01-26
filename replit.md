# Sweet Hearts

## Overview
Sweet Hearts (formerly PrivateConnect) is a Sri Lankan premium dating and connections platform with real payments and real data. Tagline: "Real connections, real feelings". No demo/mock data - everything uses PostgreSQL database and Stripe payments.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn-ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL (Replit managed)
- **Payments**: Stripe (real payments)
- **Authentication**: JWT with bcrypt

## Architecture
- Vite dev server runs on port 5000 (frontend)
- Express API server runs on port 3001 (backend)
- Vite proxies `/api/*` requests to Express
- PostgreSQL database for all data storage

## Features
- User registration with live selfie verification
- Profile categories (Girls Personal, Boys Personal, Live Cam, Spa, Verified Profiles)
- WhatsApp unlock payments via Stripe
- Subscription plans with manual/Stripe payment
- Admin dashboard for verification and management
- Wallet system with withdrawal functionality
- Featured/Boost profile system
- Bilingual support (Sinhala/English)

## Project Structure
```
src/
  components/    - React UI components
  pages/         - Page components
  lib/           - Utilities (api.ts for API calls)
  hooks/         - Custom React hooks
  *.js           - Vanilla JS for HTML pages
server/
  index.ts       - Express server entry point
  routes.ts      - API routes
  storage.ts     - Database operations
  schema.ts      - Drizzle ORM schema
  db.ts          - Database connection
  stripeClient.ts - Stripe integration
  webhookHandlers.ts - Stripe webhook handlers
public/
  *.html         - Static HTML pages (register, dashboard, admin, profile)
```

## Running the App
- Development: `npm run dev` (runs both frontend and backend)
- Frontend only: `npm run dev:frontend`
- Backend only: `npm run dev:server`

## Admin Access
- Email: jayakodyarachchigemahisha@gmail.com
- Default password: admin123

## API Endpoints
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- POST /api/auth/logout - User logout
- GET /api/auth/me - Get current user
- GET /api/profiles - List profiles
- GET /api/profiles/:id - Get profile by ID
- PUT /api/user/profile - Update user profile
- GET /api/user/wallet - Get wallet balance
- POST /api/stripe/checkout - Create Stripe checkout session
- Admin endpoints for user management

## Payment Flow
1. User clicks "Unlock WhatsApp" on a profile
2. System creates Stripe Checkout session
3. User pays via Stripe
4. Webhook processes payment and updates database
5. Seller receives funds in wallet
