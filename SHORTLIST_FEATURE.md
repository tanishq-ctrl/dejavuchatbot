# Shortlist + Compare Feature

## Overview
This feature allows users to save properties to a shortlist, compare them side-by-side, and share shortlists with others via URL.

## Features Implemented

### Frontend
1. **Shortlist Store** (`frontend/lib/shortlist.tsx`)
   - React Context + localStorage for persistence
   - Toggle, add, remove, clear operations
   - Persists across page refreshes

2. **PropertyCard Updates** (`frontend/components/property/PropertyCard.tsx`)
   - Heart icon button in top-right corner
   - "Save to Shortlist" / "Saved ✓" button below "Show Interest"
   - Visual feedback when property is shortlisted

3. **ShortlistButton** (`frontend/components/shortlist/ShortlistButton.tsx`)
   - Floating button showing shortlist count
   - Opens ShortlistDrawer on click
   - Only visible when shortlist has items

4. **ShortlistDrawer** (`frontend/components/shortlist/ShortlistDrawer.tsx`)
   - Slide-out drawer from right
   - Lists all shortlisted properties
   - Select properties for comparison (up to 5)
   - Share shortlist functionality
   - Remove individual items or clear all
   - Confirmation dialog for clear action

5. **CompareView** (`frontend/components/shortlist/CompareView.tsx`)
   - Responsive table view (desktop)
   - Stacked cards view (mobile)
   - Shows: Price, Bedrooms, Bathrooms, Size, Price/sqft, Location, Type, Status, Badges
   - Remove properties from comparison

6. **Compare Page** (`frontend/app/compare/page.tsx`)
   - Full-page comparison view
   - Supports loading from:
     - Shortlist store (all items or selected)
     - Shared shortlist via `share_id` query param
   - Handles loading states and errors

### Backend
1. **Shortlist Endpoints** (`backend/api/endpoints.py`)
   - `POST /api/shortlist/share` - Create shareable shortlist
   - `GET /api/shortlist/share/{share_id}` - Retrieve shared shortlist

2. **Supabase Service** (`backend/core/supabase_service.py`)
   - `save_shortlist()` - Save shortlist to Supabase
   - `get_shortlist()` - Retrieve shortlist from Supabase

3. **In-Memory Store** (`backend/api/shortlist_store.py`)
   - Fallback for development when Supabase not configured
   - Stores shortlists in memory (lost on restart)

4. **Database Schema** (`backend/data/supabase_schema.sql`)
   - `shortlists` table with:
     - `id` (UUID primary key)
     - `share_id` (TEXT, unique)
     - `property_ids` (JSONB array)
     - `created_at` (timestamp)
   - Indexes on `share_id` and `created_at`

## Setup Instructions

### 1. Database Setup (Supabase)
Run the SQL from `backend/data/supabase_schema.sql` in your Supabase SQL Editor to create the `shortlists` table.

### 2. Environment Variables
Ensure Supabase credentials are set in `backend/.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### 3. No Additional Dependencies
All required packages are already in `requirements.txt` and `package.json`.

## How to Test

### Test 1: Basic Shortlist Functionality
1. Open the app at `http://localhost:3000`
2. Browse properties or search for properties
3. Click the heart icon on a property card (top-right corner)
4. Verify the property is added to shortlist
5. Click the "♡ Save to Shortlist" button on another property
6. Verify both are saved

### Test 2: Floating Button & Drawer
1. Add 2-3 properties to shortlist
2. Verify floating "Shortlist (N)" button appears at bottom-right
3. Click the floating button
4. Verify drawer opens from right side
5. Verify all shortlisted properties are listed
6. Verify property details are displayed (image, title, price)

### Test 3: Compare Functionality
1. Open shortlist drawer
2. Select 2-3 properties using the compare icon button
3. Click "Compare X Properties" button
4. Verify redirect to `/compare` page
5. Verify properties displayed side-by-side (desktop) or stacked (mobile)
6. Verify all comparison fields are visible:
   - Price (AED)
   - Bedrooms
   - Bathrooms
   - Size (sqft)
   - Price/sqft
   - Location/Community
   - Property Type
   - Status (Ready/Off-Plan)
   - Badges (Featured/Exclusive)

### Test 4: Remove from Shortlist
1. In shortlist drawer, click trash icon on a property
2. Verify property is removed
3. In compare view, click remove button
4. Verify property is removed from comparison and shortlist

### Test 5: Clear All
1. Add multiple properties to shortlist
2. Open shortlist drawer
3. Click "Clear All" button
4. Verify confirmation dialog appears
5. Click "Clear All" in dialog
6. Verify all properties removed
7. Verify drawer closes
8. Verify floating button disappears

### Test 6: Share Shortlist
1. Add 2-3 properties to shortlist
2. Open shortlist drawer
3. Click "Share" button
4. Wait for share URL to be generated
5. Verify shareable link appears in drawer
6. Click copy button
7. Verify URL is copied to clipboard
8. Open new incognito/private window
9. Paste URL and verify shared shortlist loads

### Test 7: Persistence
1. Add properties to shortlist
2. Refresh the page (F5 or Cmd+R)
3. Verify properties remain in shortlist
4. Verify floating button shows correct count
5. Close browser tab completely
6. Reopen and verify shortlist persists

### Test 8: Maximum 5 Properties
1. Add 6 properties to shortlist
2. Open shortlist drawer
3. Try to select all 6 for comparison
4. Verify only first 5 can be selected
5. Verify 6th property's compare button is disabled

### Test 9: Responsive Design
1. Test on desktop (wide screen):
   - Verify table view in compare page
   - Verify properties side-by-side
2. Test on mobile/narrow screen:
   - Verify stacked cards in compare page
   - Verify drawer is full-width
   - Verify floating button is appropriately sized

### Test 10: Error Handling
1. Test with Supabase not configured:
   - Verify shortlist still works (localStorage only)
   - Verify share creates in-memory link (dev only)
2. Test with invalid share_id:
   - Verify error message displayed
   - Verify fallback to local shortlist works

## Edge Cases Handled

1. **Empty Shortlist**: Button hidden, drawer shows empty state
2. **Missing Property Data**: Graceful handling of null/undefined fields
3. **Price Calculation**: Handles division by zero for price/sqft
4. **Image Loading**: Fallback to placeholder when image fails
5. **Network Errors**: Fallback to localStorage when API fails
6. **Max Properties**: Prevents selecting more than 5 for comparison
7. **Share ID Collision**: UUID-based IDs minimize collisions
8. **Expired Shares**: In-memory store can be cleared (Supabase handles expiry)

## Known Limitations

1. **In-Memory Store**: Data lost on server restart (use Supabase for production)
2. **No Expiry**: Shared shortlists don't expire automatically (can be added later)
3. **Max 5 Properties**: Hard limit for comparison (can be adjusted if needed)
4. **No Property Updates**: If property data changes, shared shortlists show old data

## Future Enhancements

1. Add expiry to shared shortlists (e.g., 7 days)
2. Email shortlist feature
3. Print/PDF export of comparison
4. Add more comparison fields (ROI, amenities, etc.)
5. Social sharing (WhatsApp, Email, etc.)
6. Shortlist notes/comments per property
