# FitTrack: Fitness Tracking PWA

A mobile-optimized fitness tracking PWA that combines digital membership management, advanced workout analytics, and intelligent fitness guidance.

## Features

- Planet Fitness digital membership integration
- Apple Fitness connectivity
- Tiered premium membership options
- Comprehensive workout tracking and analytics
- PWA for fullscreen mode on iOS Safari

## Deploying to Vercel

This application is configured for seamless deployment on Vercel. Here's how to deploy:

### Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Neon PostgreSQL database](https://neon.tech/) (or any PostgreSQL provider)

### Deployment Steps

1. Fork or clone this repository to your GitHub account
2. Connect Vercel to your GitHub repository
3. During setup, add the following environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SESSION_SECRET`: A strong random string for session encryption
4. Deploy the application
5. Vercel will automatically build and deploy your application

### Vercel Configuration

The included `vercel.json` file provides all necessary configuration for deployment:
- Backend API endpoints are mapped to the Express server
- Frontend assets are served from the built client application
- Routing is set up to handle both API and frontend routes

## Development

To run the project locally:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## Tech Stack

- Frontend: React, Tailwind CSS, shadcn/ui
- Backend: Express.js
- Database: PostgreSQL with Drizzle ORM
- Authentication: Passport.js