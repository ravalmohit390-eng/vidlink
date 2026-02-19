# 🚀 Deployment Guide: Linkify Video on Vercel

This project is configured for a monorepo deployment on **Vercel**.

## 1. Quick Deploy
1. Push your code to a GitHub repository.
2. Connect the repository to Vercel.
3. Vercel will automatically detect the `vercel.json` configuration.

## 2. Environment Variables
Add the following variables in your Vercel Project Settings:
- `JWT_SECRET`: A secure random string for authentication.
- `NODE_ENV`: Set to `production`.

## ⚠️ Important Note on Persistence
Vercel is a **Serverless** platform. This means:
1. **Local Files don't persist**: Uploaded videos and JSON database files (`videos.json`, `users.json`) will be wiped whenever the serverless function restarts.
2. **Read-only Filesystem**: You cannot write new files to the directory in production.

### For a real Production App:
To make this app fully functional in production, you should:
- **Storage**: Use **AWS S3**, **Supabase Storage**, or **Cloudinary** for video files instead of local `uploads/`.
- **Database**: Use **MongoDB Atlas** or **PostgreSQL** instead of JSON files.

## Local Testing
To test the production build locally:
```bash
npm run vercel-build
```
