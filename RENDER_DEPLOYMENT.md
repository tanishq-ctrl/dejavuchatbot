# 🚀 Render Backend Deployment Guide

Step-by-step guide to deploy your FastAPI backend to Render (FREE tier).

## Step 1: Create Render Account

1. Go to **[render.com](https://render.com)**
2. Click **"Get Started for Free"** or **"Sign Up"**
3. Choose **"Sign up with GitHub"** (easiest option)
4. Authorize Render to access your GitHub repositories

## Step 2: Create New Web Service

1. Once logged in, click **"New +"** button (top right)
2. Select **"Web Service"** from the dropdown
3. You'll see "Connect a repository" page

## Step 3: Connect Your GitHub Repository

1. Under **"Public Git repositories"**, find:
   - **tanishq-ctrl/xyzchatbot**
   - Or search for "xyzchatbot"
2. Click **"Connect"** next to your repository
3. If you don't see it, click **"Configure account"** and grant access

## Step 4: Configure the Service

Fill in the following settings:

### Basic Settings:
- **Name**: `xyz-backend` (or any name you like)
- **Region**: Choose closest to you (e.g., **Oregon**, **Singapore**, **Frankfurt**)
- **Branch**: `main` (should auto-detect)

### Build & Deploy Settings:
- **Runtime**: Select **Python 3** (should auto-detect)

### **IMPORTANT: Set Root Directory**
- Look for **"Root Directory"** field
- Click on it or look for "Advanced" options
- Type: `backend` (exactly, lowercase, no slashes)
- This tells Render where your Python code is

### Build Settings:
- **Build Command**: 
  ```bash
  pip install -r requirements.txt
  ```
  (Should auto-fill when Root Directory is set)

- **Start Command**: 
  ```bash
  uvicorn main:app --host 0.0.0.0 --port $PORT
  ```
  (This should also auto-fill)

### Plan:
- Select **Free** plan (under "Starter" or "Free" section)

## Step 5: Add Environment Variables

**CRITICAL**: Before deploying, add all environment variables!

1. Scroll down to **"Environment Variables"** section
2. Click **"Add Environment Variable"** for each one:

### Required Variables:

#### 1. Gemini AI (Required)
```
Key: GEMINI_API_KEY
Value: your_gemini_api_key_here
```

```
Key: GEMINI_MODEL
Value: gemini-2.5-flash-lite
```

#### 2. Supabase (Required)
```
Key: SUPABASE_URL
Value: https://your-project.supabase.co
```

```
Key: SUPABASE_KEY
Value: your-supabase-anon-key
```

#### 3. PropertyFinder API (Optional - if using real-time data)
```
Key: RAPIDAPI_KEY
Value: your_rapidapi_key
```

```
Key: RAPIDAPI_HOST
Value: uae-real-estate-api-propertyfinder-ae-data.p.rapidapi.com
```

```
Key: USE_REALTIME_DATA
Value: false
```

```
Key: RAPIDAPI_MAX_RESULTS
Value: 50
```

```
Key: RAPIDAPI_CACHE_MINUTES
Value: 30
```

#### 4. CORS (Required - after frontend is deployed)
```
Key: ALLOWED_ORIGINS
Value: https://your-frontend.vercel.app,http://localhost:3000
```

**Note**: Replace `your-frontend.vercel.app` with your actual Vercel frontend URL after you deploy it. You can update this later.

### Optional Variables:
```
Key: ENV
Value: production
```

```
Key: PYTHON_VERSION
Value: 3.11.0
```
(Or whatever Python version you're using)

## Step 6: Deploy

1. Review all settings (especially Root Directory: `backend`)
2. Click **"Create Web Service"** button (bottom right)
3. Render will start building your backend
4. You'll see build logs in real-time

## Step 7: Wait for Deployment

1. **Build Phase** (2-5 minutes):
   - Installing Python dependencies
   - You'll see: "Installing dependencies from requirements.txt"
   - Wait for: "✓ Build successful"

2. **Deploy Phase** (1-2 minutes):
   - Starting the web service
   - You'll see: "Starting service..."

3. **Complete**:
   - Green status: "Live"
   - You'll see your backend URL: `https://your-backend.onrender.com`

## Step 8: Test Your Backend

1. Click on your service URL (e.g., `https://your-backend.onrender.com`)
2. You should see: `{"message": "XYZ API is running"}`
3. Test API docs: `https://your-backend.onrender.com/docs`
4. Test an endpoint: `https://your-backend.onrender.com/api/featured`

## Step 9: Update Frontend API URL

After backend is deployed:

1. Go to **Vercel Dashboard**
2. Select your frontend project
3. Go to **Settings → Environment Variables**
4. Add/Update:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
   ```
5. Save and redeploy frontend

## Step 10: Update Backend CORS

After frontend is deployed:

1. Go back to **Render Dashboard**
2. Select your backend service
3. Go to **Environment** tab
4. Find `ALLOWED_ORIGINS` variable
5. Click **Edit** (pencil icon)
6. Update value to:
   ```
   https://your-frontend.vercel.app,http://localhost:3000
   ```
7. Replace `your-frontend.vercel.app` with your actual Vercel URL
8. Click **Save Changes**
9. Render will automatically redeploy

## ✅ Troubleshooting

### Build Fails: "Module not found"
- Check that **Root Directory** is set to `backend`
- Verify `requirements.txt` exists in `backend/` directory

### Build Fails: "Command not found"
- Make sure **Start Command** is correct:
  ```bash
  uvicorn main:app --host 0.0.0.0 --port $PORT
  ```

### Service Won't Start
- Check build logs for errors
- Verify all environment variables are set
- Check that `main.py` exists in `backend/` directory

### 502 Bad Gateway
- Service might be spinning up (first request on free tier takes 30-50 seconds)
- Wait 1 minute and try again
- Check service logs in Render dashboard

### CORS Errors from Frontend
- Verify `ALLOWED_ORIGINS` includes your Vercel URL
- Check that it's formatted correctly (comma-separated, no spaces except after commas)
- Redeploy backend after updating CORS

### API Returns 404
- Make sure you're accessing: `https://your-backend.onrender.com/api/endpoint`
- Not just: `https://your-backend.onrender.com/endpoint`
- The API is prefixed with `/api`

## 📝 Notes About Free Tier

- **Spins Down**: After 15 minutes of inactivity
- **Wake-up Time**: First request after spin-down takes 30-50 seconds
- **Build Time**: Usually 2-5 minutes
- **Memory**: 512MB RAM
- **Monthly Limit**: 750 hours free (plenty for testing)

## 🎉 Success Checklist

- [ ] Backend deployed successfully
- [ ] Can access: `https://your-backend.onrender.com`
- [ ] API docs work: `https://your-backend.onrender.com/docs`
- [ ] Test endpoint works: `https://your-backend.onrender.com/api/featured`
- [ ] Updated frontend API URL in Vercel
- [ ] Updated CORS in Render with Vercel URL
- [ ] Frontend can communicate with backend

## 🆘 Need Help?

- Check Render logs: **Dashboard → Your Service → Logs**
- Check Vercel logs: **Dashboard → Your Project → Deployments → Logs**
- Test backend directly: `https://your-backend.onrender.com/docs`

---

**Your backend URL will be**: `https://your-service-name.onrender.com`

Save this URL - you'll need it for the frontend environment variables! 🚀
