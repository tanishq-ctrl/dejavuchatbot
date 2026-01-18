import pandas as pd
import numpy as np
import random
from faker import Faker

fake = Faker()

# --- Config ---
TOTAL_ROWS = 600
EXCLUSIVES_COUNT = 30  # At least 30 featured
OUTPUT_FILE = "data/properties.csv"

# --- Deja Vu Exclusives Data ---
# Based on prompt details
EXCLUSIVES = [
    {
        "id": "DV_001",
        "title": "Védaire Residences - Luxury Off-plan",
        "project_name": "Védaire Residences",
        "developer": "Deja Vu Dev", # Placeholder if not specified
        "community": "Meydan Avenue",
        "city": "Dubai",
        "property_type": "Apartment",
        "bedrooms": 1,
        "bathrooms": 2,
        "size_sqft": 850,
        "price_aed": 1400000,
        "payment_plan": "30/70",
        "handover": "Q3 2027",
        "status": "Off-plan",
        "amenities": "Pool, Gym, Concierge, Smart Home",
        "nearby_landmarks": "Meydan Racecourse, Downtown Dubai",
        "roi_hint": "High potential due to Meydan location",
        "latitude": 25.1558,
        "longitude": 55.2936,
        "image_url": "https://via.placeholder.com/300x200?text=Vedaire",
        "source": "dejavu_exclusive",
        "featured": True
    },
    {
        "id": "DV_002",
        "title": "Bellagio by Sunrise - Value Investment",
        "project_name": "Bellagio by Sunrise",
        "developer": "Sunrise",
        "community": "Wasl Gate",
        "city": "Dubai",
        "property_type": "Apartment",
        "bedrooms": 1,
        "bathrooms": 1,
        "size_sqft": 750,
        "price_aed": 970000,
        "payment_plan": "50/50",
        "handover": "Q4 2026",
        "status": "Off-plan",
        "amenities": "Community Park, Metro Access, Retail",
        "nearby_landmarks": "Ibn Battuta Mall, Festival Plaza",
        "roi_hint": "Excellent rental yield near Metro",
        "latitude": 25.0385,
        "longitude": 55.1189,
        "image_url": "https://via.placeholder.com/300x200?text=Bellagio",
        "source": "dejavu_exclusive",
        "featured": True
    },
    {
        "id": "DV_003",
        "title": "Trillium Heights - Premium Living",
        "project_name": "Trillium Heights",
        "developer": "Deja Vu Partner",
        "community": "Jumeirah Garden City",
        "city": "Dubai",
        "property_type": "Apartment",
        "bedrooms": 2,
        "bathrooms": 2,
        "size_sqft": 1100,
        "price_aed": 1020000,
        "payment_plan": "60/40",
        "handover": "Q1 2026",
        "status": "Off-plan",
        "amenities": "Rooftop Garden, Kids Play Area",
        "nearby_landmarks": "Sheikh Zayed Road, Satwa",
        "roi_hint": "Great connectivity and value",
        "latitude": 25.2154,
        "longitude": 55.2758,
        "image_url": "https://via.placeholder.com/300x200?text=Trillium",
        "source": "dejavu_exclusive",
        "featured": True
    }
]

# --- Synthetic Data Generation ---
COMMUNITIES = [
    ("Dubai Marina", 25.0805, 55.1403, 1.2),
    ("Downtown Dubai", 25.1972, 55.2744, 1.5),
    ("Jumeirah Village Circle", 25.0599, 55.2057, 0.8),
    ("Business Bay", 25.1837, 55.2666, 1.1),
    ("Palm Jumeirah", 25.1124, 55.1390, 2.0),
    ("Dubai Hills Estate", 25.1118, 55.2325, 1.3),
    ("Creek Harbour", 25.1956, 55.3444, 1.25),
    ("Ajman Downtown", 25.4052, 55.5136, 0.4), # Lower cost option
    ("Al Furjan", 25.0438, 55.1481, 0.9)
]

