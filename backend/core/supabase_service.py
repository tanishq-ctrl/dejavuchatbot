"""
Supabase Service for Lead Storage

This service handles storing leads in Supabase database.
Requires SUPABASE_URL and SUPABASE_KEY environment variables.
"""
import os
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)

class SupabaseService:
    def __init__(self):
        """Initialize Supabase Service"""
        self.url = os.getenv("SUPABASE_URL", "")
        self.key = os.getenv("SUPABASE_KEY", "")
        self.client = None
        
        if not self.url or not self.key:
            logger.warning("SUPABASE_URL or SUPABASE_KEY not set. Lead storage will not work.")
        else:
            try:
                from supabase import create_client, Client
                self.client: Client = create_client(self.url, self.key)
                logger.info("✅ Supabase service initialized successfully")
            except ImportError:
                logger.error("supabase package not installed. Run: pip install supabase")
                self.client = None
            except Exception as e:
                logger.error(f"Failed to initialize Supabase: {e}")
                self.client = None
    
    async def save_lead(self, lead_data: Dict[str, Any]) -> bool:
        """
        Save a lead to Supabase
        
        Args:
            lead_data: Dictionary containing lead information
                - name: str (required)
                - contact: str (required)
                - email: Optional[str]
                - phone: Optional[str]
                - interest: str (required)
                - message: Optional[str]
                - property_id: Optional[str]
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.client:
            logger.error("Supabase client not initialized. Cannot save lead.")
            return False
        
        try:
            # Prepare data for Supabase
            data = {
                "name": lead_data.get("name"),
                "contact": lead_data.get("contact"),
                "email": lead_data.get("email"),
                "phone": lead_data.get("phone"),
                "interest": lead_data.get("interest"),
                "message": lead_data.get("message"),
                "property_id": lead_data.get("property_id"),
                "created_at": datetime.utcnow().isoformat(),
            }
            
            # Remove None values
            data = {k: v for k, v in data.items() if v is not None}
            
            # Insert into Supabase (table name: 'leads')
            response = self.client.table("leads").insert(data).execute()
            
            logger.info(f"✅ Lead saved to Supabase: {lead_data.get('name')} interested in {lead_data.get('interest', '')[:50]}")
            return True
            
        except Exception as e:
            error_str = str(e)
            # Check if it's a "table not found" error (expected if table not created yet)
            if "Could not find the table" in error_str or "PGRST205" in error_str:
                logger.warning(f"Supabase table 'leads' not found. Please create it using the SQL schema. Falling back to CSV.")
            else:
                logger.error(f"Error saving lead to Supabase: {error_str}")
            return False
    
    async def save_shortlist(self, share_id: str, property_ids: List[str]) -> bool:
        """
        Save a shortlist to Supabase
        
        Args:
            share_id: Unique identifier for the shared shortlist
            property_ids: List of property IDs in the shortlist (max 5)
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.client:
            logger.error("Supabase client not initialized. Cannot save shortlist.")
            return False
        
        try:
            # Prepare data for Supabase
            data = {
                "share_id": share_id,
                "property_ids": property_ids,  # JSONB column will handle list
                "created_at": datetime.utcnow().isoformat(),
            }
            
            # Insert or update into Supabase (table name: 'shortlists')
            response = self.client.table("shortlists").upsert(data, on_conflict="share_id").execute()
            
            logger.info(f"✅ Shortlist saved to Supabase: {share_id} with {len(property_ids)} properties")
            return True
            
        except Exception as e:
            error_str = str(e)
            # Check if it's a "table not found" error
            if "Could not find the table" in error_str or "PGRST205" in error_str:
                logger.warning(f"Supabase table 'shortlists' not found. Please create it using the SQL schema. Falling back to in-memory store.")
            else:
                logger.error(f"Error saving shortlist to Supabase: {error_str}")
            return False
    
    async def get_shortlist(self, share_id: str) -> Optional[List[str]]:
        """
        Retrieve property IDs from a shared shortlist
        
        Args:
            share_id: Unique identifier for the shared shortlist
        
        Returns:
            Optional[list[str]]: List of property IDs if found, None otherwise
        """
        if not self.client:
            logger.error("Supabase client not initialized. Cannot retrieve shortlist.")
            return None
        
        try:
            # Query Supabase for shortlist
            response = self.client.table("shortlists").select("property_ids").eq("share_id", share_id).execute()
            
            if response.data and len(response.data) > 0:
                property_ids = response.data[0].get("property_ids", [])
                logger.info(f"✅ Retrieved shortlist from Supabase: {share_id} with {len(property_ids)} properties")
                return property_ids
            else:
                logger.warning(f"Shortlist not found in Supabase: {share_id}")
                return None
                
        except Exception as e:
            error_str = str(e)
            if "Could not find the table" in error_str or "PGRST205" in error_str:
                logger.warning(f"Supabase table 'shortlists' not found. Please create it using the SQL schema.")
            else:
                logger.error(f"Error retrieving shortlist from Supabase: {error_str}")
            return None

