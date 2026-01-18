# WhatsApp Handoff Feature

## Overview
This feature allows users to seamlessly hand off property inquiries to agents via WhatsApp with prefilled messages containing their preferences and selected properties.

## Features Implemented

### 1. WhatsApp Utility (`frontend/lib/whatsapp.ts`)
- **`buildWhatsAppMessage()`**: Constructs formatted messages with user criteria and property details
- **`getWhatsAppUrl()`**: Generates WhatsApp click-to-chat URLs with encoded messages
- **`getAgentWhatsApp()`**: Retrieves agent phone number from environment
- **`openWhatsApp()`**: Opens WhatsApp with prefilled message

### 2. Toast Notification System (`frontend/components/ui/Toast.tsx`)
- Minimal, lightweight toast component
- Supports success, error, warning, and info types
- Auto-dismiss with configurable duration
- `useToast()` hook for easy integration

### 3. PropertyCard Integration
- "WhatsApp Agent" button on each property card
- Only visible when `NEXT_PUBLIC_AGENT_WHATSAPP` is configured
- Includes user query and criteria context if available

### 4. ShortlistDrawer Integration
- "Send Shortlist on WhatsApp" button in footer
- Sends all shortlisted properties with summary
- Includes user query and criteria context

### 5. Compare Page Integration
- "Send on WhatsApp" button in header
- Sends comparison summary with all compared properties

## Message Format

The generated WhatsApp message follows this structure:

```
Hi Deja Vu Properties team, I'm interested in the following options:

Criteria: Location: Palm Jumeirah, 2 Bed, Apartment, Budget: AED 2.0M, Ready

Properties (3):
1. Luxury Villa - Palm Jumeirah
   Price: AED 1.5M
   2 Bed | 2 Bath | 1200 sqft
   ID: PROP_123

2. Modern Apartment - Palm Jumeirah
   Price: AED 2.2M
   2 Bed | 2 Bath | 1100 sqft
   ID: PROP_456

3. Beachfront Villa - Palm Jumeirah
   Price: AED 3.0M
   2 Bed | 3 Bath | 1500 sqft
   ID: PROP_789

Please share availability and next steps.
```

- Max 5 properties shown (truncates if more)
- Max ~900 characters (truncates if longer)
- Includes all relevant property details
- Professional formatting

## Setup

### 1. Environment Variable
Add to `frontend/.env.local`:
```env
NEXT_PUBLIC_AGENT_WHATSAPP=9715XXXXXXXX
```

**Note**: 
- Include country code (971 for UAE)
- No spaces, dashes, or special characters
- Example: `971501234567`

### 2. No Additional Dependencies
All required packages are already installed:
- React hooks (built-in)
- Lucide React (already in project)

## How to Test

### Test 1: PropertyCard WhatsApp Button
1. Set `NEXT_PUBLIC_AGENT_WHATSAPP` in `.env.local`
2. Restart frontend dev server
3. Browse properties
4. Verify "WhatsApp Agent" button appears on each property card
5. Click button
6. Verify toast notification: "Opening WhatsApp..."
7. Verify WhatsApp opens (web or app) with prefilled message
8. Verify message includes property details

### Test 2: Without Environment Variable
1. Remove or comment out `NEXT_PUBLIC_AGENT_WHATSAPP` in `.env.local`
2. Restart frontend dev server
3. Verify WhatsApp buttons are hidden
4. Verify no errors in console

### Test 3: Shortlist WhatsApp
1. Add 2-3 properties to shortlist
2. Open shortlist drawer
3. Verify "Send Shortlist on WhatsApp" button appears
4. Click button
5. Verify toast notification appears
6. Verify WhatsApp opens with all shortlisted properties
7. Verify message includes criteria if available

### Test 4: Compare Page WhatsApp
1. Go to compare page with 2-3 properties
2. Verify "Send on WhatsApp" button in header
3. Click button
4. Verify toast notification appears
5. Verify WhatsApp opens with comparison summary
6. Verify all compared properties are included

### Test 5: Message Truncation
1. Add 10+ properties to shortlist
2. Open shortlist drawer
3. Click "Send Shortlist on WhatsApp"
4. Verify message includes max 5 properties
5. Verify "... and X more" text if applicable
6. Verify total message length < 900 characters

### Test 6: Criteria Inclusion
1. Search for "2 bed apartment in Palm Jumeirah under 2M"
2. Add properties to shortlist
3. Open shortlist drawer
4. Click "Send Shortlist on WhatsApp"
5. Verify message includes:
   - User query
   - Location: Palm Jumeirah
   - Bedrooms: 2 Bed
   - Property type: Apartment
   - Budget: AED 2.0M

### Test 7: Toast Notifications
1. Click any WhatsApp button
2. Verify toast appears with "Opening WhatsApp..." message
3. Verify toast auto-dismisses after 3 seconds
4. Test error toast by removing env variable
5. Verify error toast appears: "WhatsApp number not configured"

### Test 8: URL Encoding
1. Search for properties with special characters in location
2. Send via WhatsApp
3. Verify message displays correctly (no encoding issues)
4. Verify URLs are properly encoded

## Files Created

- `frontend/lib/whatsapp.ts` - WhatsApp utility functions
- `frontend/components/ui/Toast.tsx` - Toast notification component

## Files Modified

- `frontend/components/property/PropertyCard.tsx` - Added WhatsApp button
- `frontend/components/shortlist/ShortlistDrawer.tsx` - Added WhatsApp button
- `frontend/components/shortlist/ShortlistButton.tsx` - Added context props
- `frontend/app/page.tsx` - Added toast, context tracking
- `frontend/app/compare/page.tsx` - Added WhatsApp button

## Technical Details

### URL Format
```
https://wa.me/971501234567?text=Encoded%20Message%20Here
```

### Message Truncation Logic
- Properties limited to 5
- Total message capped at ~900 characters
- Truncation happens at line breaks to preserve formatting
- "... (message truncated)" appended if truncated

### Context Passing
- User query stored in page state after chat interaction
- Intent criteria extracted from API response
- Passed down to PropertyCard components
- Available in ShortlistDrawer and Compare page

### Error Handling
- Graceful fallback if env variable missing (buttons hidden)
- Toast notifications for user feedback
- Console logging for debugging
- No crashes if WhatsApp fails to open

## Known Limitations

1. **WhatsApp Web vs App**: Behavior depends on user's device/browser
2. **Message Length**: WhatsApp has practical limits (~4096 chars), we cap at ~900 for readability
3. **Property Count**: Limited to 5 in message (can be adjusted)
4. **No Contact Info**: User contact info not captured unless provided via lead form
5. **No Expiry**: Shared links don't expire (same as shortlist sharing)

## Future Enhancements

1. Capture user contact info before sending to WhatsApp
2. Add property URLs to messages (if available)
3. Support multiple agent numbers (round-robin)
4. Track WhatsApp handoff analytics
5. Add email alternative for users without WhatsApp
6. Support custom message templates
7. Add image previews in message (WhatsApp Business API)

