# Free Deployment Guide 🚀

This guide will help you deploy the XYZ Real Estate AI Chatbot for **free** using modern cloud platforms.

## 📋 Overview

- **Frontend (Next.js)**: Deploy to **Vercel** (best for Next.js, free tier)
- **Backend (FastAPI)**: Deploy to **Render** or **Railway** (free tiers available)
- **Database**: Already using **Supabase** (free tier)
- **Total Cost**: **$0/month** 🎉

## 🏗️ Architecture

```
User → Vercel (Frontend) → Render/Railway (Backend) → Supabase (Database)
```

---

## 🌐 Part 1: Frontend Deployment (Vercel)

Vercel is the best platform for Next.js apps and offers an excellent free tier.

### Prerequisites
- GitHub account
- Repository pushed to GitHub

### Steps

#### 1. Push Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

#### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click **"Add New Project"**
4. Import your GitHub repository: `tanishq-ctrl/xyzchatbot`
5. **IMPORTANT**: Configure project settings:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: Click "Edit" → Change to `frontend` (must type it manually)
     - If "frontend" doesn't appear in dropdown, just type `frontend` in the text field
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)
6. If root directory field is not visible, click "Configure Project" or "Advanced" to see it

#### 3. Add Environment Variables in Vercel

Go to **Project Settings → Environment Variables** and add:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
# Or: https://your-backend.railway.app/api

NEXT_PUBLIC_AGENT_WHATSAPP=9715XXXXXXXX

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

#### 4. Deploy

Click **"Deploy"** and wait for the build to complete.

✅ **Frontend URL**: `https://your-project.vercel.app`

---

## ⚙️ Part 2: Backend Deployment

Choose one platform:

### Option A: Render (Recommended)

#### 1. Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **"New +" → "Web Service"**

#### 2. Configure Service

- **Repository**: Select your GitHub repo
- **Name**: `xyz-backend` (or any name)
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Build Command**: 
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command**: 
  ```bash
  uvicorn main:app --host 0.0.0.0 --port $PORT
  ```
- **Plan**: **Free**

#### 3. Add Environment Variables

In **Environment** section, add:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=uae-real-estate-api-propertyfinder-ae-data.p.rapidapi.com
USE_REALTIME_DATA=false
RAPIDAPI_MAX_RESULTS=50
RAPIDAPI_CACHE_MINUTES=30

ALLOWED_ORIGINS=https://your-project.vercel.app,http://localhost:3000
```

#### 4. Deploy

Click **"Create Web Service"** and wait for deployment.

✅ **Backend URL**: `https://your-backend.onrender.com`

**Note**: Free tier services spin down after 15 minutes of inactivity. First request may take 30-50 seconds.

---

### Option B: Railway (Alternative)

#### 1. Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"**

#### 2. Deploy from GitHub

1. Select **"Deploy from GitHub repo"**
2. Choose your repository
3. Railway will auto-detect Python

#### 3. Configure Settings

In **Settings** tab:
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### 4. Add Environment Variables

In **Variables** tab, add all environment variables (same as Render).

#### 5. Deploy

Railway will automatically deploy. Get your URL from the **Settings → Domains** section.

✅ **Backend URL**: `https://your-backend.railway.app`

---

## 🗄️ Part 3: Update Backend Configuration

### Update CORS Settings

After deploying frontend, update `backend/main.py` or environment variables:

```python
# In backend/main.py or environment variable
ALLOWED_ORIGINS=https://your-project.vercel.app,http://localhost:3000
```

Or update your `.env` file if using environment variables.

---

## 📝 Part 4: Update Frontend API URL

After backend is deployed, update Vercel environment variable:

1. Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Update `NEXT_PUBLIC_API_URL` to your backend URL:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
   ```
3. Redeploy (or wait for automatic redeploy)

---

## ✅ Part 5: Verify Deployment

### Test Frontend
1. Visit your Vercel URL
2. Try sending a chat message
3. Check browser console for errors

### Test Backend
1. Visit `https://your-backend-url/docs` (FastAPI Swagger UI)
2. Test `/api/featured` endpoint
3. Check logs in Render/Railway dashboard

