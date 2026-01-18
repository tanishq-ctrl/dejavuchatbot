import os
from openai import OpenAI

class LLMService:
    def __init__(self):
        self.api_key = os.environ.get("OPENAI_API_KEY")
        self.client = None
        if self.api_key:
            try:
                self.client = OpenAI(api_key=self.api_key)
            except Exception as e:
                print(f"Failed to init OpenAI client: {e}")

    def generate_response(self, user_query, recommendations, related_props=None):
        """
        Generates a natural language response using OpenAI if available.
        """
        if not self.client:
            return None

        # Prepare context from recommendations
        rec_context = ""
        for i, rec in enumerate(recommendations[:3]): # Top 3 only for brevity
            rec_context += f"{i+1}. {rec['title']} at {rec['community']} - {rec['price_aed']:,} AED. Type: {rec['property_type']}. ROI: {rec.get('roi_hint', 'N/A')}. Reasons: {', '.join(rec.get('match_reasons', []))}\n"

        if related_props:
            rec_context += "\nAlso check out these similar options:\n"
            for i, rec in enumerate(related_props[:2]):
                rec_context += f"- {rec['title']} ({rec['cluster_label']})\n"

        system_prompt = """You are an expert Real Estate Consultant for 'XYZ Properties'. 
        Your tone is professional, enthusiastic, and sales-oriented but trustworthy.
        
        Task:
        1. precise: Answer the user's query based ONLY on the provided property context.
        2. sell: Highlight WHY these matches are good (ROI, Location, Amenities).
        3. exclusive: If a property is a 'XYZ Exclusive' or 'Featured', emphasize it.
        4. concise: Keep it under 150 words. Use bullet points for readability.
        
        Do NOT hallucinate properties not in the list. If no properties fit, suggest a general consultation."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo", # Cost effective
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"User Query: {user_query}\n\nMatches Found:\n{rec_context}"}
                ],
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"LLM Error: {e}")
            return None
