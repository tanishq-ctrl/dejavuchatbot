import re

class IntentParser:
    def __init__(self):
        # Regex patterns for parsing
        self.patterns = {
            "budget": [
                r"(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*[kKmM]",  # 1.5M, 900k
                r"budget\s*(?:is|of)?\s*(\d+)",
                r"(\d+)\s*AED"
            ],
            "bedrooms": [
                r"(\d+)\s*b(?:ed|dr|edroom)",
                r"(studio)",
                r"(\d)\s*bhk"
            ],
            "property_type": [
                r"(apartment|flat|studio)",
                r"(villa|townhouse|mansion)",
                r"(penthouse)"
            ],
            "location": [
                r"(?i)in\s+([A-Za-z\s]+)(?:$|\s|[,.])",
                r"(?i)near\s+([A-Za-z\s]+)(?:$|\s|[,.])",
                r"Dubai Marina|Downtown|Business Bay|JVC|Palm Jumeirah|Meydan|Wasl Gate|Ajman"
            ],
            "status": [
                r"(off-plan|ready|under construction)"
            ]
        }

    def parse(self, user_text):
        """
        Parses user text to extract:
        - min_budget, max_budget
        - bedrooms (min)
        - property_type
        - location/community
        - status_preference
        """
        text = user_text.lower()
        intent = {
            "max_budget": None,
            "min_bedrooms": None,
            "property_type": None,
            "location": None,
            "status": None
        }

        # 1. Extract Budget
        # Simplified: looking for biggest number mentioned as max budget if 'k' or 'm' is present
        budget_matches = re.findall(r"(\d+(?:\.\d+)?)\s*([mMkK])", text)
        if budget_matches:
            val, multiplier = budget_matches[0]
            val = float(val)
            if multiplier.lower() == 'k':
                intent["max_budget"] = val * 1000
            elif multiplier.lower() == 'm':
                intent["max_budget"] = val * 1000000
        else:
            # Check for plain numbers near 'budget'
             plain_budget = re.search(r"budget.*?(\d{3,9})", text)
             if plain_budget:
                 intent["max_budget"] = float(plain_budget.group(1))

        # 2. Extract Bedrooms
        bed_match = re.search(r"(\d+)\s*b(?:ed|hk)", text)
        if bed_match:
            intent["min_bedrooms"] = int(bed_match.group(1))
        elif "studio" in text:
            intent["min_bedrooms"] = 0

        # 3. Property Type
        if any(x in text for x in ["villa", "townhouse", "mansion"]):
            intent["property_type"] = "Villa"
        elif any(x in text for x in ["apartment", "flat", "studio", "penthouse"]):
             intent["property_type"] = "Apartment"

        # 4. Location
        # Check against known list (simplified) or regex
        known_locs = ["dubai marina", "downtown", "business bay", "jvc", "palm jumeirah", "meydan", "wasl gate", "ajman", "jumeirah garden city"]
        for loc in known_locs:
            if loc in text:
                intent["location"] = loc.title() # Basic titling
                break
        
        # 5. Status
        if "off-plan" in text or "off plan" in text:
            intent["status"] = "Off-plan"
        elif "ready" in text:
             intent["status"] = "Ready"

        return intent

if __name__ == "__main__":
    # Test
    parser = IntentParser()
    print(parser.parse("I want a 2 bed apartment in Downtown budget 2M"))
    print(parser.parse("Looking for a villa near Meydan"))
