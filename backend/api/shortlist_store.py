"""
In-Memory Shortlist Store (Fallback for Dev)
This is used as a fallback when Supabase is not configured.
Note: Data is lost on server restart - use Supabase for production.
"""
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

# In-memory dictionary to store shortlists
# Format: {share_id: {"property_ids": [...], "created_at": "..."}}
shortlist_store: Dict[str, Dict[str, Any]] = {}

def clear_expired(expiry_hours: int = 24):
    """
    Clear expired shortlists (older than expiry_hours)
    This should be called periodically in production
    """
    from datetime import datetime, timedelta
    expiry_time = datetime.utcnow() - timedelta(hours=expiry_hours)
    
    expired_keys = [
        key for key, value in shortlist_store.items()
        if datetime.fromisoformat(value.get("created_at", "")) < expiry_time
    ]
    
    for key in expired_keys:
        del shortlist_store[key]
    
    if expired_keys:
        logger.info(f"Cleared {len(expired_keys)} expired shortlists")
