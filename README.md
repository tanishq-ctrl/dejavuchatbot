# Deja Vu Real Estate AI Chatbot

A professional, AI-powered Real Estate Chatbot built with **Next.js 14** (Frontend) and **FastAPI** (Backend). Features real-time property data, natural language processing, and intelligent lead capture.

## 🚀 Features

### Core Capabilities
- **🤖 AI-Powered Chat**: Powered by Google Gemini AI (gemini-2.5-flash-lite) for natural, conversational responses
- **🏠 Real-Time Property Data**: Integrates with PropertyFinder API via RapidAPI for live property listings
- **🎯 Smart Recommendations**: Intelligent filtering and scoring based on budget, location, bedrooms, and property type
- **📊 Property Clustering**: Groups properties (Value/Premium/Luxury) for smart suggestions
- **💼 Professional Lead Capture**: Enhanced form with Supabase integration for secure lead storage
- **✨ Rich Formatting**: Markdown support with **bold** and *italic* text for professional appearance

### Advanced Features
- **📈 Transparent Scoring**: 0-100 match scores with detailed breakdown explaining why each property was recommended
- **❤️ Shortlist & Compare**: Save favorite properties and compare up to 5 side-by-side with shareable links
- **💬 WhatsApp Handoff**: One-click WhatsApp integration to connect users directly with agents
- **🔄 Shareable Shortlists**: Generate shareable links for shortlisted properties (stored in Supabase)
- **📄 Property Details Pages**: Individual property pages with full details, image gallery, and map integration
- **🗺️ Map Integration**: Interactive Google Maps showing property location on detail pages
- **📑 Pagination & Infinite Scroll**: Backend pagination support with infinite scroll on frontend

### Data Sources
- **Real-Time API**: PropertyFinder API integration (when configured)
- **CSV Fallback**: 600+ property listings with property-themed images
- **Featured Properties**: Exclusive Deja Vu properties highlighted

## 🏗️ Architecture

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide Icons, Markdown rendering
- **Backend**: FastAPI, Pandas, Scikit-learn, Google Gemini AI, Supabase
- **Data Storage**: 
  - Properties: PropertyFinder API (with CSV fallback)
  - Leads: Supabase PostgreSQL (with CSV fallback)

## 📋 Prerequisites

- Python 3.8+
- Node.js 18+
- Supabase account (for lead storage)
- RapidAPI account (for PropertyFinder API - optional)
- Google Gemini API key (free tier available)
- Google Maps API key (optional - for map integration, has fallback)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd chatbot
```

### 2. Backend Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Create .env file
cd backend
cp .env.example .env  # Create from template if exists
```

**Configure environment variables in `backend/.env`:**

```env
# Gemini AI (Required for AI responses)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite

# Supabase (Required for lead & shortlist storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# PropertyFinder API (Optional - for real-time data)
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=uae-real-estate-api-propertyfinder-ae-data.p.rapidapi.com
USE_REALTIME_DATA=false
RAPIDAPI_MAX_RESULTS=50
RAPIDAPI_CACHE_MINUTES=30

# CORS (Frontend URL)
ALLOWED_ORIGINS=http://localhost:3000
```

**Configure environment variables in `frontend/.env.local`:**

```env
# API URL (optional - defaults to http://localhost:8000/api)
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# WhatsApp Agent Number (for WhatsApp handoff feature)
NEXT_PUBLIC_AGENT_WHATSAPP=9715XXXXXXXX

# Google Maps API Key (optional - for map integration on property pages)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Start backend server:**

```bash
cd backend
python -m uvicorn main:app --reload
```

*Backend running at http://localhost:8000*

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create .env.local (optional - for custom API URL)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local

# Start development server
npm run dev
```

*Frontend running at http://localhost:3000*

### 4. Setup Supabase (Lead & Shortlist Storage)

