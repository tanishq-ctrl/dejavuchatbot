import re
from typing import Dict, Any

class IntentParser:
    def __init__(self):
        pass

    def parse(self, user_text: str) -> Dict[str, Any]:
        """
        Parses user text to extract search criteria.
        """
        text = user_text.lower()
        intent = {
            "max_budget": None,
            "min_bedrooms": None,
            "property_type": None,
            "location": None,
            "status": None
        }

        # 1. Budget - Improved parsing
        # Look for patterns like: "2M", "2 million", "2000k", "under 2M", "below 1.5M", "around 2M"
        budget_matches = re.findall(r"(\d+(?:\.\d+)?)\s*([mMkK])", text)
        if budget_matches:
            val, multiplier = budget_matches[0]
            val = float(val)
            mult = multiplier.lower()
            if mult == 'k': 
                intent["max_budget"] = val * 1000
            elif mult == 'm': 
                intent["max_budget"] = val * 1000000
        else:
            # Try patterns like "under 2M", "below 1.5M", "around 2M", "2 million"
            budget_with_words = re.search(r"(?:under|below|up\s*to|max|maximum|budget|around|about)\s*(\d+(?:\.\d+)?)\s*(million|m|thousand|k)", text)
            if budget_with_words:
                val = float(budget_with_words.group(1))
                unit = budget_with_words.group(2).lower()
                if unit in ['m', 'million']:
                    intent["max_budget"] = val * 1000000
                elif unit in ['k', 'thousand']:
                    intent["max_budget"] = val * 1000
            
            # Try plain budget numbers (large numbers likely AED amounts)
            if not intent.get("max_budget"):
                plain_budget = re.search(r"budget.*?(\d{4,9})", text)
                if plain_budget: 
                    intent["max_budget"] = float(plain_budget.group(1))

        # 2. Bedrooms
        bed_match = re.search(r"(\d+)\s*b(?:ed|hk)", text)
        if bed_match:
            intent["min_bedrooms"] = int(bed_match.group(1))
        elif "studio" in text:
            intent["min_bedrooms"] = 0

        # 3. Type - Improved property type detection
        property_type_keywords = {
            "Villa": ["villa", "villas", "townhouse", "town house", "mansion", "mansion", "detached"],
            "Apartment": ["apartment", "apartments", "flat", "flats", "condo", "condos", "residence", "residences"],
            "Penthouse": ["penthouse", "penthouses", "ph"],
            "Studio": ["studio", "studios", "0 bed", "zero bed"],
        }
        
        for prop_type, keywords in property_type_keywords.items():
            if any(kw in text for kw in keywords):
                intent["property_type"] = prop_type
                break

        # 4. Location - Expanded list of Dubai/UAE locations
        known_locs = [
            "dubai marina", "downtown", "business bay", "jvc", "jumeirah village circle",
            "palm jumeirah", "palm", "meydan", "wasl gate", "ajman", "jumeirah garden city",
            "dubai hills", "dubai land", "arabian ranches", "emirates hills", "dubai sports city",
            "damac hills", "arabian ranches", "motor city", "international city", "deira",
            "bur dubai", "jumeirah", "al barsha", "dubai silicon oasis", "dso", "jlt", "jumeirah lakes towers",
            "dubai international financial centre", "difc", "sheikh zayed road", "szr",
            "abu dhabi", "sharjah", "ras al khaimah", "rak", "fujairah", "umm al quwain",
            "dubai creek harbour", "creek harbour", "city walk", "bluewaters", "marina",
            "al quoz", "business bay", "dubai festival city", "festival city", "lakes",
            "meydan", "zabeel", "almaya", "palm jebel ali", "palm deira", "world islands",
            "jbr", "jumeirah beach residence", "al sufouh", "ud al bai", "remraam"
        ]
        for loc in known_locs:
            if loc in text:
                # Use proper location name for API (capitalize appropriately)
                location_mapping = {
                    "jvc": "Jumeirah Village Circle",
                    "difc": "Dubai International Financial Centre",
                    "rak": "Ras Al Khaimah",
                    "jlt": "Jumeirah Lakes Towers",
                    "dso": "Dubai Silicon Oasis",
                    "szr": "Sheikh Zayed Road",
                    "jbr": "Jumeirah Beach Residence",
                    "palm": "Palm Jumeirah"
                }
                intent["location"] = location_mapping.get(loc, loc.title())
                break
        
        # 5. Status
        if "off-plan" in text or "off plan" in text:
            intent["status"] = "Off-plan"
        elif "ready" in text:
             intent["status"] = "Ready"

        return intent
