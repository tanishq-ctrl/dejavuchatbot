# Vercel Deployment - Setting Root Directory

## Problem: "frontend" not appearing in Root Directory dropdown

When deploying to Vercel, you need to manually set the root directory to `frontend` since it's not in the root of the repository.

## Solution: Manual Entry

### Step-by-Step Instructions

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new
   - Sign in with GitHub

2. **Import Your Repository**
   - Click "Import Project"
   - Select: `tanishq-ctrl/xyzchatbot`
   - Click "Import"

3. **Configure Project**
   - Vercel will auto-detect Next.js ✅
   - **ROOT DIRECTORY**: Look for this field
     - It might be hidden - click "Configure Project" or "Advanced Settings"
     - Or scroll down to see more options

4. **Set Root Directory to `frontend`**
   - **Option A**: If you see a text field:
     - Clear the field (if it says ".")
     - Type exactly: `frontend` (no slash, no period)
   
   - **Option B**: If you see a dropdown:
     - The dropdown might be empty or only show "."
     - Click on the dropdown
     - Type: `frontend` in the text field
     - Press Enter or click outside

5. **Verify Settings**
   - Framework: Next.js ✅
   - Root Directory: `frontend` ✅
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm install` (auto-detected)

6. **Add Environment Variables** (optional now, can add later)
   - Click "Environment Variables"
   - Add:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
     NEXT_PUBLIC_AGENT_WHATSAPP=9715XXXXXXXX
     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
     ```

7. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)

## Alternative: Set After Initial Deployment

If you can't find the root directory option during import:

1. **Deploy First** (it will fail, but that's okay)
   - Just click "Deploy" with default settings
   - The build will fail because it can't find package.json

2. **Go to Project Settings**
   - After deployment attempt, go to your project dashboard
   - Click "Settings" tab
   - Click "General" in left sidebar

3. **Change Root Directory**
   - Find "Root Directory" section
   - Click "Edit" button
   - Change from "." to `frontend`
   - Click "Save"

4. **Redeploy**
   - Go to "Deployments" tab
   - Click "Redeploy" or push a new commit

## Visual Guide

When configuring, you should see:

```
┌─────────────────────────────────┐
│ Framework Preset: Next.js       │
│ Root Directory:  [frontend]     │ ← Type "frontend" here
│ Build Command:   npm run build  │
│ Output Directory: .next         │
│ Install Command: npm install    │
└─────────────────────────────────┘
```

## Troubleshooting

### "Root Directory" field not visible?
- Click "Configure Project" button
- Or click "Advanced" or "Show More Options"
- It's usually below the Framework Preset field

### Build fails with "package.json not found"?
- Make sure you typed exactly `frontend` (lowercase, no spaces)
- Not `./frontend` or `/frontend` or `Frontend`

### Dropdown is empty?
- You can type directly in the dropdown field
- Just type `frontend` and press Enter

## Verify It Worked

After deployment, check:
1. ✅ Build succeeds (green checkmark)
2. ✅ URL works: `https://your-project.vercel.app`
3. ✅ App loads correctly

## Quick Command Reference

If you want to set it via Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# In your project root
vercel

# Follow prompts
# When asked for root directory, type: frontend
```

---

**Need more help?** Check Vercel docs: https://vercel.com/docs/concepts/deployments/configure-a-build#root-directory
