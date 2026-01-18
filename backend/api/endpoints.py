from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
import datetime
import os
import csv
import logging

# Load environment variables FIRST (before importing services that need them)
load_dotenv()

from core.intent_parser import IntentParser
from core.recommender import RecommenderEngine
from core.propertyfinder_service import PropertyFinderService
from core.gemini_service import GeminiService
from core.supabase_service import SupabaseService

# Setup logging (only configure if not already configured to prevent duplicate handlers)
if not logging.getLogger().handlers:
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        force=True  # Override any existing configuration
    )
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Services
parser = IntentParser()

# Initialize PropertyFinder service if API key is available
propertyfinder_service = PropertyFinderService()
use_realtime = os.getenv("USE_REALTIME_DATA", "false").lower() == "true"
recommender = RecommenderEngine(
    propertyfinder_service=propertyfinder_service if use_realtime else None,
    use_realtime=use_realtime
)

# Initialize Gemini AI service (required for AI responses)
gemini_service = GeminiService()

# Initialize Supabase service for lead storage
supabase_service = SupabaseService()

# --- Models ---
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500, description="User's property search query")
    session_id: Optional[str] = None
    limit: Optional[int] = Field(default=20, ge=1, le=100, description="Number of properties to return per page")
    offset: Optional[int] = Field(default=0, ge=0, description="Number of properties to skip (for pagination)")
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Message cannot be empty")
        return v.strip()

class ScoreBreakdownItem(BaseModel):
    factor: str
    weight: float
    value: str
    points: float
    explanation: str

class Property(BaseModel):
    id: str
    title: str
    price_aed: Optional[float]
    community: str
    city: str
    property_type: str
    bedrooms: int
    bathrooms: Optional[int] = None
    size_sqft: Optional[float] = None
    status: Optional[str] = None
    image_url: Optional[str]
    featured: bool
    cluster_label: Optional[str]
    match_reasons: Optional[List[str]] = []
    # Transparent scoring fields
    match_score: Optional[float] = None
    score_breakdown: Optional[List[ScoreBreakdownItem]] = None
    top_reasons: Optional[List[str]] = None

class ChatResponse(BaseModel):
    text: str
    recommendations: List[Property]
    intent: Dict[str, Any]
    pagination: Optional[Dict[str, Any]] = None  # Added for pagination info

class LeadRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    contact: str = Field(..., min_length=5, max_length=100, description="Email or phone number")
    interest: str = Field(..., max_length=500)
    email: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    message: Optional[str] = Field(None, max_length=1000)
    property_id: Optional[str] = Field(None, max_length=100)

class ShortlistShareRequest(BaseModel):
    property_ids: List[str] = Field(..., min_items=1, max_items=5, description="List of property IDs to share (max 5)")

