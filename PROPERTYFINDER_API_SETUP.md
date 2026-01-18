# PropertyFinder API Setup Guide

## Important: ONE API Key, Multiple Endpoints

**You only need ONE API key from RapidAPI to use ALL PropertyFinder endpoints.**

### What You're Seeing in RapidAPI

In RapidAPI, you'll see many endpoints like:
- `search_properties` (search for properties)
- `get_property` (get a single property)
- `get_similar_properties` (find similar properties)
- `list_brokers` (list brokers)
- `list_agents` (list agents)

**These are different FUNCTIONS, not different API keys.**

### How It Works

1. **Get ONE API Key:**
   - Go to https://rapidapi.com
   - Sign up/log in
   - Subscribe to "UAE Real Estate API - PropertyFinder.ae Data"
   - Copy your API key (you'll see it in the dashboard)

2. **Use That Same Key for All Endpoints:**
   - All endpoints use the same `x-rapidapi-key` header
   - Your subscription gives you access to ALL endpoints
   - You don't need separate keys for each endpoint

3. **Set It in Your .env File:**
   ```env
   RAPIDAPI_KEY=your_single_api_key_here
   ```

### Multiple API Keys (Optional)

If you have multiple API keys (e.g., dev, staging, prod), you can:

1. **Use Different Keys for Different Environments:**
   ```env
   # Development
   RAPIDAPI_KEY=dev_key_here
   
   # Production
   RAPIDAPI_KEY=prod_key_here
   ```

2. **Or Use Environment Variables:**
   ```bash
   export RAPIDAPI_KEY=your_key_here
   ```

### Finding Your API Key

1. Log into RapidAPI
2. Go to your Dashboard
3. Find "UAE Real Estate API - PropertyFinder.ae Data" in "My Apps"
4. Click on it to see your API key
5. Copy the key (it looks like: `abc123def456ghi789...`)

### API Host

You also need the API host value (usually shown on the API page):
- Look for `x-rapidapi-host` header value
- Default: `market-data-point1-market-data-point-default-api.p.rapidapi.com`
- Set in `.env` as `RAPIDAPI_HOST` if different

### Quick Start

1. Get your API key from RapidAPI
2. Create `backend/.env` file:
   ```bash
   cd backend
   cp .env.example .env
   ```
3. Edit `.env` and add your key:
   ```env
   RAPIDAPI_KEY=your_actual_key_here
   USE_REALTIME_DATA=true
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Start the server:
   ```bash
   python main.py
   ```

### Troubleshooting

- **"Invalid API key"**: Make sure you copied the entire key correctly
- **"No properties returned"**: Check that your subscription is active
- **API errors**: Check the RapidAPI dashboard for rate limits and quota usage

### Need Help?

- Check RapidAPI API documentation for endpoint details
- Verify your API key is active in RapidAPI dashboard
- Make sure your subscription plan supports the endpoints you're using
