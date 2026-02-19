# Deployment Checklist

## Pre-Deployment

- [ ] All tests pass (`npm run test`)
- [ ] Build completes successfully (`npm run build`)
- [ ] Lint passes with 0 errors (`npm run lint`)
- [ ] All seed data files exist and validate (`/data/seed/*.json`)
- [ ] `.env.example` is up to date
- [ ] `README.md` is complete and accurate
- [ ] TypeScript compilation passes (`npx tsc --noEmit`)
- [ ] No console errors in browser during testing
- [ ] All routes are accessible and functional
- [ ] Mobile responsiveness verified

## Vercel Deployment

### Initial Setup

- [ ] Repository pushed to GitHub (or GitLab/Bitbucket)
- [ ] Vercel account created/accessed
- [ ] Vercel project created and linked to repository
- [ ] Build settings verified:
  - Framework Preset: Next.js
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`

### Environment Variables

- [ ] Environment variables configured in Vercel dashboard (if any)
  - `NEXT_PUBLIC_APP_URL` (production URL)
  - `NODE_ENV=production`
- [ ] Variables added to all environments (Production, Preview, Development)

### Build Verification

- [ ] Build successful on Vercel (check build logs)
- [ ] No build warnings or errors
- [ ] All static pages generated correctly
- [ ] API routes functional

## Post-Deployment Verification

### Core Functionality

- [ ] Landing page loads correctly
- [ ] Builder UI is functional
- [ ] Component selection works
- [ ] Preset selection works
- [ ] Results page displays correctly
- [ ] Compatibility checks execute properly
- [ ] Scores calculate correctly
- [ ] Upgrade suggestions appear
- [ ] Fix suggestions display

### Build Management

- [ ] Save build functionality works
- [ ] Load build functionality works
- [ ] Share URLs generate correctly
- [ ] Share URLs decode and load correctly
- [ ] Build export works (all formats)
- [ ] Auto-save works

### User Experience

- [ ] Mobile responsive design works
- [ ] Dark mode toggle works
- [ ] Toast notifications display
- [ ] Loading states show correctly
- [ ] Error states handle gracefully
- [ ] Keyboard shortcuts work (Ctrl+S, Ctrl+K)

### Performance

- [ ] Page load times acceptable (< 3s)
- [ ] API routes respond quickly
- [ ] No memory leaks
- [ ] Images/assets load correctly

## Rollback Plan

If deployment fails:

1. Check Vercel build logs for errors
2. Verify environment variables are set correctly
3. Check Node.js version compatibility
4. Review recent code changes
5. Rollback to previous deployment if needed

## Monitoring

After successful deployment:

- [ ] Set up Vercel Analytics (optional)
- [ ] Monitor error logs in Vercel dashboard
- [ ] Check performance metrics
- [ ] Set up uptime monitoring (optional)

## Troubleshooting

### Common Issues

**Build fails:**
- Check Node.js version (should be 18+)
- Verify all dependencies are in `package.json`
- Check for TypeScript errors

**API routes not working:**
- Verify API routes are in `/app/api/` directory
- Check route handlers export correct HTTP methods
- Verify environment variables are set

**Static assets not loading:**
- Check `public/` directory structure
- Verify asset paths in code
- Check Next.js Image component usage

**Environment variables not working:**
- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Restart deployment after adding variables
- Check variable names match exactly

## Production Checklist

- [ ] Domain configured (if using custom domain)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Analytics configured (optional)
- [ ] Error tracking set up (optional)
- [ ] Performance monitoring active
- [ ] Backup strategy in place (for data if applicable)
