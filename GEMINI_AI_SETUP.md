# Gemini AI Integration Setup Guide

## Overview
The chatbot now uses Google's Gemini AI (free tier) to generate natural, conversational responses instead of rule-based templates.

## Setup Instructions

### 1. Install Gemini Package

```bash
cd backend
pip install google-generativeai
# OR install all dependencies
pip install -r requirements.txt
```

### 2. Get Your Free Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated API key

### 3. Add API Key to Environment Variables

Add to `backend/.env` file:

```env
# Gemini AI Configuration (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Choose model (default is gemini-1.5-flash)
# gemini-1.5-flash: Fast, free tier (recommended)
# gemini-1.5-pro: Better quality, still free tier
GEMINI_MODEL=gemini-1.5-flash
```

### 4. Restart Backend Server

After adding the API key, restart your FastAPI server:

```bash
cd backend
python -m uvicorn main:app --reload
```

## How It Works

### Without Gemini API Key:
- Falls back to rule-based responses
- Still functional but less natural

### With Gemini API Key:
- Generates natural, conversational responses
- Context-aware property recommendations
- Highlights exclusive/featured properties
- More engaging and helpful

## Features

✨ **Natural Conversations**: Responses feel more human-like  
🎯 **Context Aware**: Understands user intent better  
🏆 **Property Highlighting**: Emphasizes exclusive/featured properties  
💡 **Smart Recommendations**: Explains why properties match  
🔄 **Automatic Fallback**: Works even if Gemini unavailable  

## Example

**User**: "I'm looking for a 2 bedroom apartment in Palm Jumeirah"

**Gemini Response**: *"I'd be happy to help you find the perfect 2-bedroom apartment in Palm Jumeirah! I've found some excellent options that match your criteria. Palm Jumeirah is one of Dubai's most prestigious locations, offering stunning sea views and world-class amenities..."*

## Troubleshooting

### "GEMINI_API_KEY not set" warning
- Check your `.env` file has the correct key
- Restart the server after adding the key

### "ModuleNotFoundError: google.generativeai"
- Run: `pip install google-generativeai`

### Gemini returns empty responses
- Check API key is valid
- Check internet connection
- System falls back to rule-based responses automatically

## Free Tier Limits

- **gemini-1.5-flash**: 15 RPM (requests per minute), 1M TPM (tokens per minute)
- **gemini-1.5-pro**: 2 RPM, 32K TPM
- More than enough for personal/production use!

## Files Modified

- ✅ `backend/core/gemini_service.py` (NEW)
- ✅ `backend/api/endpoints.py` (UPDATED)
- ✅ `backend/requirements.txt` (UPDATED)