# Helper function for fallback responses (if Gemini not available)
def _generate_fallback_response(recs: List[Dict[str, Any]], intent: Dict[str, Any]) -> str:
    """Generate fallback rule-based response if Gemini AI is not available"""
    if not recs:
        if intent.get("location"):
            location = intent['location']
            criteria_parts = []
            if intent.get("property_type"):
                criteria_parts.append(intent['property_type'].lower())
            if intent.get("min_bedrooms") is not None:
                criteria_parts.append(f"{intent['min_bedrooms']} bedroom{'s' if intent['min_bedrooms'] > 1 else ''}")
            if intent.get("max_budget"):
                budget_m = intent['max_budget'] / 1000000
                criteria_parts.append(f"under {budget_m:.1f}M AED")
            
            criteria_text = f" {' '.join(criteria_parts)}" if criteria_parts else ""
            return f"I couldn't find any properties in {location}{criteria_text}. Try adjusting your search criteria or check a different location."
        else:
            return "I'm currently searching our latest property database. Please try again in a moment, or feel free to refine your search criteria!"
    
    # Properties found
    criteria_parts = []
    if intent.get("min_bedrooms") is not None:
        if intent['min_bedrooms'] == 0:
            criteria_parts.append("studio")
        else:
            criteria_parts.append(f"{intent['min_bedrooms']} bedroom{'s' if intent['min_bedrooms'] > 1 else ''}")
    if intent.get("location"):
        criteria_parts.append(f"in {intent['location']}")
    if intent.get("max_budget"):
        budget_m = intent['max_budget'] / 1000000
        if budget_m >= 1:
            criteria_parts.append(f"under {budget_m:.1f}M AED")
        else:
            criteria_parts.append(f"under {intent['max_budget']:,.0f} AED")
    if intent.get("property_type"):
        criteria_parts.append(intent['property_type'].lower())
    
    if len(recs) >= 20:
        text = f"🎉 Excellent! I found {len(recs)} amazing properties"
    elif len(recs) >= 10:
        text = f"✨ Great news! I found {len(recs)} great properties"
    elif len(recs) >= 5:
        text = f"🏠 Perfect! I found {len(recs)} properties"
    else:
        text = f"🎯 I found {len(recs)} propert{'y' if len(recs) == 1 else 'ies'}"
    
    if criteria_parts:
        criteria_text = " " + ", ".join(criteria_parts) + "."
        text += criteria_text
    
    if len(recs) > 5:
        text += " Use filters or ask me to refine further!"
    else:
        text += " Let me know if you'd like to see more options or adjust your criteria."
    
    return text

