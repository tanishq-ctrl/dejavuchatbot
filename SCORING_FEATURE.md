# Transparent Scoring System

## Overview
A transparent, deterministic scoring system (0-100) that explains why each property was recommended, with detailed breakdown and human-readable reasons.

## Features

### Backend
- **Match Score Calculation**: 5-factor scoring model (0-100 points)
- **Score Breakdown**: Detailed factor-by-factor analysis
- **Top Reasons**: Human-readable explanations for UI display
- **Deterministic**: No randomness, stable results

### Frontend
- **Match Score Badge**: Prominent display (0-100) with color coding
- **Top Reasons**: Quick 2-4 reasons shown automatically
- **Expandable Breakdown**: Detailed score breakdown on demand
- **Progress Bars**: Visual representation of each factor

## Scoring Model

### Weights (Total: 100 points)
- **Budget Fit**: 35 points
  - Full points if price <= max_budget
  - Partial points if within +10% buffer
  - 0 points if > 10% over budget
  
- **Location Match**: 25 points
  - Full points for exact match
  - Partial points for fuzzy/word match
  - 0 points if no match
  
- **Bedrooms Match**: 20 points
  - Full points for exact match
  - 10 points for +/-1 bedrooms
  - 0 points otherwise
  
- **Property Type Match**: 10 points
  - Full points for exact match
  - 0 points otherwise
  
- **Status Match**: 10 points
  - Full points for exact match (Ready/Off-plan)
  - 0 points otherwise

### Scoring Examples

**Perfect Match (100/100):**
- Budget: Within limit (35 pts)
- Location: Exact match (25 pts)
- Bedrooms: Exact match (20 pts)
- Type: Exact match (10 pts)
- Status: Exact match (10 pts)

**Good Match (70/100):**
- Budget: Within limit (35 pts)
- Location: Exact match (25 pts)
- Bedrooms: +/-1 (10 pts)
- Type: No match (0 pts)
- Status: No match (0 pts)

**Partial Match (45/100):**
- Budget: Within limit (35 pts)
- Location: Partial match (10 pts)
- Bedrooms: No match (0 pts)
- Type: No match (0 pts)
- Status: No match (0 pts)

## API Response Format

Each property in `/api/chat` response now includes:

```json
{
  "id": "DV_001",
  "title": "Property Title",
  "match_score": 87.5,
  "score_breakdown": [
    {
      "factor": "Budget Fit",
      "weight": 35,
      "value": "AED 1.95M",
      "points": 35.0,
      "explanation": "Within your budget (AED 1.95M ≤ AED 2.0M)"
    },
    {
      "factor": "Location Match",
      "weight": 25,
      "value": "Palm Jumeirah",
      "points": 25.0,
      "explanation": "Exact location match: Palm Jumeirah"
    },
    ...
  ],
  "top_reasons": [
    "Within your budget (AED 1.95M ≤ AED 2.0M)",
    "Exact location match: Palm Jumeirah",
    "Bedrooms match: 2BR"
  ]
}
```

## Frontend Display

### Match Score Badge
- Large number (0-100) with color coding:
  - Green (≥80): Excellent match
  - Blue (≥60): Good match
  - Amber (≥40): Fair match
  - Gray (<40): Poor match
- Progress bar showing score percentage

### Top Reasons
- Automatically displayed below score
- Shows 2-4 top scoring factors
- Human-readable explanations

### Expandable Breakdown
- Click "Why this score?" to expand
- Shows all 5 factors with:
  - Factor name and weight
  - Points earned vs weight
  - Property value
  - Explanation
  - Progress bar per factor

## Testing

Run the test suite:
```bash
cd backend
python tests/test_scoring.py
```

Tests validate:
- Budget scoring (exact, below, within buffer, over)
- Location scoring (exact, partial, no match)
- Bedrooms scoring (exact, +/-1, no match)
- Full scoring with all factors
- Edge cases (missing data, empty intent)

## Backward Compatibility

- `match_score`, `score_breakdown`, and `top_reasons` are optional fields
- If missing, PropertyCard falls back to `match_reasons` display
- Old clients without scoring fields continue to work

## Usage Examples

### Query: "2 bed apartment in Palm Jumeirah under 2M"

**Property 1:**
- Price: AED 1.9M (within budget) → 35 pts
- Location: Palm Jumeirah (exact) → 25 pts
- Bedrooms: 2BR (exact) → 20 pts
- Type: Apartment (exact) → 10 pts
- Status: Ready (if requested) → 10 pts
- **Score: 100/100**

**Property 2:**
- Price: AED 1.8M (within budget) → 35 pts
- Location: Palm Jumeirah (exact) → 25 pts
- Bedrooms: 3BR (+1) → 10 pts
- Type: Apartment (exact) → 10 pts
- Status: Off-plan (if Ready requested) → 0 pts
- **Score: 80/100**

## Files Modified

**Backend:**
- `backend/core/recommender.py` - Added `_calculate_match_score()` method
- `backend/api/endpoints.py` - Added `ScoreBreakdownItem` model and fields

**Frontend:**
- `frontend/lib/api.ts` - Added scoring interfaces
- `frontend/components/property/PropertyCard.tsx` - Added score display

**Tests:**
- `backend/tests/test_scoring.py` - Comprehensive test suite

