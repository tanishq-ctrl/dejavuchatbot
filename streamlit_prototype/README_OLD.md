# Deja Vu Real Estate AI Assistance

A production-quality prototype chatbot that helps users find their ideal property in Dubai, featuring Deja Vu Real Estate exclusives.

## Features
- **Natural Language Chat**: Ask for "2 bed in Downtown under 2M" or "Off-plan investment".
- **Smart Recommendations**: Filters by budget, bedroom, type, and location.
- **Deja Vu Exclusives**: Prioritizes projects like *Védaire Residences*, *Bellagio by Sunrise*, and *Trillium Heights*.
- **Lead Capture**: Collects user details for high-interest properties.

## Setup Instructions

1.  **Environment Setup**:
    The project uses a virtual environment to manage dependencies.
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```
    *(Note: The environment and dependencies have already been set up for you).*

2.  **Generate Data**:
    If `data/properties.csv` is missing, regenerate it:
    ```bash
    python data/data_generator.py
    ```

3.  **Run the Application**:
    ```bash
    streamlit run app.py
    ```

## Project Structure
- `app.py`: Main application entry point (Streamlit).
- `data/`: Contains `properties.csv` and `leads.csv`.
- `services/`: Core logic (Parser, Recommender, Lead Capture).

## Demo Pitch Script for Deja Vu Team

**"Hi Team,**

**This prototype demonstrates how we can capture the 24/7 lead traffic on our site without losing the personal touch.**

**Instead of a static search form, we offer an AI consultant that:**
1.  **Qualifies the buyer instantly**: It politely asks for budget and preferences in natural conversation.
2.  **Pushes our Inventory**: It’s hard-coded to prioritize *Védaire* and *Bellagio* when they match, explaining *WHY* they are good investments (e.g., 'High ROI in Meydan').
3.  **Captures High-Intent Leads**: When a user clicks 'Interested', we get their details tied to a specific project, allowing our agents to follow up with context ('I saw you liked the 1-bed in Bellagio...').

**This can be embedded on our homepage tomorrow to start converting visitors into qualified leads."**
