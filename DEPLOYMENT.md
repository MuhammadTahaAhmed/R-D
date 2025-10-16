# Netlify Deployment Guide

## Fixed Issues

1. **Dependency Conflict**: Downgraded `@amplitude/analytics-browser` from `^2.25.4` to `^1.14.0` to be compatible with `@readyplayerme/visage@6.16.0`

2. **API Route Issue**: Created Netlify Functions to handle `/api/generate-avatar` endpoint since static export doesn't support API routes

3. **Build Configuration**: 
   - Added `.npmrc` with `legacy-peer-deps=true` to handle peer dependency conflicts
   - Removed static export from `next.config.mjs` to support API routes
   - Created `netlify.toml` with proper build settings and redirects
   - Created Netlify Functions for API endpoints

## Deployment Steps

1. **Commit and push your changes**:
   ```bash
   git add .
   git commit -m "Fix Netlify deployment - add Netlify Functions for API routes"
   git push origin main
   ```

2. **Netlify will automatically redeploy** with the fixed configuration

## Build Configuration

- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- **Node Version**: 22.20.0
- **NPM Version**: 10.9.3

## API Route Handling

- **Original API Route**: `/api/generate-avatar` (Next.js API route)
- **Netlify Function**: `/.netlify/functions/generate-avatar`
- **Redirect**: `/api/generate-avatar` → `/.netlify/functions/generate-avatar`

## Files Added/Modified

- `package.json` - Fixed dependency versions
- `.npmrc` - Added legacy peer deps flag
- `netlify.toml` - Netlify build configuration with redirects
- `next.config.mjs` - Removed static export to support API routes
- `netlify/functions/generate-avatar.js` - Netlify Function for API endpoint
- `netlify/functions/services/` - CommonJS versions of service files
- `DEPLOYMENT.md` - This guide

## Environment Variables Required

Make sure these are set in your Netlify dashboard:
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `CLOUDINARY_API_KEY` (optional)
- `CLOUDINARY_API_SECRET` (optional)

The deployment should now work successfully with API routes!