# --- Endpoints ---

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        # 1. Parse Intent
        intent = parser.parse(request.message)
        logger.info(f"Parsed intent for message: {request.message[:50]}... -> {intent}")
        
        # 2. Get pagination parameters
        limit = request.limit or 20
        offset = request.offset or 0
        
        # 3. Get Recommendations (now async) with pagination
        recs = await recommender.recommend(intent, limit=limit + offset)  # Fetch more to support offset
        
        # 4. Apply pagination (offset and limit)
        total_count = len(recs)
        paginated_recs = recs[offset:offset + limit]
        has_more = (offset + limit) < total_count
        
        # 5. If no results, try to get featured properties
        if not paginated_recs and not intent.get("location"):
            featured = await recommender.get_featured(limit=limit + offset)
            total_count = len(featured)
            paginated_recs = featured[offset:offset + limit]
            has_more = (offset + limit) < total_count
        
        # 6. Generate AI Response using Gemini (use full list for context, but return paginated)
        text = None
        if gemini_service.model:
            try:
                # Use first page for AI response context (to keep it relevant)
                text = await gemini_service.generate_response(request.message, paginated_recs, intent)
                if text:
                    logger.info("Generated response using Gemini AI")
                else:
                    logger.warning("Gemini returned empty response, using fallback")
            except Exception as e:
                logger.error(f"Gemini AI error: {e}", exc_info=True)
        
        # 7. Fallback to rule-based response if Gemini not available or failed
        if not text:
            text = _generate_fallback_response(paginated_recs, intent)
            logger.info("Using fallback rule-based response")
        
        # 8. Build pagination info
        pagination_info = {
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": has_more,
            "current_count": len(paginated_recs)
        }
        
        return ChatResponse(
            text=text,
            recommendations=paginated_recs or [],
            intent=intent,
            pagination=pagination_info
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An error occurred while processing your request. Please try again.")

@router.get("/featured", response_model=List[Property])
async def get_featured():
    try:
        featured = await recommender.get_featured()
        logger.info(f"Returned {len(featured)} featured properties")
        return featured
    except Exception as e:
        logger.error(f"Error fetching featured properties: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch featured properties")

@router.get("/properties/{property_id}", response_model=Property)
async def get_property(property_id: str):
    """
    Get a single property by ID
    Searches through featured properties, CSV data, and recent recommendations
    """
    try:
        # Try to get from featured properties first
        featured = await recommender.get_featured(limit=1000)
        property_data = next((p for p in featured if p.get("id") == property_id), None)
        
        if not property_data:
            # Try searching in all properties (CSV fallback)
            if not recommender.df.empty:
                property_row = recommender.df[recommender.df['id'] == property_id]
                if not property_row.empty:
                    property_dict = property_row.iloc[0].to_dict()
                    # Convert to match Property model format
                    property_data = {
                        "id": str(property_dict.get("id", property_id)),
                        "title": property_dict.get("title", "Property"),
                        "price_aed": property_dict.get("price_aed"),
                        "community": property_dict.get("community", "Dubai"),
                        "city": property_dict.get("city", "Dubai"),
                        "property_type": property_dict.get("property_type", "Apartment"),
                        "bedrooms": int(property_dict.get("bedrooms", 0)),
                        "bathrooms": property_dict.get("bathrooms"),
                        "size_sqft": property_dict.get("size_sqft"),
                        "status": property_dict.get("status", "Ready"),
                        "image_url": property_dict.get("image_url"),
                        "featured": bool(property_dict.get("featured", False)),
                        "cluster_label": property_dict.get("cluster_label"),
                        "match_reasons": property_dict.get("match_reasons", []),
                    }
        
        if not property_data:
            raise HTTPException(status_code=404, detail=f"Property with ID {property_id} not found")
        
        # Ensure all required fields are present
        if "cluster_label" not in property_data or property_data.get("cluster_label") is None:
            property_data["cluster_label"] = None
        if "match_reasons" not in property_data:
            property_data["match_reasons"] = []
        if "bathrooms" not in property_data:
            property_data["bathrooms"] = None
        if "size_sqft" not in property_data:
            property_data["size_sqft"] = None
        if "status" not in property_data:
            property_data["status"] = None
        if "match_score" not in property_data:
            property_data["match_score"] = None
        if "score_breakdown" not in property_data:
            property_data["score_breakdown"] = []
        if "top_reasons" not in property_data:
            property_data["top_reasons"] = []
        
        logger.info(f"Retrieved property: {property_id}")
        return property_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching property {property_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch property details")

@router.post("/lead")
async def capture_lead(lead: LeadRequest):
    """
    Capture lead and store in Supabase (or CSV fallback if Supabase not configured)
    """
    lead_data = {
        "name": lead.name,
        "contact": lead.contact,
        "email": lead.email,
        "phone": lead.phone,
        "interest": lead.interest,
        "message": lead.message,
        "property_id": lead.property_id,
    }
    
    # Try Supabase first
    if supabase_service.client:
        try:
            success = await supabase_service.save_lead(lead_data)
            if success:
                logger.info(f"Lead saved to Supabase: {lead.name} interested in {lead.interest[:50]}...")
                return {"status": "success", "message": "Your request has been submitted successfully! We'll contact you within 24 hours."}
        except Exception as e:
            logger.error(f"Supabase save failed: {e}, falling back to CSV")
    
    # Fallback to CSV if Supabase not available or failed
    try:
        possible_paths = [
            "backend/data/leads.csv",
            "data/leads.csv",
            os.path.join(os.path.dirname(__file__), "..", "data", "leads.csv")
        ]
        
        file_path = None
        for path in possible_paths:
            abs_path = os.path.abspath(path)
            if os.path.exists(os.path.dirname(abs_path)):
                file_path = abs_path
                break
        
        if file_path is None:
            default_path = "backend/data/leads.csv"
            os.makedirs(os.path.dirname(default_path), exist_ok=True)
            file_path = default_path
        
        file_exists = os.path.isfile(file_path)
        
        with open(file_path, mode='a', newline='') as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow(["Timestamp", "Name", "Contact", "Email", "Phone", "Interest", "Message", "Property ID"])
            
            writer.writerow([
                datetime.datetime.now().isoformat(),
                lead.name,
                lead.contact,
                lead.email or "",
                lead.phone or "",
                lead.interest,
                lead.message or "",
                lead.property_id or ""
            ])
        logger.info(f"Lead saved to CSV: {lead.name} interested in {lead.interest[:50]}...")
        return {"status": "success", "message": "Your request has been submitted successfully! We'll contact you soon."}
    except Exception as e:
        logger.error(f"Error capturing lead: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to submit your request. Please try again.")

@router.post("/shortlist/share")
async def share_shortlist(request: ShortlistShareRequest):
    """
    Create a shareable shortlist link
    Accepts property_ids and returns a share_id that can be used to retrieve properties
    """
    try:
        # Validate property IDs count
        if len(request.property_ids) > 5:
            raise HTTPException(status_code=400, detail="Maximum 5 properties allowed per shortlist")
        
        if len(request.property_ids) == 0:
            raise HTTPException(status_code=400, detail="At least one property ID required")
        
        # Generate a share_id (simple UUID-like string)
        import uuid
        share_id = str(uuid.uuid4()).replace('-', '')[:8]  # Short 8-character ID for easy sharing
        
        # Try to save to Supabase first
        if supabase_service.client:
            try:
                success = await supabase_service.save_shortlist(share_id, request.property_ids)
                if success:
                    share_url = f"/compare?share_id={share_id}"
                    logger.info(f"Shortlist shared via Supabase: {share_id} with {len(request.property_ids)} properties")
                    return {
                        "share_id": share_id,
                        "share_url": share_url,
                        "property_count": len(request.property_ids)
                    }
            except Exception as e:
                logger.error(f"Supabase save failed: {e}, falling back to in-memory storage")
        
        # Fallback to in-memory storage (dev only)
        from api.shortlist_store import shortlist_store
        shortlist_store[share_id] = {
            "property_ids": request.property_ids,
            "created_at": datetime.datetime.utcnow().isoformat()
        }
        share_url = f"/compare?share_id={share_id}"
        logger.info(f"Shortlist saved to in-memory store: {share_id} with {len(request.property_ids)} properties")
        return {
            "share_id": share_id,
            "share_url": share_url,
            "property_count": len(request.property_ids),
            "note": "Using in-memory storage (dev only). Configure Supabase for production."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating shareable shortlist: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create shareable shortlist")

@router.get("/shortlist/share/{share_id}", response_model=List[Property])
async def get_shared_shortlist(share_id: str):
    """
    Retrieve properties from a shared shortlist
    Returns full property objects for the given share_id
    """
    try:
        property_ids = None
        
        # Try Supabase first
        if supabase_service.client:
            try:
                property_ids = await supabase_service.get_shortlist(share_id)
                if property_ids:
                    logger.info(f"Retrieved shortlist from Supabase: {share_id}")
            except Exception as e:
                logger.warning(f"Supabase retrieval failed: {e}, trying in-memory store")
        
        # Fallback to in-memory storage
        if not property_ids:
            from api.shortlist_store import shortlist_store
            if share_id in shortlist_store:
                property_ids = shortlist_store[share_id].get("property_ids", [])
                logger.info(f"Retrieved shortlist from in-memory store: {share_id}")
        
        if not property_ids:
            raise HTTPException(status_code=404, detail="Shortlist not found or expired")
        
        # Fetch full property objects from recommender
        # Note: This assumes we can fetch by ID - if not, return IDs and let frontend handle
        # For now, we'll try to get properties by matching IDs from featured/CSV
        try:
            # Get all featured properties and filter by IDs
            all_properties = await recommender.get_featured(limit=1000)
            matched_properties = [p for p in all_properties if p.get("id") in property_ids]
            
            # Sort to match the order of property_ids
            property_dict = {p.get("id"): p for p in matched_properties}
            sorted_properties = [property_dict[pid] for pid in property_ids if pid in property_dict]
            
            if len(sorted_properties) != len(property_ids):
                logger.warning(f"Some properties not found: requested {len(property_ids)}, found {len(sorted_properties)}")
            
            return sorted_properties
        except Exception as e:
            logger.error(f"Error fetching property details: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to retrieve property details")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving shared shortlist: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve shared shortlist")