### Test Integration
1. Send a chat query from frontend
2. Verify properties are returned
3. Test shortlist, WhatsApp, map features

---

## 🔧 Troubleshooting

### Backend Not Responding (Render Free Tier)

**Issue**: First request takes 30-50 seconds.

**Solution**: 
- This is normal for free tier (spins down after 15 min inactivity)
- Consider upgrading to paid tier for production
- Or use Railway (faster wake-up time)

### CORS Errors

**Issue**: Frontend can't connect to backend.

**Solution**:
1. Check `ALLOWED_ORIGINS` in backend environment variables
2. Include your Vercel URL (with `https://`)
3. Restart backend service

### Environment Variables Not Working

**Issue**: Variables not being read.

**Solution**:
1. **Frontend**: Ensure variables start with `NEXT_PUBLIC_`
2. **Backend**: Check variable names match exactly
3. Redeploy after adding variables
4. Check platform logs for errors

### Build Failures

**Issue**: Build fails on Vercel/Render.

**Solution**:
- Check build logs for specific errors
- Ensure all dependencies are in `package.json` (frontend) or `requirements.txt` (backend)
- Verify Node.js/Python versions match platform defaults

### Supabase Connection Issues

**Issue**: Database not connecting.

**Solution**:
1. Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
2. Check Supabase project is active
3. Ensure tables exist (run SQL schema)
4. Check Supabase dashboard for connection logs

---

## 💰 Free Tier Limits

### Vercel (Frontend)
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Custom domains
- ⚠️ Serverless functions: 100GB-hours/month

### Render (Backend)
- ✅ 750 hours/month
- ✅ 512MB RAM
- ⚠️ Spins down after 15 min inactivity
- ⚠️ First request: 30-50 second wake-up

### Railway (Backend)
- ✅ $5 free credit/month
- ✅ Faster wake-up than Render
- ✅ 512MB RAM default
- ⚠️ May need to upgrade for high traffic

### Supabase (Database)
- ✅ 500MB database
- ✅ 2GB bandwidth
- ✅ 50,000 monthly active users
- ✅ Automatic backups

---

## 📦 Additional Setup Files

### Create `.vercelignore` (if not exists)

Create `.vercelignore` in project root to exclude backend files:

```
backend/
*.md
.git/
.env*
__pycache__/
*.pyc
venv/
.venv/
```

### Create `render.yaml` (Optional)

Create `render.yaml` in project root for Render deployment:

```yaml
services:
  - type: web
    name: xyz-backend
    env: python
    region: oregon
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Update `backend/main.py` for Production

Ensure your `main.py` uses `PORT` environment variable:

```python
import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
```

---

## 🚀 Production Recommendations

For production, consider:

1. **Upgrade Backend**: 
   - Render paid tier ($7/month) - no spin-down
   - Railway paid tier - better performance

2. **Custom Domain**:
   - Add custom domain in Vercel (free)
   - Update `ALLOWED_ORIGINS` in backend

3. **Monitoring**:
   - Add error tracking (Sentry - free tier)
   - Add analytics (Vercel Analytics - free)

4. **Backup**:
   - Enable Supabase automatic backups
   - Export CSV data regularly

---

## 📚 Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Render Deployment Docs](https://render.com/docs)
- [Railway Deployment Docs](https://docs.railway.app)
- [Supabase Getting Started](https://supabase.com/docs/guides/getting-started)

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ Frontend: `https://your-project.vercel.app`
- ✅ Backend: `https://your-backend.onrender.com`
- ✅ API Docs: `https://your-backend.onrender.com/docs`
- ✅ Total Cost: **$0/month** (free tier)

**Next Steps**:
1. Share your Vercel URL with users
2. Monitor usage in platform dashboards
3. Set up custom domain (optional)
4. Add monitoring/analytics (optional)

Happy deploying! 🚀
