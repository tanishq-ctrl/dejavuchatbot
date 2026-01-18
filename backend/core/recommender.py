import pandas as pd
import os
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class RecommenderEngine:
    def __init__(self, data_path=None, propertyfinder_service=None, use_realtime=None):
        """
        Initialize with either real-time PropertyFinder service or CSV fallback
        
        Args:
            data_path: Path to CSV file (fallback)
            propertyfinder_service: PropertyFinderService instance for real-time data
            use_realtime: Whether to use real-time data or CSV (None = auto-detect)
        """
        self.use_realtime = use_realtime
        self.propertyfinder_service = propertyfinder_service
        
        # Auto-detect: use real-time if service is provided
        if self.use_realtime is None:
            self.use_realtime = propertyfinder_service is not None and bool(os.getenv("RAPIDAPI_KEY", ""))
        
        self.df = pd.DataFrame()
        
        # Load CSV as fallback if not using real-time or as backup
        if not self.use_realtime or os.getenv("FALLBACK_TO_CSV", "true").lower() == "true":
            self._load_from_csv(data_path)
    
    def _load_from_csv(self, data_path=None):
        """Load data from CSV (fallback method)"""
        if data_path is None:
            # Try multiple possible paths
            possible_paths = [
                "backend/data/properties.csv",  # From root directory
                "data/properties.csv",          # From backend directory
                os.path.join(os.path.dirname(__file__), "..", "data", "properties.csv")  # Relative to this file
            ]
            
            for path in possible_paths:
                if os.path.exists(path):
                    data_path = path
                    break
            
            if data_path is None or not os.path.exists(data_path):
                # Try to find it by checking common locations
                for path in possible_paths:
                    abs_path = os.path.abspath(path)
                    if os.path.exists(abs_path):
                        data_path = abs_path
                        break
                
                if data_path is None or not os.path.exists(data_path):
                    logger.warning(f"Could not find properties.csv for fallback. Tried: {possible_paths}")
                    return
            
        try:
            self.df = pd.read_csv(data_path)
            self.df['bedrooms'] = pd.to_numeric(self.df['bedrooms'], errors='coerce').fillna(0)
            self.df['price_aed'] = pd.to_numeric(self.df['price_aed'], errors='coerce')
            # Convert featured column to boolean if it's a string
            if self.df['featured'].dtype == 'object':
                self.df['featured'] = self.df['featured'].astype(str).map({'True': True, 'False': False, 'true': True, 'false': False}).fillna(False)
            self._perform_clustering(self.df)
            logger.info(f"Loaded {len(self.df)} properties from CSV")
        except Exception as e:
            logger.warning(f"CSV Load Error (using as fallback): {e}")
            self.df = pd.DataFrame()

    def _perform_clustering(self, df: pd.DataFrame):
        """Perform clustering on DataFrame"""
        if df.empty or len(df) < 10:
            if 'cluster_label' not in df.columns:
                df['cluster_label'] = "General"
            return
        
        try:
            from sklearn.cluster import KMeans
            from sklearn.preprocessing import StandardScaler
            
            # Convert size_sqft to numeric and avoid division by zero
            df['size_sqft'] = pd.to_numeric(df.get('size_sqft', 1), errors='coerce').fillna(1)
            df['size_sqft'] = df['size_sqft'].replace(0, 1)  # Replace zeros to avoid division by zero
            
            if 'price_aed' not in df.columns or 'size_sqft' not in df.columns:
                df['cluster_label'] = "General"
                return
            
            df['price_per_sqft'] = df['price_aed'] / df['size_sqft']
            features = df[['price_aed', 'size_sqft', 'price_per_sqft']].fillna(0)
            
            scaler = StandardScaler()
            features_scaled = scaler.fit_transform(features)
            
            kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
            df['cluster_id'] = kmeans.fit_predict(features_scaled)
            
            # Label based on price
            centers = df.groupby('cluster_id')['price_aed'].mean().sort_values()
            labels = {}
            names = ["Value", "Mid-Range", "Premium", "Luxury"]
            for i, (cid, _) in enumerate(centers.items()):
                labels[cid] = names[i] if i < len(names) else "General"
            
            df['cluster_label'] = df['cluster_id'].map(labels)
            
        except ImportError:
            logger.warning("Sklearn not installed, skipping clustering")
            df['cluster_label'] = "General"
        except Exception as e:
            logger.warning(f"Clustering error: {e}")
            df['cluster_label'] = "General"
    
    async def _load_realtime_data(self, filters: Optional[Dict[str, Any]] = None) -> pd.DataFrame:
        """Load data from PropertyFinder API"""
        if not self.propertyfinder_service:
            logger.warning("PropertyFinderService not configured, falling back to CSV")
            return self.df
        
        try:
            # Use configured max results limit (default 50, API max per request)
            max_results = int(os.getenv("RAPIDAPI_MAX_RESULTS", "50"))
            properties = await self.propertyfinder_service.fetch_properties(filters, offset=0, limit=max_results)
            
            if not properties:
                logger.warning("No properties fetched from API, using CSV fallback")
                return self.df
            
            df = pd.DataFrame(properties)
            
            # Ensure all required columns exist
            if df.empty:
                return self.df
            
            # Normalize data types
            df['bedrooms'] = pd.to_numeric(df.get('bedrooms', 0), errors='coerce').fillna(0)
            df['price_aed'] = pd.to_numeric(df.get('price_aed', 0), errors='coerce')
            df['size_sqft'] = pd.to_numeric(df.get('size_sqft', 1), errors='coerce').fillna(1)
            df['size_sqft'] = df['size_sqft'].replace(0, 1)  # Avoid division by zero
            df['featured'] = df.get('featured', False).fillna(False)
            
            # Add missing columns with defaults
            if 'cluster_label' not in df.columns:
                df['cluster_label'] = None
            
            # Perform clustering if enough data
            if len(df) >= 10:
                self._perform_clustering(df)
            else:
                df['cluster_label'] = df.get('cluster_label', "General")
            
            logger.info(f"Loaded {len(df)} properties from PropertyFinder API")
            return df
            
        except Exception as e:
            logger.error(f"Error loading real-time data: {e}", exc_info=True)
            # Fall back to CSV if available
            if not self.df.empty:
                logger.info(f"Falling back to CSV data ({len(self.df)} properties available)")
                return self.df
            logger.warning("CSV fallback data is empty or not loaded")
            return pd.DataFrame()
    
    def _apply_location_filter(self, df: pd.DataFrame, location: str, strict: bool = True) -> pd.DataFrame:
        """Apply location filtering to DataFrame
        
        Args:
            df: DataFrame to filter
            location: Location string to match
            strict: If True, requires exact/close match. If False, allows lenient matching.
        
        Returns:
            Filtered DataFrame
        """
        if not location or df.empty:
            return df
        
        loc = location.lower().strip()
        loc_words = [w.strip() for w in loc.split() if w.strip()]
        
        # Ensure columns exist
        if 'community' not in df.columns:
            df['community'] = ""
        if 'city' not in df.columns:
            df['city'] = ""
        
        # Fill NaN values for string operations
        df = df.copy()
        df['community'] = df['community'].fillna("").astype(str).str.lower().str.strip()
        df['city'] = df['city'].fillna("").astype(str).str.lower().str.strip()
        
        if strict:
            # Strict matching: for multi-word locations, require ALL words
            if len(loc_words) > 1:
                location_mask = (
                    df['community'].str.contains(loc_words[0], case=False, na=False) &
                    df['community'].str.contains(loc_words[1], case=False, na=False)
                ) | (
                    df['city'].str.contains(loc_words[0], case=False, na=False) &
                    df['city'].str.contains(loc_words[1], case=False, na=False)
                ) | (
                    df['community'] == loc
                ) | (
                    df['city'] == loc
                )
            else:
                # Single word location - exact match or starts/ends with
                location_mask = (
                    (df['community'] == loc) |
                    (df['city'] == loc) |
                    df['community'].str.startswith(loc + " ", na=False) |
                    df['community'].str.endswith(" " + loc, na=False) |
                    df['city'].str.startswith(loc + " ", na=False) |
                    df['city'].str.endswith(" " + loc, na=False)
                )
        else:
            # Lenient matching: still require all words for multi-word locations
            if len(loc_words) > 1:
                location_mask = (
                    df['community'].str.contains(loc_words[0], case=False, na=False) &
                    df['community'].str.contains(loc_words[1], case=False, na=False)
                ) | (
                    df['city'].str.contains(loc_words[0], case=False, na=False) &
                    df['city'].str.contains(loc_words[1], case=False, na=False)
                ) | (
                    df['community'].str.contains(loc, case=False, na=False) |
                    df['city'].str.contains(loc, case=False, na=False)
                )
            else:
                # Single word location - allow partial match
                location_mask = (
                    df['community'].str.contains(loc, case=False, na=False) |
                    df['city'].str.contains(loc, case=False, na=False)
                )
        
        return df[location_mask]
    
    def _calculate_match_score(self, property_data: Dict[str, Any], intent: Dict[str, Any], dataset_df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """
        Calculate transparent match score for a property (0-100)
        
        Scoring weights:
        - Budget fit: 35 points
        - Location match: 25 points
        - Bedrooms match: 20 points
        - Property type match: 10 points
        - Status match: 10 points
        
        Returns:
            Dict with match_score (0-100), score_breakdown (list), and top_reasons (list)
        """
        score_breakdown = []
        total_score = 0
        
        # Get property values with defaults
        prop_price = property_data.get('price_aed') or 0
        prop_location = (property_data.get('community') or property_data.get('city') or '').lower().strip()
        prop_bedrooms = property_data.get('bedrooms', 0)
        prop_type = (property_data.get('property_type') or '').lower().strip()
        prop_status = (property_data.get('status') or '').lower().strip()
        prop_size = property_data.get('size_sqft') or 0
        
        # 1. Budget Fit (35 points)
        if intent.get("max_budget") and prop_price > 0:
            max_budget = intent['max_budget']
            budget_buffer = max_budget * 0.1  # 10% buffer
            
            if prop_price <= max_budget:
                # Within budget - full points
                points = 35
                explanation = f"Within your budget (AED {prop_price/1000000:.2f}M ≤ AED {max_budget/1000000:.2f}M)"
            elif prop_price <= max_budget + budget_buffer:
                # Within 10% buffer - partial points
                excess = prop_price - max_budget
                excess_percent = (excess / max_budget) * 100
                points = max(0, 35 * (1 - excess_percent / 10))  # Linear decrease from 35 to 0 over 10%
                explanation = f"Slightly above budget (AED {prop_price/1000000:.2f}M, {excess_percent:.0f}% over)"
            else:
                points = 0
                explanation = f"Above budget (AED {prop_price/1000000:.2f}M > AED {max_budget/1000000:.2f}M)"
            
            score_breakdown.append({
                "factor": "Budget Fit",
                "weight": 35,
                "value": f"AED {prop_price/1000000:.2f}M",
                "points": round(points, 1),
                "explanation": explanation
            })
            total_score += points
        elif intent.get("max_budget"):
            # Budget specified but property has no price
            score_breakdown.append({
                "factor": "Budget Fit",
                "weight": 35,
                "value": "Price on request",
                "points": 0,
                "explanation": "Price not available"
            })
        
        # 2. Location Match (25 points)
        if intent.get("location"):
            intent_location = intent['location'].lower().strip()
            intent_words = [w.strip() for w in intent_location.split() if w.strip()]
            
            # Check for exact match
            if prop_location == intent_location:
                points = 25
                explanation = f"Exact location match: {property_data.get('community', property_data.get('city', ''))}"
            elif len(intent_words) > 1:
                # Multi-word location - check if all words match
                all_words_match = all(word in prop_location for word in intent_words)
                if all_words_match:
                    points = 25
                    explanation = f"Matches preferred area: {property_data.get('community', property_data.get('city', ''))}"
                else:
                    # Partial match (some words match)
                    matching_words = sum(1 for word in intent_words if word in prop_location)
                    points = (matching_words / len(intent_words)) * 25 * 0.5  # Max 50% for partial
                    explanation = f"Partial location match: {property_data.get('community', property_data.get('city', ''))}"
            else:
                # Single word location - fuzzy match
                if intent_words[0] in prop_location:
                    points = 25
                    explanation = f"Matches preferred area: {property_data.get('community', property_data.get('city', ''))}"
                else:
                    points = 0
                    explanation = f"Location: {property_data.get('community', property_data.get('city', ''))} (doesn't match '{intent['location']}')"
            
            score_breakdown.append({
                "factor": "Location Match",
                "weight": 25,
                "value": property_data.get('community', property_data.get('city', 'Unknown')),
                "points": round(points, 1),
                "explanation": explanation
            })
            total_score += points
        
        # 3. Bedrooms Match (20 points)
        if intent.get("min_bedrooms") is not None:
            intent_bedrooms = intent['min_bedrooms']
            bedrooms_diff = abs(prop_bedrooms - intent_bedrooms)
            
            if bedrooms_diff == 0:
                points = 20
                bedroom_label = "Studio" if prop_bedrooms == 0 else f"{prop_bedrooms}BR"
                explanation = f"Bedrooms match: {bedroom_label}"
            elif bedrooms_diff == 1:
                points = 10  # Half points for +/-1
                bedroom_label = "Studio" if prop_bedrooms == 0 else f"{prop_bedrooms}BR"
                explanation = f"Bedrooms close: {bedroom_label} (requested {intent_bedrooms}BR)"
            else:
                points = 0
                bedroom_label = "Studio" if prop_bedrooms == 0 else f"{prop_bedrooms}BR"
                explanation = f"Bedrooms don't match: {bedroom_label} (requested {intent_bedrooms}BR)"
            
            score_breakdown.append({
                "factor": "Bedrooms Match",
                "weight": 20,
                "value": "Studio" if prop_bedrooms == 0 else f"{prop_bedrooms}BR",
                "points": round(points, 1),
                "explanation": explanation
            })
            total_score += points
        
        # 4. Property Type Match (10 points)
        if intent.get("property_type"):
            intent_type = intent['property_type'].lower().strip()
            # Check if property type matches intent (handles variations)
            type_match = False
            if intent_type == "villa":
                type_match = "villa" in prop_type or "townhouse" in prop_type or "town house" in prop_type
            elif intent_type == "apartment":
                type_match = "apartment" in prop_type or "penthouse" in prop_type or "studio" in prop_type
            elif intent_type == "studio":
                type_match = prop_bedrooms == 0 or "studio" in prop_type
            else:
                type_match = intent_type in prop_type
            
            if type_match:
                points = 10
                explanation = f"Property type matches: {property_data.get('property_type', 'Unknown')}"
            else:
                points = 0
                explanation = f"Property type: {property_data.get('property_type', 'Unknown')} (requested {intent['property_type']})"
            
            score_breakdown.append({
                "factor": "Property Type",
                "weight": 10,
                "value": property_data.get('property_type', 'Unknown'),
                "points": round(points, 1),
                "explanation": explanation
            })
            total_score += points
        
        # 5. Status Match (10 points)
        if intent.get("status"):
            intent_status = intent['status'].lower().strip()
            status_match = intent_status in prop_status
            
            if status_match:
                points = 10
                explanation = f"Status matches: {property_data.get('status', 'Unknown')}"
            else:
                points = 0
                status_display = property_data.get('status', 'Unknown')
                explanation = f"Status: {status_display} (requested {intent['status']})"
            
            score_breakdown.append({
                "factor": "Status Match",
                "weight": 10,
                "value": property_data.get('status', 'Unknown'),
                "points": round(points, 1),
                "explanation": explanation
            })
            total_score += points
        
        # Calculate value score (bonus - if price/sqft is available)
        # This doesn't add to total but can be shown as an insight
        value_insight = None
        if prop_price > 0 and prop_size > 0 and dataset_df is not None and not dataset_df.empty:
            try:
                prop_price_per_sqft = prop_price / prop_size
                # Calculate median price per sqft from dataset for comparison
                dataset_df_copy = dataset_df.copy()
                dataset_df_copy['price_per_sqft'] = dataset_df_copy.get('price_aed', 0) / dataset_df_copy.get('size_sqft', 1)
                dataset_df_copy = dataset_df_copy[dataset_df_copy['price_per_sqft'] > 0]
                if not dataset_df_copy.empty:
                    median_price_per_sqft = dataset_df_copy['price_per_sqft'].median()
                    if prop_price_per_sqft < median_price_per_sqft * 0.9:
                        value_insight = f"Great value: AED {int(prop_price_per_sqft):,}/sqft (below median AED {int(median_price_per_sqft):,}/sqft)"
            except Exception:
                pass  # Silently skip if calculation fails
        
        # Generate top reasons (2-4 strings for UI)
        top_reasons = []
        
        # Sort breakdown by points (highest first) and take top contributors
        sorted_breakdown = sorted(score_breakdown, key=lambda x: x['points'], reverse=True)
        
        for item in sorted_breakdown[:3]:  # Top 3 factors
            if item['points'] > 0:
                top_reasons.append(item['explanation'])
        
        # Add value insight if available
        if value_insight and len(top_reasons) < 4:
            top_reasons.append(value_insight)
        
        # If no reasons yet (score is 0), add a default message
        if not top_reasons:
            top_reasons.append("This property may still be of interest")
        
        # Round total score to 1 decimal place
        total_score = round(total_score, 1)
        
        return {
            "match_score": total_score,
            "score_breakdown": score_breakdown,
            "top_reasons": top_reasons[:4]  # Max 4 reasons
        }
    
    async def recommend(self, intent: Dict[str, Any], limit=50) -> List[Dict[str, Any]]:
        """Get recommendations based on intent"""
        # Load real-time data if using PropertyFinder
        if self.use_realtime and self.propertyfinder_service:
            filters = self._intent_to_filters(intent)
            df = await self._load_realtime_data(filters)
        else:
            df = self.df
        
        if df.empty:
            return []
        
        filtered = df.copy()
        
        # Filtering Logic
        if intent.get("status"):
            filtered = filtered[filtered['status'].str.lower() == intent['status'].lower()]
            
        if intent.get("property_type"):
            types = ["Villa", "Townhouse"] if intent['property_type'] == "Villa" else ["Apartment", "Penthouse", "Studio"]
            filtered = filtered[filtered['property_type'].isin(types)]
            
        if intent.get("min_bedrooms") is not None:
            filtered = filtered[filtered['bedrooms'] >= intent['min_bedrooms']]
            
        if intent.get("max_budget"):
            filtered = filtered[filtered['price_aed'] <= intent['max_budget'] * 1.1]
            
        if intent.get("location"):
            # Use helper method for location filtering (strict mode)
            filtered_before = len(filtered)
            filtered = self._apply_location_filter(filtered, intent['location'], strict=True)
            
            # Log filtering results
            if len(filtered) == 0:
                sample_locs = df[['community', 'city']].drop_duplicates().head(10).to_dict('records')
                logger.warning(f"Location filter '{intent['location']}' matched 0 properties out of {filtered_before}. Sample locations: {sample_locs}")
            else:
                logger.info(f"Location filter '{intent['location']}' matched {len(filtered)} properties out of {filtered_before}")
            
        if filtered.empty:
            # If user specified a location, try a more lenient search first
            if intent.get("location"):
                # Reapply all filters to original df, then use lenient location matching
                lenient_filtered = df.copy()
                
                # Apply other filters first
                if intent.get("status"):
                    lenient_filtered = lenient_filtered[lenient_filtered['status'].str.lower() == intent['status'].lower()]
                if intent.get("property_type"):
                    types = ["Villa", "Townhouse"] if intent['property_type'] == "Villa" else ["Apartment", "Penthouse", "Studio"]
                    lenient_filtered = lenient_filtered[lenient_filtered['property_type'].isin(types)]
                if intent.get("min_bedrooms") is not None:
                    lenient_filtered = lenient_filtered[lenient_filtered['bedrooms'] >= intent['min_bedrooms']]
                if intent.get("max_budget"):
                    lenient_filtered = lenient_filtered[lenient_filtered['price_aed'] <= intent['max_budget'] * 1.1]
                
                # Apply lenient location filter
                lenient_filtered = self._apply_location_filter(lenient_filtered, intent['location'], strict=False)
                
                if not lenient_filtered.empty:
                    logger.info(f"Strict location filter returned 0, but lenient filter found {len(lenient_filtered)} properties for '{intent['location']}'")
                    filtered = lenient_filtered
                else:
                    # Still no matches - return empty but show available locations
                    sample_locs = df[['community', 'city']].drop_duplicates().head(10).to_dict('records')
                    logger.warning(f"No properties found for location '{intent['location']}' even with lenient matching. Available locations: {sample_locs}")
                    return []
            
            # No location specified - show featured properties as fallback
            if self.use_realtime and self.propertyfinder_service:
                try:
                    featured = await self.propertyfinder_service.fetch_featured_properties(limit)
                    if featured:
                        return featured
                except Exception as e:
                    logger.warning(f"Error fetching featured from API: {e}")
            
            # Fall back to CSV featured properties
            if not df.empty:
                filtered = df[df['featured'] == True].copy()
            else:
                return []
            
        # Calculate transparent match scores for each property
        properties_with_scores = []
        
        for _, row in filtered.iterrows():
            prop_dict = row.replace({pd.NA: None, float('nan'): None}).to_dict()
            
            # Calculate match score and breakdown
            score_data = self._calculate_match_score(prop_dict, intent, dataset_df=df)
            
            # Add scoring data to property
            prop_dict['match_score'] = score_data['match_score']
            prop_dict['score_breakdown'] = score_data['score_breakdown']
            prop_dict['top_reasons'] = score_data['top_reasons']
            
            # Update match_reasons with top_reasons for backward compatibility
            if 'match_reasons' not in prop_dict or not prop_dict['match_reasons']:
                prop_dict['match_reasons'] = score_data['top_reasons']
            
            properties_with_scores.append((prop_dict, score_data['match_score']))
        
        # Sort by match score (highest first)
        properties_with_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Take top N and extract property dicts
        properties = [prop for prop, _ in properties_with_scores[:limit]]

        # Ensure all properties have required fields for Pydantic model
        for prop in properties:
            if "cluster_label" not in prop or prop.get("cluster_label") is None:
                prop["cluster_label"] = None
            if "match_reasons" not in prop or not prop.get("match_reasons"):
                prop["match_reasons"] = prop.get("top_reasons", [])
            # Ensure optional fields are present
            if "bathrooms" not in prop:
                prop["bathrooms"] = None
            if "size_sqft" not in prop:
                prop["size_sqft"] = None
            if "status" not in prop:
                prop["status"] = None
            # Ensure scoring fields exist
            if "match_score" not in prop:
                prop["match_score"] = 0.0
            if "score_breakdown" not in prop:
                prop["score_breakdown"] = []
            if "top_reasons" not in prop:
                prop["top_reasons"] = prop.get("match_reasons", [])
        
        return properties
    
    async def get_featured(self, limit=50) -> List[Dict[str, Any]]:
        """Get featured properties"""
        if self.use_realtime and self.propertyfinder_service:
            try:
                properties = await self.propertyfinder_service.fetch_featured_properties(limit)
                if properties:
                    # Ensure all properties have required fields for Pydantic model
                    for prop in properties:
                        if "cluster_label" not in prop:
                            prop["cluster_label"] = None
                        if "match_reasons" not in prop:
                            prop["match_reasons"] = []
                        if "bathrooms" not in prop:
                            prop["bathrooms"] = None
                        if "size_sqft" not in prop:
                            prop["size_sqft"] = None
                        if "status" not in prop:
                            prop["status"] = None
                    return properties
            except Exception as e:
                logger.warning(f"Error fetching featured from API: {e}, falling back to CSV")
        
        # Fall back to CSV
        if not self.df.empty:
            properties = self.df[self.df['featured'] == True].head(limit).replace({float('nan'): None}).to_dict('records')
            # Ensure all properties have required fields
            for prop in properties:
                if "cluster_label" not in prop:
                    prop["cluster_label"] = None
                if "match_reasons" not in prop:
                    prop["match_reasons"] = []
                if "bathrooms" not in prop:
                    prop["bathrooms"] = None
                if "size_sqft" not in prop:
                    prop["size_sqft"] = None
                if "status" not in prop:
                    prop["status"] = None
            return properties
        return []
    
    def _intent_to_filters(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """Convert intent to PropertyFinder API filter parameters
        
        API filter parameters:
        - listing_category: Rent, Buy (Pro+ plan)
        - location_name: Location name (Ultra+ plan)
        - property_type: Apartment, Villa, etc. (Ultra+ plan)
        - bedrooms: Number of bedrooms as string (Ultra+ plan)
        - bathrooms: Number of bathrooms as string (Ultra+ plan)
        - price_from: Minimum price (Mega plan)
        """
        filters = {}
        
        # Location - use location_name (Ultra+ plan required)
        if intent.get("location"):
            filters["location_name"] = intent["location"]
        
        # Bedrooms - API expects string (Ultra+ plan)
        if intent.get("min_bedrooms") is not None:
            filters["bedrooms"] = str(intent["min_bedrooms"])
        
        # Price - use price_from (Mega plan required) or just set min_price
        # Note: API doesn't have price_max, so we'll filter client-side if needed
        if intent.get("max_budget"):
            filters["price_from"] = int(intent["max_budget"] * 0.5)  # Start from 50% of max budget
        
        # Property type (Ultra+ plan)
        if intent.get("property_type"):
            filters["property_type"] = intent["property_type"]
        
        # Listing category - default to Buy if not specified
        # Could map status to listing_category, but API uses Rent/Buy
        # For now, default to Buy unless user specifically asks for rent
        if intent.get("status"):
            status = intent["status"].lower()
            if "rent" in status:
                filters["listing_category"] = "Rent"
            elif "buy" in status or "purchase" in status:
                filters["listing_category"] = "Buy"
        
        return filters