PROPERTY_TYPES = ["Apartment", "Villa", "Townhouse", "Penthouse"]
STATUSES = ["Ready", "Off-plan"]
AMENITIES_POOL = ["Pool", "Gym", "Parking", "Security", "Balcony", "Sea View", "Metro Access", "Maids Room"]

def generate_synthetic_row(id_num):
    comm_data = random.choice(COMMUNITIES)
    community, lat_base, lon_base, price_multiplier = comm_data
    
    is_ajman = "Ajman" in community
    city = "Ajman" if is_ajman else "Dubai"
    
    ptype = random.choices(PROPERTY_TYPES, weights=[0.6, 0.2, 0.15, 0.05])[0]
    bedrooms = random.choices([0, 1, 2, 3, 4, 5], weights=[0.1, 0.3, 0.3, 0.2, 0.05, 0.05])[0]
    
    # Base size
    size = 400 + (bedrooms * 300) + random.randint(0, 300)
    if ptype == "Villa": size *= 1.5
    
    # Base price calculation
    base_price_sqft = 1000 if city == "Dubai" else 400
    price = int(size * base_price_sqft * price_multiplier * random.uniform(0.85, 1.2))
    
    # Status logic
    status = random.choice(STATUSES)
    handover = "Ready" if status == "Ready" else random.choice(["Q4 2025", "Q2 2026", "Q1 2027", "Q4 2027"])
    
    payment_plan = "Cash/Mortgage" if status == "Ready" else random.choice(["50/50", "60/40", "40/60 post-handover", "1% Monthly"])

    return {
        "id": f"SYN_{id_num:04d}",
        "title": f"{ptype} in {community} - {bedrooms} Bed",
        "project_name": f"{community} Tower {random.choice(['A', 'B', 'C'])}" if ptype == "Apartment" else f"{community} Villas",
        "developer": fake.company(),
        "community": community,
        "city": city,
        "property_type": ptype,
        "bedrooms": bedrooms,
        "bathrooms": bedrooms + 1,
        "size_sqft": size,
        "price_aed": price,
        "payment_plan": payment_plan,
        "handover": handover,
        "status": status,
        "amenities": ", ".join(random.sample(AMENITIES_POOL, k=random.randint(3, 6))),
        "nearby_landmarks": community,
        "roi_hint": f"{random.randint(5, 9)}% Net Yield" if random.random() > 0.5 else None,
        "latitude": lat_base + random.uniform(-0.01, 0.01),
        "longitude": lon_base + random.uniform(-0.01, 0.01),
        "image_url": f"https://via.placeholder.com/300x200?text={community.replace(' ', '+')}",
        "source": "synthetic",
        "featured": False
    }

def main():
    rows = []
    
    # Add Exclusives (replicated to hit 30 if needed, but we'll just upscale them or add slight variants)
    # Strategy: Add the 3 core exclusives, then create variants of them to match "seed at least 30 rows that are Deja Vu style"
    
    # 1. Add Exact Exclusives
    rows.extend(EXCLUSIVES)
    
    # 2. Add Variants of Exclusives (different units in same project)
    for i in range(27): # Need 27 more to hit 30 featured
        base = EXCLUSIVES[i % 3].copy()
        base["id"] = f"DV_VAR_{i:03d}"
        base["bedrooms"] = random.choice([base["bedrooms"], base["bedrooms"] + 1])
        base["price_aed"] = int(base["price_aed"] * random.uniform(0.9, 1.3))
        base["title"] = f"{base['project_name']} - {base['bedrooms']} Bed Unit"
        rows.append(base)

    # 3. Add Synthetic Data
    for i in range(TOTAL_ROWS - len(rows)):
        rows.append(generate_synthetic_row(i))
        
    df = pd.DataFrame(rows)
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"Generated {len(df)} properties at {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
