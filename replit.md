# PrivateConnect

## Overview
PrivateConnect is a profile browsing platform built with React, TypeScript, Vite, and Tailwind CSS.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn-ui components
- **State Management**: Redux Toolkit + Zustand
- **Backend**: Supabase (authentication, database)
- **Payments**: Stripe
- **AI**: Google Generative AI
- **3D Graphics**: Three.js with React Three Fiber

## Features
- User authentication (login/register)
- Profile categories (Girls Personal, Boys Personal, Live Cam, Spa, Verified Profiles)
- Search and filter profiles
- Admin dashboard
- Bilingual support (Sinhala/English)

## Project Structure
```
src/
  components/    - Reusable UI components
  pages/         - Page components
  lib/           - Utilities and helpers
  hooks/         - Custom React hooks
public/          - Static assets
```

## Running the App
- Dev server runs on port 5000
- Command: `npm run dev`

## Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
