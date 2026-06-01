# Vercel Deployment Guide

## Prerequisites
- Node.js 18+ installed
- Vercel account (create at https://vercel.com)
- GitHub account with the project repository

## Local Deployment Test

Before deploying to Vercel, test locally:

```bash
npm install
npm run build
npm start
```

Your app should be available at `http://localhost:3000`

## Deploying to Vercel

### Option 1: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy from your project directory:
```bash
vercel
```

3. Follow the prompts to link your project

4. After deployment, Vercel will provide your production URL

### Option 2: Using GitHub Integration

1. Push your project to GitHub
2. Go to https://vercel.com and click "New Project"
3. Import your repository from GitHub
4. Click "Deploy"
5. Vercel will automatically rebuild on every push to main branch

## Environment Variables

If you need to set environment variables for production:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add your variables (e.g., API URLs, secrets)
4. Redeploy for changes to take effect

## Important Notes

- **Database Persistence**: The current setup uses `db.json` stored in the filesystem. On Vercel, this file persists only within a deployment's session. For production data persistence, consider using:
  - **Firebase Realtime Database**
  - **MongoDB Atlas**
  - **Supabase**
  - **AWS DynamoDB**

- **File Uploads**: If you need to handle file uploads, Vercel's serverless functions have a 5MB request body limit. Use cloud storage (AWS S3, Cloudinary, etc.)

- **Production Recommendations**:
  1. Add a real database for data persistence
  2. Implement authentication (JWT, OAuth, etc.)
  3. Add input validation on both client and server
  4. Set up monitoring and error tracking
  5. Use HTTPS only in production

## Troubleshooting

- **Build fails**: Check that all dependencies are in `package.json`
- **API routes not found**: Ensure files in `/api` directory are named correctly
- **Environment variables not loading**: Ensure they're set in Vercel project settings
- **Database empty after restart**: Implement persistent database instead of `db.json`

## Rollback

To rollback to a previous deployment:
1. Go to your Vercel project
2. Click "Deployments"
3. Find the deployment to rollback to
4. Click "..." menu and select "Promote to Production"

## Custom Domain

To add a custom domain:
1. Go to Vercel project settings → Domains
2. Enter your domain name
3. Follow DNS configuration instructions for your domain provider
4. Wait for DNS to propagate (usually 5-10 minutes)
