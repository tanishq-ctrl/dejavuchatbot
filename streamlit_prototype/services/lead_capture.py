import datetime

class LeadCapture:
    def __init__(self, storage_file="data/leads.csv"):
        self.storage_file = storage_file

    def save_lead(self, lead_data):
        """
        lead_data: dict with name, contact, interest_id, timestamp
        """
        # Append to CSV
        try:
            with open(self.storage_file, "a") as f:
                # Simple CSV append
                line = f"{datetime.datetime.now()},{lead_data.get('name')},{lead_data.get('contact')},{lead_data.get('interest')}\n"
                f.write(line)
            return True
        except Exception as e:
            print(f"Error saving lead: {e}")
            return False

    def generate_summary(self, chat_history, recommendations):
        """
        Generates a text summary of the session
        """
        summary = "--- Deja Vu Property Search Summary ---\n"
        summary += f"Date: {datetime.datetime.now().strftime('%Y-%m-%d')}\n\n"
        
        summary += "Top Recommendations:\n"
        for rec in recommendations:
            summary += f"- {rec['title']} ({rec['price_aed']:,} AED)\n"
            summary += f"  Link: {rec.get('image_url', '')} \n"
            
        return summary
