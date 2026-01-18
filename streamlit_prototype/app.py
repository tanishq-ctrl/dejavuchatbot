import streamlit as st
import pandas as pd
import random
from services.intent_parser import IntentParser
from services.recommender import RecommenderEngine
from services.lead_capture import LeadCapture
from services.llm_service import LLMService

# --- Config & Setup ---
st.set_page_config(
    page_title="XYZ Real Estate AI",
    page_icon="🏙️",
    layout="wide"
)

# Initialize Services
if 'parser' not in st.session_state:
    st.session_state.parser = IntentParser()
if 'recommender' not in st.session_state:
    st.session_state.recommender = RecommenderEngine()
if 'lead_capture' not in st.session_state:
    st.session_state.lead_capture = LeadCapture()
if 'llm' not in st.session_state:
    st.session_state.llm = LLMService()

# Initialize Chat History
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "assistant", "content": "Hello! I'm your XYZ Real Estate assistant. I can help you find exclusive off-plan projects and dream homes in Dubai. Tell me what you're looking for! (e.g., '2 bed in Downtown around 2M')"}
    ]

# --- Sidebar ---
with st.sidebar:
    st.image("https://via.placeholder.com/300x100?text=XYZ+Properties", use_container_width=True)
    st.title("Settings & Filters")
    
    st.markdown("### Quick Filters")
    debug_mode = st.toggle("Debug Mode", value=False)
    
    with st.expander("About XYZ Exclusives"):
        st.write("- **Védaire Residences**: Luxury in Meydan")
        st.write("- **Bellagio by Sunrise**: Value in Wasl Gate")
        st.write("- **Trillium Heights**: Jumeirah Garden City")

    if st.button("Reset Chat"):
        st.session_state.messages = [
             {"role": "assistant", "content": "Hello! Search reset. What are you looking for today?"}
        ]
        st.rerun()

    if st.session_state.llm.client:
        st.success("🟢 AI Integration Active")
    else:
        st.warning("⚪ Rule-Based Mode (No API Key)")

# --- Main Interface ---
st.title("🏙️ AI-Powered Property Finder")

# Display Chat
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# User Input
if prompt := st.chat_input("Describe your dream property..."):
    # Add user message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # Process Intent
    with st.spinner("Analyzing your request..."):
        intent = st.session_state.parser.parse(prompt)
        
        if debug_mode:
            with st.chat_message("assistant"):
                st.code(f"Debug Intent: {intent}")

        # Get Recommendations
        recs = st.session_state.recommender.recommend(intent)
        
        # Determine strictness of match
        related_props = []
        if not recs:
            recs = st.session_state.recommender.get_featured()
            intent["note"] = "No exact matches. Showing featured."
        elif len(recs) > 0:
            # Get related (same cluster, diff location) from top match
            related_props = st.session_state.recommender.get_related(recs[0])

        # Formulate Response
        response_text = ""
        
        # Try OpenAI Response
        if st.session_state.llm.client:
            ai_response = st.session_state.llm.generate_response(prompt, recs, related_props)
            if ai_response:
                response_text = ai_response
            else:
                response_text = f"I found {len(recs)} properties matching your criteria."
        else:
             # Fallback Rule-Based
            if intent.get("note"):
                response_text = "I couldn't find exact matches, but here are some featured properties you might like:"
            else:
                response_text = f"I found {len(recs)} properties that match your criteria:"

    # Display Response
    with st.chat_message("assistant"):
        st.markdown(response_text)
        
        # Display Cards (Main Recs)
        st.write("### Top Matches")
        for rec in recs:
            with st.container(border=True):
                c1, c2 = st.columns([1, 2])
                with c1:
                    st.image(rec.get("image_url", "https://via.placeholder.com/300x200"), use_container_width=True)
                with c2:
                    is_feat = "🌟 " if rec['featured'] else ""
                    st.subheader(f"{is_feat}{rec['title']}")
                    st.write(f"**Price:** {rec['price_aed']:,} AED | **Type:** {rec['property_type']}")
                    st.write(f"**Location:** {rec['community']}, {rec['city']}")
                    
                    # Show Cluster
                    if 'cluster_label' in rec:
                        st.caption(f"Category: {rec['cluster_label']}")

                    if rec.get('match_reasons'):
                        st.markdown("**Why this fits:**")
                        for reason in rec['match_reasons']:
                            st.markdown(f"- {reason}")
                    
                    # Call to Action
                    bc1, bc2 = st.columns(2)
                    if bc1.button("Interested", key=f"int_{rec['id']}"):
                         st.session_state.interested_in = rec
                         st.session_state.show_lead_form = True

        # Display Related (if any)
        if related_props:
            with st.expander("See Similar Properties (Smart Suggestions)"):
                st.write("Based on your preference group, you might also like:")
                for rec in related_props:
                    st.markdown(f"**{rec['title']}** - {rec['community']} ({rec['price_aed']:,} AED)")
    
    st.session_state.messages.append({"role": "assistant", "content": response_text})

# --- Lead Capture Modal (Simulated with Dialog or Form) ---
if st.session_state.get('show_lead_form', False):
    prop = st.session_state.interested_in
    st.markdown("---")
    st.subheader(f"Request Details for {prop['title']}")
    with st.form("lead_form"):
        name = st.text_input("Name")
        contact = st.text_input("Phone / Email")
        submitted = st.form_submit_button("Send Request")
        
        if submitted:
            if name and contact:
                st.session_state.lead_capture.save_lead({
                    "name": name,
                    "contact": contact,
                    "interest": prop['title']
                })
                st.success("Request sent! An agent will contact you shortly.")
                st.session_state.show_lead_form = False
                st.rerun()
            else:
                st.error("Please fill in your details.")
    
    if st.button("Cancel"):
        st.session_state.show_lead_form = False
        st.rerun()

