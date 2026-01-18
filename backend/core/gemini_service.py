"""
Gemini AI Service

This service uses the Google Gemini API via the google-generativeai SDK.
The API supports the latest models (as of 2025/2026):
- gemini-2.5-flash (free tier, recommended)
- gemini-2.5-pro (free tier with limitations)
- gemini-2.0-flash (stable)

API Documentation: https://ai.google.dev/gemini-api/docs
The SDK automatically handles REST API details, authentication (x-goog-api-key),
and request/response formatting.
"""
import google.generativeai as genai
import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        """Initialize Gemini AI Service"""
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not set. Gemini AI responses will use fallback.")
            self.model = None
        else:
            try:
                genai.configure(api_key=self.api_key)
                
                # Try to discover available models first
                model_name = os.getenv("GEMINI_MODEL", None)
                available_model_name = None
                
                try:
                    available_models = genai.list_models()
                    # Look specifically for gemini-2.5-flash-lite only
                    target_model = 'gemini-2.5-flash-lite'
                    
                    # Collect all available models that support generateContent
                    available_model_list = []
                    for model in available_models:
                        if 'generateContent' in model.supported_generation_methods:
                            clean_name = model.name.replace('models/', '')
                            available_model_list.append(clean_name)
                    
                    # Check if target model is available
                    if target_model in available_model_list:
                        available_model_name = target_model
                        logger.info(f"Found gemini-2.5-flash-lite model")
                    else:
                        logger.warning(f"gemini-2.5-flash-lite not found in available models: {available_model_list}")
                        
                except Exception as list_error:
                    logger.warning(f"Could not list models: {list_error}")
                
                # Use discovered model or default to gemini-2.5-flash-lite only
                if not model_name:
                    if available_model_name:
                        model_name = available_model_name
                    else:
                        # Use gemini-2.5-flash-lite only (no fallbacks)
                        model_name = 'gemini-2.5-flash-lite'
                        logger.info(f"Auto-discovery unavailable, using gemini-2.5-flash-lite")
                
                # Initialize model - will fail here if model name is wrong
                self.model = genai.GenerativeModel(model_name)
                logger.info(f"✅ Gemini AI initialized with model: {model_name}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini model '{model_name if 'model_name' in locals() else 'unknown'}': {e}")
                logger.warning("⚠️  Gemini AI will not be available. Responses will use rule-based fallback.")
                self.model = None
    
    async def generate_response(
        self, 
        user_query: str, 
        recommendations: List[Dict[str, Any]],
        intent: Dict[str, Any]
    ) -> Optional[str]:
        """Generate AI-powered response based on user query and recommendations"""
        if not self.model:
            return None
        
        try:
            # Build context from recommendations
            rec_context = ""
            if recommendations:
                rec_context = "Properties found:\n"
                for i, prop in enumerate(recommendations[:5], 1):  # Top 5 properties
                    rec_context += f"{i}. {prop.get('title', 'Property')} - "
                    rec_context += f"{prop.get('community', '')}, {prop.get('city', '')} - "
                    bedrooms = prop.get('bedrooms', 0)
                    rec_context += f"{'Studio' if bedrooms == 0 else str(bedrooms) + ' Bed'} - "
                    if prop.get('price_aed'):
                        price_m = prop['price_aed'] / 1000000
                        if price_m >= 1:
                            rec_context += f"AED {price_m:.1f}M"
                        else:
                            rec_context += f"AED {prop['price_aed']:,.0f}"
                    if prop.get('featured'):
                        rec_context += " (EXCLUSIVE)"
                    rec_context += "\n"
            else:
                rec_context = "No properties found matching the criteria."
            
            # Build intent context
            intent_context = []
            if intent.get("location"):
                intent_context.append(f"Location: {intent['location']}")
            if intent.get("property_type"):
                intent_context.append(f"Type: {intent['property_type']}")
            if intent.get("min_bedrooms") is not None:
                if intent['min_bedrooms'] == 0:
                    intent_context.append("Bedrooms: Studio")
                else:
                    intent_context.append(f"Bedrooms: {intent['min_bedrooms']}")
            if intent.get("max_budget"):
                budget_m = intent['max_budget'] / 1000000
                intent_context.append(f"Budget: Under {budget_m:.1f}M AED")
            if intent.get("status"):
                intent_context.append(f"Status: {intent['status']}")
            
            system_prompt = f"""You are an expert Real Estate Consultant for 'Deja Vu Properties' in Dubai and UAE.
Your tone is professional, enthusiastic, helpful, and sales-oriented but trustworthy.

User's Search Criteria:
{', '.join(intent_context) if intent_context else 'General property inquiry'}

{rec_context}

IMPORTANT: Your response MUST be complete, informative, and professionally formatted using Markdown:

FORMATTING REQUIREMENTS:
- Use **bold** for emphasis on important information (property count, key features, prices, locations)
- Use *italic* for subtle emphasis
- Break into paragraphs with double line breaks for readability
- Highlight numbers, prices, and key details in **bold**

RESPONSE STRUCTURE:
1. A warm acknowledgement of their specific search criteria (mention location/property type in **bold**)
2. If properties were found ({len(recommendations)} properties available):
   - Mention the number found in **bold**: e.g., "**5 excellent options**"
   - Highlight 1-2 key properties with brief details (location in **bold**, price in **bold**, bedrooms)
   - Emphasize if any are "**EXCLUSIVE**" or "**featured**" in bold
3. If no properties found:
   - Acknowledge the search criteria
   - Suggest alternatives or refinements
4. End with a helpful next step or question

Keep response 50-120 words. Be specific and helpful. Use **bold formatting** for professional emphasis on key details.

Do NOT make up property details. Only use information provided above.
Do NOT add properties not in the list. Stay truthful and accurate."""

            # Generate response
            try:
                response = self.model.generate_content(
                    f"{system_prompt}\n\nUser Query: {user_query}\n\nRespond as the real estate consultant, providing complete, helpful information:",
                    generation_config={
                        "temperature": 0.7,
                        "top_p": 0.8,
                        "top_k": 40,
                        "max_output_tokens": 300,  # Increased to allow complete responses
                    }
                )
                
                response_text = response.text.strip()
                
                # Validate response quality - must be substantial and complete
                # Check for too short responses (minimum 60 chars for a proper response)
                if len(response_text) < 60:
                    logger.warning(f"Gemini response too short ({len(response_text)} chars): {response_text}")
                    return None  # Fall back to rule-based response
                
                # Check for incomplete responses (ending with "..." or common incomplete phrases)
                incomplete_patterns = [
                    response_text.endswith('...'),
                    response_text.endswith('excellent...'),
                    response_text.endswith('great...'),
                    response_text.lower().startswith('hello! you\'re looking') and len(response_text) < 100,
                    'Hello! You\'re looking for an excellent' in response_text and len(response_text) < 100
                ]
                
                if any(incomplete_patterns):
                    logger.warning(f"Gemini response appears incomplete ({len(response_text)} chars): {response_text}")
                    return None  # Fall back to rule-based response
                
                # Check for overly generic responses
                generic_responses = [
                    response_text.lower().strip() == "hello! fantastic choice",
                    len(response_text.split()) < 10,  # Less than 10 words is likely incomplete
                ]
                
                if any(generic_responses):
                    logger.warning(f"Gemini response too generic ({len(response_text)} chars, {len(response_text.split())} words): {response_text}")
                    return None  # Fall back to rule-based response
                
                # Log successful response (first 150 chars)
                logger.info(f"Gemini response ({len(response_text)} chars, {len(response_text.split())} words): {response_text[:150]}...")
                return response_text
            except Exception as gen_error:
                # Check if it's a model not found error
                error_str = str(gen_error).lower()
                if "not found" in error_str or "404" in error_str:
                    logger.error(f"Gemini model not found: {gen_error}")
                    logger.warning("Gemini model may not be available for your API key/region. Using fallback response.")
                else:
                    logger.error(f"Gemini generation error: {gen_error}")
                return None
            
        except Exception as e:
            logger.error(f"Gemini AI error: {e}", exc_info=True)
            return None

