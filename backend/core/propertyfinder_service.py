import httpx
import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import re

logger = logging.getLogger(__name__)

class PropertyFinderService:
    """Service to fetch real-time property data from PropertyFinder via RapidAPI"""
    
    def __init__(self):
        """
        Initialize PropertyFinder Service
        
        Note: You need ONE RapidAPI API key that works with ALL endpoints.
        Get it from: https://rapidapi.com
        Subscribe to: "UAE Real Estate API - PropertyFinder.ae Data"
        
        The different endpoints (search_properties, get_property, etc.) are functions,
        not different API keys. One key gives access to all endpoints.
        """
        # RapidAPI Configuration
        # ONE API key works with ALL PropertyFinder endpoints
        self.api_key = os.getenv("RAPIDAPI_KEY", "")
        
        # API host - get this from RapidAPI PropertyFinder API page
        # Common format: {api-name}.p.rapidapi.com
        self.api_host = os.getenv(
            "RAPIDAPI_HOST", 
            "uae-real-estate-api-propertyfinder-ae-data.p.rapidapi.com"
        )
        # API endpoint path - correct endpoint is /properties (not /search_properties)
        self.api_endpoint = os.getenv("RAPIDAPI_ENDPOINT", "/properties")
        self.base_url = f"https://{self.api_host}"
        
        # Cache configuration - longer cache to reduce API calls
        cache_minutes = int(os.getenv("RAPIDAPI_CACHE_MINUTES", "30"))  # Cache for 30 minutes by default
        self.cache_duration = timedelta(minutes=cache_minutes)
        self.cache = {}
        self.cache_timestamps = {}
        
        # API request limits - API returns max 50 per request, use that by default
        self.max_results_per_request = int(os.getenv("RAPIDAPI_MAX_RESULTS", "50"))
        
        if not self.api_key:
            logger.warning("RAPIDAPI_KEY not set. PropertyFinder API will not work. Set it in .env file.")
    
    async def fetch_properties(
        self, 
        filters: Optional[Dict[str, Any]] = None,
        offset: int = 0,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Fetch properties from PropertyFinder API
        
        API returns max 50 properties per request. Use offset for pagination.
        Response format: { "data": [...], "pagination": {...} }
        
        Note: Limited to RAPIDAPI_MAX_RESULTS (default 10) to avoid hitting rate limits.
        """
        # Limit results per request to avoid hitting API rate limits
        if limit is None:
            limit = self.max_results_per_request
        else:
            limit = min(limit, self.max_results_per_request)
        if not self.api_key:
            logger.error("RAPIDAPI_KEY not configured")
            return []
        
        try:
            # Check cache first
            cache_key = f"{str(filters)}_{offset}_{limit}"
            if self._is_cache_valid(cache_key):
                logger.info(f"Returning cached properties for: {cache_key}")
                return self.cache[cache_key]
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "x-rapidapi-key": self.api_key,
                    "x-rapidapi-host": self.api_host,
                    "Content-Type": "application/json"
                }
                
                # Build query parameters according to API docs
                params = {
                    "offset": offset,
                }
                
                # Add filters according to API documentation
                # Note: Filter availability depends on plan (Basic/Pro/Ultra/Mega)
                if filters:
                    if filters.get("listing_category"):
                        params["listing_category"] = filters["listing_category"]  # Rent, Buy, etc.
                    if filters.get("location_name") or filters.get("location"):
                        # Use location_name as per API docs (Ultra+ plan required)
                        params["location_name"] = filters.get("location_name") or filters.get("location")
                    if filters.get("property_type"):
                        params["property_type"] = filters["property_type"]  # Apartment, Villa, etc.
                    if filters.get("min_bedrooms") or filters.get("bedrooms"):
                        # API expects string, not integer
                        params["bedrooms"] = str(filters.get("min_bedrooms") or filters.get("bedrooms"))
                    if filters.get("min_bathrooms") or filters.get("bathrooms"):
                        # API expects string
                        params["bathrooms"] = str(filters.get("min_bathrooms") or filters.get("bathrooms"))
                    if filters.get("min_price") or filters.get("price_from"):
                        # Use price_from as per API docs (Mega plan required)
                        params["price_from"] = filters.get("price_from") or filters.get("min_price")
                    if filters.get("size"):
                        # Minimum size in sq ft (Mega plan required)
                        params["size"] = filters["size"]
                
                # Remove None values
                params = {k: v for k, v in params.items() if v is not None}
                
                # Use correct endpoint: /properties
                url = f"{self.base_url}{self.api_endpoint}"
                logger.debug(f"Fetching from: {url} with params: {params}")
                
                response = await client.get(url, headers=headers, params=params)
                
                if response.status_code == 401:
                    logger.error("Invalid RAPIDAPI_KEY")
                    return []
                
                if response.status_code == 404:
                    logger.error(f"Endpoint {self.api_endpoint} returned 404. Check API docs.")
                    return []
                
                if response.status_code == 429:
                    # Rate limit hit - try to use cached data if available
                    logger.warning(f"API rate limit (429) hit. Checking cache for cached results...")
                    if cache_key in self.cache:
                        cached_age = datetime.now() - self.cache_timestamps.get(cache_key, datetime.now())
                        if cached_age < self.cache_duration:
                            logger.info(f"Using cached data (age: {cached_age.total_seconds():.0f}s)")
                            return self.cache[cache_key]
                        else:
                            logger.warning(f"Cached data expired (age: {cached_age.total_seconds():.0f}s). Rate limit exceeded, returning empty.")
                    else:
                        logger.warning(f"Rate limit exceeded and no cache available. Please wait before retrying.")
                    return []
                
                response.raise_for_status()
                data = response.json()
                
                # API response format: { "data": [...], "pagination": {...} }
                properties = data.get("data", [])
                if isinstance(data, list):
                    # Fallback if response is directly a list
                    properties = data
                
                normalized = self._normalize_properties(properties)
                
                # Update cache
                self.cache[cache_key] = normalized
                self.cache_timestamps[cache_key] = datetime.now()
                
                logger.info(f"Fetched {len(normalized)} properties from PropertyFinder API")
                return normalized
                
        except httpx.TimeoutException:
            logger.error("PropertyFinder API timeout")
            return []
        except httpx.RequestError as e:
            logger.error(f"PropertyFinder API request failed: {e}")
            return []
        except Exception as e:
            logger.error(f"Error fetching properties: {e}", exc_info=True)
            return []
    
    async def fetch_featured_properties(self, limit: int = 3) -> List[Dict[str, Any]]:
        """Fetch featured/promoted properties
        
        API doesn't have a direct featured filter, so we fetch properties
        and filter by is_featured or is_premium flags
        
        Limited to max_results_per_request to avoid hitting rate limits.
        """
        # Limit to configured max results to avoid API rate limits
        fetch_limit = min(limit * 2, self.max_results_per_request)  # Fetch a bit more to filter
        
        # Fetch properties and filter for featured ones
        # Note: Basic plan doesn't support filters, so we fetch all and filter client-side
        properties = await self.fetch_properties(
            filters={},  # No filters for Basic plan
            offset=0,
            limit=fetch_limit
        )
        
        # Filter for featured/premium properties if available
        if properties:
            # Ensure all properties have required fields
            for prop in properties:
                if "cluster_label" not in prop:
                    prop["cluster_label"] = None
                if "match_reasons" not in prop:
                    prop["match_reasons"] = []
            
            featured = [p for p in properties if p.get("featured", False) or p.get("is_premium", False)]
            if featured:
                return featured[:limit]
            # If no featured found, return first few properties
            return properties[:limit]
        
        return []
    
    def _normalize_properties(self, raw_properties: List[Dict]) -> List[Dict[str, Any]]:
        """Normalize PropertyFinder API response to match our Property model
        
        API response structure:
        {
          "property_id": "15259544",
          "title": "...",
          "price": "1480000.00",
          "currency": "AED",
          "bedrooms": "3",
          "bathrooms": "5",
          "size": "3014.00",
          "location": {
            "name": "Al Helio 2",
            "full_name": "Al Helio 2, Al Helio, Ajman",
            "coordinates": {"lat": 25.39, "lon": 55.59}
          },
          "images": [{"medium_image_url": "..."}],
          ...
        }
        """
        normalized = []
        
        for prop in raw_properties:
            try:
                # Extract location data - handle None location
                location = prop.get("location") or {}
                if not isinstance(location, dict):
                    location = {}
                
                location_name = location.get("name", "") if location else ""
                location_full = location.get("full_name", "") if location else ""
                coords = location.get("coordinates", {}) if location else {}
                if not isinstance(coords, dict):
                    coords = {}
                
                # Parse location for city/community
                city = "Dubai"
                community = location_name or ""
                if location_full:
                    parts = [p.strip() for p in location_full.split(",") if p.strip()]
                    if len(parts) > 1:
                        community = parts[0] if parts[0] else location_name
                        city = parts[-1] if parts[-1] else "Dubai"
                
                # Extract image - handle None or empty images
                images = prop.get("images") or []
                if not isinstance(images, list):
                    images = []
                image_url = None
                if images and len(images) > 0:
                    first_image = images[0] if isinstance(images[0], dict) else {}
                    image_url = first_image.get("medium_image_url") or first_image.get("small_image_url")
                
                # Parse bedrooms - handle "studio", "None", None, etc.
                bedrooms_str = prop.get("bedrooms")
                bedrooms = 0
                if bedrooms_str is not None:
                    bedrooms_str_lower = str(bedrooms_str).lower().strip()
                    if bedrooms_str_lower in ["studio", "0", "none", ""]:
                        bedrooms = 0
                    else:
                        try:
                            bedrooms = int(float(bedrooms_str))
                        except (ValueError, TypeError):
                            bedrooms = 0
                
                # Parse bathrooms - handle None, "None", etc.
                bathrooms_str = prop.get("bathrooms")
                bathrooms = 0
                if bathrooms_str is not None:
                    bathrooms_str_lower = str(bathrooms_str).lower().strip()
                    if bathrooms_str_lower in ["none", ""]:
                        bathrooms = 0
                    else:
                        try:
                            bathrooms = int(float(bathrooms_str))
                        except (ValueError, TypeError):
                            bathrooms = 0
                
                # Normalize property data
                normalized_prop = {
                    "id": str(prop.get("property_id") or prop.get("index") or ""),
                    "title": prop.get("title") or "Property",
                    "price_aed": self._parse_price(prop.get("price")),
                    "community": community or "Dubai",
                    "city": city or "Dubai",
                    "property_type": prop.get("property_type") or "Apartment",
                    "bedrooms": bedrooms,
                    "bathrooms": bathrooms,
                    "size_sqft": self._parse_size(prop.get("size")),
                    "image_url": image_url,
                    "featured": bool(prop.get("is_featured", False) or prop.get("is_premium", False)),
                    "cluster_label": None,  # Will be set by clustering if enough properties
                    "status": prop.get("completion_status") or "Ready",
                    "latitude": coords.get("lat") or coords.get("latitude") if coords else None,
                    "longitude": coords.get("lon") or coords.get("longitude") if coords else None,
                    "developer": "",  # Not in API response
                    "handover": prop.get("listing_date"),  # Use listing date as handover estimate
                    "payment_plan": "",
                    "amenities": prop.get("amenities", "").split(",") if prop.get("amenities") else [],
                    "listing_category": prop.get("listing_category") or "Buy",  # Rent, Buy, etc.
                    "match_reasons": [],  # Will be populated by recommender if needed
                }
                normalized.append(normalized_prop)
            except Exception as e:
                logger.warning(f"Error normalizing property {prop.get('property_id', 'unknown')}: {e}")
                continue
        
        return normalized
    
    def _parse_price(self, price_value: Any) -> Optional[float]:
        """Parse price from various formats"""
        if price_value is None:
            return None
        if isinstance(price_value, (int, float)):
            return float(price_value)
        if isinstance(price_value, str):
            # Remove currency symbols and commas
            cleaned = price_value.replace(",", "").replace("AED", "").replace("$", "").replace("USD", "").strip()
            try:
                return float(cleaned)
            except ValueError:
                return None
        return None
    
    def _parse_size(self, size_value: Any) -> float:
        """Parse size from various formats"""
        if size_value is None:
            return 1.0  # Avoid division by zero
        if isinstance(size_value, (int, float)):
            return float(max(size_value, 1.0))  # Ensure at least 1
        if isinstance(size_value, str):
            # Extract number from string like "1500 sqft" or "1500"
            match = re.search(r'(\d+(?:\.\d+)?)', str(size_value))
            if match:
                size = float(match.group(1))
                return max(size, 1.0)  # Ensure at least 1
        return 1.0
    
    def _get_image_url(self, prop: Dict) -> Optional[str]:
        """Extract image URL from property data"""
        # PropertyFinder may have multiple image formats
        if prop.get("image_url"):
            return prop["image_url"]
        if prop.get("thumbnail"):
            return prop["thumbnail"]
        if prop.get("main_image"):
            return prop["main_image"]
        if prop.get("images") and isinstance(prop["images"], list) and len(prop["images"]) > 0:
            return prop["images"][0]
        if prop.get("photos") and isinstance(prop["photos"], list) and len(prop["photos"]) > 0:
            return prop["photos"][0]
        return None
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached data is still valid"""
        if cache_key not in self.cache or cache_key not in self.cache_timestamps:
            return False
        age = datetime.now() - self.cache_timestamps[cache_key]
        return age < self.cache_duration
    
    def clear_cache(self):
        """Clear the cache"""
        self.cache.clear()
        self.cache_timestamps.clear()

