# Deployment Guide for Gravity Heist

This guide provides step-by-step instructions for deploying Gravity Heist to various platforms.

## Quick Deploy Options

### Option 1: Deploy to Vercel (Recommended)

**One-Click Deploy:**
1. Click the "Deploy with Vercel" button in the README
2. Sign in with GitHub
3. Click "Deploy"
4. Your game will be live in seconds!

**Manual Deploy:**
1. Install Vercel CLI: `npm install -g vercel`
2. Navigate to project directory
3. Run `vercel` and follow prompts
4. Your game will be deployed with custom domain

**Configuration:**
- `vercel.json` is pre-configured for static site hosting
- Includes CORS headers for Three.js CDN resources
- No build step required

### Option 2: Deploy to Render

**Using render.yaml (Recommended):**
1. Fork the repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Static Site"
4. Connect your GitHub repository
5. Render will auto-detect `render.yaml`
6. Click "Create Static Site"

**Manual Configuration:**
1. Create new Static Site on Render
2. Connect repository
3. Set publish directory to `.` (root)
4. No build command needed
5. Deploy!

### Option 3: Netlify

1. Go to [Netlify](https://app.netlify.com/)
2. Drag and drop the project folder
3. Or connect your GitHub repository
4. No build configuration needed
5. Deploy!

### Option 4: GitHub Pages

1. Push to GitHub repository
2. Go to Settings → Pages
3. Select branch (usually `main` or `copilot/add-surreal-3d-worlds`)
4. Select root directory
5. Save and wait for deployment

### Option 5: Any Static Host

Upload these files to any web hosting service:
```
index.html
game.js
README.md
TESTING.md
```

Supported hosts:
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps
- Cloudflare Pages
- Firebase Hosting
- Surge.sh

## Local Development

**Option 1: Using Python:**
```bash
python3 -m http.server 8080
```

**Option 2: Using Node.js:**
```bash
npm start
```
(Requires `package.json` which is included)

**Option 3: Using PHP:**
```bash
php -S localhost:8080
```

Then open http://localhost:8080 in your browser.

## Deployment Checklist

Before deploying, ensure:
- [x] `index.html` exists and is valid
- [x] `game.js` exists and has no syntax errors
- [x] Three.js CDN URLs are accessible (jsDelivr)
- [x] CORS headers configured (automatic with vercel.json/render.yaml)
- [x] Browser compatibility checked (Chrome, Firefox, Edge, Safari)

## Post-Deployment

After deployment:
1. Test the game in multiple browsers
2. Verify Three.js loads correctly
3. Check console for any errors
4. Test pointer lock functionality
5. Verify all game features work

## Troubleshooting

**Issue: Three.js fails to load**
- Solution: Check CDN availability, ensure CORS headers are set

**Issue: Pointer lock doesn't work**
- Solution: Ensure site is served over HTTPS (most platforms do this automatically)

**Issue: Game doesn't start**
- Solution: Check browser console for errors, verify WebGL support

**Issue: Performance issues**
- Solution: Consider using a CDN with edge caching (Vercel, Netlify, Cloudflare)

## Domain Configuration

Both Vercel and Render offer free custom domains:

**Vercel:**
1. Go to project settings
2. Add custom domain
3. Follow DNS configuration instructions

**Render:**
1. Go to site settings
2. Add custom domain
3. Configure DNS records

## Environment Variables

No environment variables required - the game is purely client-side!

## SSL/HTTPS

All recommended platforms provide free SSL certificates automatically:
- Vercel: Automatic SSL via Let's Encrypt
- Render: Automatic SSL
- Netlify: Automatic SSL
- GitHub Pages: Automatic SSL

## Monitoring

Consider adding analytics to track usage:
- Google Analytics
- Plausible Analytics
- Vercel Analytics (built-in)

Add tracking code to `index.html` if desired.

## Scaling

The game is static and scales automatically on:
- Vercel Edge Network
- Render Global CDN
- Netlify Edge

No server-side scaling required!

## Cost

All mentioned platforms offer free tiers:
- **Vercel**: Free for personal projects, unlimited bandwidth
- **Render**: Free static sites
- **Netlify**: 100GB bandwidth/month free
- **GitHub Pages**: Free for public repositories

## Support

For deployment issues, check:
1. Platform status pages
2. Platform documentation
3. GitHub repository issues
4. README.md troubleshooting section

Happy deploying! 🚀