1. Create a project at [Supabase](https://supabase.com)
2. Go to SQL Editor
3. Run the SQL from `backend/data/supabase_schema.sql`:

```sql
-- Leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    interest TEXT NOT NULL,
    message TEXT,
    property_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON public.leads(property_id);

-- Shortlists table (for shareable shortlists)
CREATE TABLE IF NOT EXISTS public.shortlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    share_id TEXT NOT NULL UNIQUE,
    property_ids JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shortlists_share_id ON public.shortlists(share_id);
CREATE INDEX IF NOT EXISTS idx_shortlists_created_at ON public.shortlists(created_at DESC);
```

4. Get your Supabase URL and anon key from Project Settings → API
5. Add them to `backend/.env`

**Note**: If Supabase is not configured, leads will be saved to CSV and shortlists use in-memory storage as fallback.

## 📖 API Endpoints

### Core Endpoints
- `POST /api/chat` - Send chat message and get property recommendations (includes match scores and pagination)
  - Supports `limit` and `offset` parameters for pagination
  - Returns `PaginationInfo` with total count, has_more flag, etc.
- `GET /api/featured` - Get featured property listings
- `GET /api/properties/{id}` - Get individual property details by ID
- `POST /api/lead` - Capture lead information (saves to Supabase/CSV)

### Shortlist Endpoints
- `POST /api/shortlist/share` - Create a shareable shortlist link (max 5 properties)
- `GET /api/shortlist/share/{share_id}` - Retrieve properties from a shareable link

## 🎯 Usage Examples

### Chat Queries
- "2 bed apartment in Downtown under 2M"
- "Villa in Palm Jumeirah"
- "Studio for rent in Dubai Marina"
- "3 bedroom ready property in Business Bay"

### Transparent Scoring
Each property recommendation includes:
- **Match Score (0-100)**: Overall compatibility score
- **Score Breakdown**: Detailed factor-by-factor analysis
  - Budget Fit (35 pts): Price vs user budget
  - Location Match (25 pts): Exact/fuzzy location matching
  - Bedrooms Match (20 pts): Exact or ±1 bedroom matching
  - Property Type (10 pts): Type matching
  - Status Match (10 pts): Ready/Off-plan matching
- **Top Reasons**: 2-4 human-readable explanations
- **Expandable Details**: Click "Why this score?" for full breakdown

### Shortlist & Compare
- **Save Properties**: Click "Save to Shortlist" on any property card
- **Floating Button**: See shortlist count in bottom-right corner
- **Compare View**: Compare up to 5 properties side-by-side
- **Shareable Links**: Generate shareable URLs for shortlists
- **Persistent Storage**: Shortlists saved in localStorage and Supabase

### WhatsApp Handoff
- **Property Card**: "WhatsApp Agent" button on each property
- **Shortlist Drawer**: "Send shortlist on WhatsApp" button
- **Compare Page**: "Send on WhatsApp" button in header
- **Pre-filled Message**: Includes user criteria and selected properties
- **Professional Format**: Ready-to-send message template

### Property Details Page
Navigate to `/properties/[id]` for full property information:
- **Full Property Details**: Price, bedrooms, bathrooms, size, status, type
- **Image Gallery**: Property images with navigation arrows
- **Interactive Map**: Google Maps showing property location
- **Match Score Display**: Transparent scoring breakdown with top reasons
- **Action Buttons**: Show Interest, WhatsApp Agent, Save to Shortlist, Share
- **Related Properties**: Similar properties displayed at bottom
- **Responsive Design**: Beautiful UI optimized for all devices

### Lead Capture
When users click "Show Interest" on a property:
- Professional form with email/phone separation
- Optional message field
- Property details summary
- Secure storage in Supabase

### Pagination & Infinite Scroll
- **Backend Pagination**: `limit` and `offset` parameters on `/api/chat`
- **Frontend Support**: Infinite scroll and load more functionality
- **Performance**: Loads 20 properties per page by default
- **Smooth UX**: Loading states and error handling

## 📁 Project Structure

```
chatbot/
├── frontend/
│   ├── app/                    # Next.js app directory
│   │   ├── page.tsx           # Main chat interface
│   │   ├── compare/           # Compare page
│   │   │   └── page.tsx      # Side-by-side comparison
│   │   ├── properties/        # Property detail pages
│   │   │   └── [id]/          # Dynamic property routes
│   │   │       └── page.tsx  # Individual property page with map
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── chat/              # Chat components (Bubble, Input)
│   │   ├── property/          # Property components (Card, Map)
│   │   │   ├── PropertyCard.tsx    # Property card component
│   │   │   └── PropertyMap.tsx     # Google Maps integration
│   │   ├── shortlist/         # Shortlist components
│   │   │   ├── ShortlistButton.tsx    # Floating button
│   │   │   ├── ShortlistDrawer.tsx    # Shortlist drawer
│   │   │   └── CompareView.tsx        # Comparison table
│   │   └── ui/                # UI components (Modal, Toast)
│   └── lib/
│       ├── api.ts             # API client
│       ├── shortlist.tsx      # Shortlist state management
│       └── whatsapp.ts        # WhatsApp utility functions
├── backend/
│   ├── core/
│   │   ├── gemini_service.py      # Gemini AI integration
│   │   ├── intent_parser.py       # Intent parsing
│   │   ├── recommender.py         # Property recommendation engine (with scoring)
│   │   ├── propertyfinder_service.py  # PropertyFinder API client
│   │   └── supabase_service.py    # Supabase integration
│   ├── api/
│   │   ├── endpoints.py       # FastAPI routes
│   │   └── shortlist_store.py # In-memory shortlist fallback
│   ├── data/
│   │   ├── properties.csv     # Fallback property data
│   │   ├── leads.csv          # Fallback lead storage
│   │   └── supabase_schema.sql # Database schema
│   ├── tests/
│   │   └── test_scoring.py    # Scoring system tests
│   ├── main.py                # FastAPI app entry point
│   └── requirements.txt       # Python dependencies
├── SCORING_FEATURE.md         # Transparent scoring documentation
├── SHORTLIST_FEATURE.md       # Shortlist feature documentation
├── WHATSAPP_FEATURE.md        # WhatsApp handoff documentation
├── MAP_INTEGRATION.md         # Map integration setup guide
└── README.md                  # This file
```

## 🔧 Configuration

### Enable Real-Time Property Data

Set in `backend/.env`:
```env
USE_REALTIME_DATA=true
RAPIDAPI_KEY=your_key
```

### Customize Gemini Model

Set in `backend/.env`:
```env
GEMINI_MODEL=gemini-2.5-flash-lite  # Default
# Or: gemini-2.5-flash, gemini-2.5-pro, etc.
```

## 🛠️ Development

### Backend Development
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Running Tests
```bash
cd backend
python tests/test_scoring.py  # Test scoring system
```

### View API Docs
Visit http://localhost:8000/docs for interactive API documentation

## 📝 Lead Storage

### Supabase (Recommended)
- Secure PostgreSQL database
- Automatic timestamps
- Indexed for performance
- Configurable Row Level Security (RLS)

### CSV Fallback
- Saves to `backend/data/leads.csv`
- Used when Supabase not configured
- Includes all fields from the form

## 🎨 Features Highlights

### AI Responses
- Natural language generation with Gemini AI
- Markdown formatting with **bold** and *italic*
- Context-aware property recommendations
- Professional, engaging tone

### Property Display
- Beautiful property cards with images
- Price formatting (AED X.XM for large values)
- Featured/Exclusive badges
- Key details (bedrooms, bathrooms, size, status)
- **Match Score Badge**: 0-100 score with color coding
- **Top Reasons**: Quick explanations for why property matches
- **Score Breakdown**: Expandable detailed scoring (click "Why this score?")
- **Save to Shortlist**: One-click saving for later comparison
- **WhatsApp Agent**: Direct connection to sales team
- **Property Details Page**: Full property information with image gallery and map
- **Clickable Cards**: Navigate to property detail pages from cards

### Transparent Scoring System
- **Deterministic Scoring**: 0-100 match score (no randomness)
- **5-Factor Model**: Budget (35), Location (25), Bedrooms (20), Type (10), Status (10)
- **Visual Progress Bars**: Color-coded score indicators
- **Detailed Breakdown**: Factor-by-factor analysis with explanations
- **Human-Readable Reasons**: Top 2-4 reasons displayed automatically
- **Backward Compatible**: Works with existing property data

### Shortlist & Compare
- **Local Storage**: Persistent shortlist in browser
- **Compare View**: Side-by-side comparison of up to 5 properties
- **Shareable Links**: Generate URLs to share shortlists
- **Supabase Storage**: Backend storage for shared shortlists
- **Responsive Design**: Table view (desktop) and stacked cards (mobile)
- **Quick Actions**: Remove, compare, share options

### WhatsApp Handoff
- **Click-to-Chat**: One-click WhatsApp integration
- **Pre-filled Messages**: Includes user criteria and property details
- **Professional Template**: Ready-to-send message format
- **Multiple Entry Points**: Property card, shortlist drawer, compare page, property detail page
- **Toast Notifications**: User feedback on actions

### Map Integration
- **Interactive Google Maps**: Embedded map showing property location
- **Click to Open**: Button to open full Google Maps in new tab
- **Fallback UI**: Beautiful placeholder when API key not configured
- **Property Marker**: Visual indicator showing exact location
- **Responsive Design**: Works on all screen sizes
- **Loading States**: Smooth loading animations

### Pagination & Performance
- **Backend Pagination**: Efficient data loading with `limit` and `offset`
- **Infinite Scroll**: Automatic loading on scroll (optional)
- **Load More**: Manual load more button
- **Performance**: Loads 20 properties per page by default
- **Smooth UX**: Loading indicators and error handling

### Lead Form
- Professional design with icons
- Property summary card
- Email and phone separation
- Optional message field
- Loading states and validation

## 🔒 Security

- Environment variables for sensitive keys
- CORS configuration for allowed origins
- Input validation with Pydantic
- Supabase RLS support (optional)

## 📚 Additional Documentation

- `PROPERTYFINDER_API_SETUP.md` - PropertyFinder API setup guide
- `GEMINI_AI_SETUP.md` - Google Gemini AI setup instructions
- `SCORING_FEATURE.md` - Transparent scoring system documentation
- `SHORTLIST_FEATURE.md` - Shortlist and compare feature guide
- `WHATSAPP_FEATURE.md` - WhatsApp handoff integration guide
- `MAP_INTEGRATION.md` - Map integration setup and usage guide
- `backend/data/supabase_schema.sql` - Database schema (leads + shortlists)
- `CODEBASE_IMPROVEMENTS.md` - Code improvements and refactoring notes

## 🐛 Troubleshooting

### Gemini AI not working
- Check `GEMINI_API_KEY` is set correctly
- Verify API key is valid at https://makersuite.google.com/app/apikey
- Check logs for specific error messages
- System falls back to rule-based responses if Gemini unavailable

### Supabase errors
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Ensure `leads` table exists (run schema SQL)
- Check Supabase project is active
- System falls back to CSV if Supabase unavailable

### PropertyFinder API errors
- Verify `RAPIDAPI_KEY` is valid
- Check rate limits (429 errors)
- System falls back to CSV data automatically

### WhatsApp button not visible
- Ensure `NEXT_PUBLIC_AGENT_WHATSAPP` is set in `frontend/.env.local`
- Format: `9715XXXXXXXX` (country code + number)
- Restart frontend server after adding environment variable

### Shortlist not saving
- Check browser localStorage is enabled
- For shareable links, verify Supabase `shortlists` table exists
- System falls back to in-memory storage if Supabase unavailable

### Match scores not showing
- Scores are calculated for recommended properties (from `/api/chat`)
- Featured properties may not have scores (no intent criteria)
- Check browser console for API errors

### Map not loading
- Check that `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set correctly in `frontend/.env.local`
- Verify API key has Maps Embed API enabled in Google Cloud Console
- Map will show fallback placeholder if API key not configured (still functional)
- Check browser console for any CORS or API errors
- Ensure API key domain restrictions allow your domain

### Property detail page not loading
- Verify property ID is valid
- Check that `/api/properties/{id}` endpoint is accessible
- Check browser console for 404 or network errors
- Ensure backend server is running

## 🚀 Deployment

### Free Deployment Options

The application can be deployed for **free** using modern cloud platforms:

- **Frontend (Next.js)**: Deploy to [Vercel](https://vercel.com) (free tier, best for Next.js)
- **Backend (FastAPI)**: Deploy to [Render](https://render.com) or [Railway](https://railway.app) (free tiers available)
- **Database**: Already using Supabase (free tier)

**See `DEPLOYMENT.md` for complete step-by-step deployment guide.**

Quick Start:
1. Push code to GitHub
2. Deploy frontend to Vercel (connect GitHub repo, set root directory to `frontend`)
3. Deploy backend to Render (connect GitHub repo, set root directory to `backend`)
4. Add environment variables in each platform
5. Update `NEXT_PUBLIC_API_URL` in Vercel with your backend URL
6. Update `ALLOWED_ORIGINS` in backend with your Vercel URL

**Total Cost**: $0/month with free tiers! 🎉

## 📄 License

Private project for Deja Vu Properties

## 👥 Support

For issues or questions, check the logs or contact the development team.

---

**Built with ❤️ for Deja Vu Properties**
