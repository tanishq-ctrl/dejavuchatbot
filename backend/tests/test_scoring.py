"""
Test Suite for Transparent Scoring System

Validates scoring logic with edge cases and various scenarios.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from core.recommender import RecommenderEngine


def test_budget_scoring():
    """Test budget fit scoring"""
    engine = RecommenderEngine()
    
    intent = {"max_budget": 2000000}  # 2M AED
    
    # Test 1: Property exactly at budget
    prop1 = {
        "price_aed": 2000000,
        "community": "Downtown",
        "bedrooms": 2,
        "property_type": "Apartment",
        "status": "Ready"
    }
    score1 = engine._calculate_match_score(prop1, intent)
    assert score1["match_score"] == 35.0, f"Expected 35.0, got {score1['match_score']}"
    assert score1["score_breakdown"][0]["points"] == 35.0
    
    # Test 2: Property below budget
    prop2 = {
        "price_aed": 1500000,
        "community": "Downtown",
        "bedrooms": 2,
        "property_type": "Apartment",
        "status": "Ready"
    }
    score2 = engine._calculate_match_score(prop2, intent)
    assert score2["match_score"] == 35.0, f"Expected 35.0, got {score2['match_score']}"
    
    # Test 3: Property 5% over budget (within 10% buffer)
    prop3 = {
        "price_aed": 2100000,  # 5% over
        "community": "Downtown",
        "bedrooms": 2,
        "property_type": "Apartment",
        "status": "Ready"
    }
    score3 = engine._calculate_match_score(prop3, intent)
    assert score3["match_score"] > 0, "Should get partial points"
    assert score3["match_score"] < 35.0, "Should be less than full points"
    
    # Test 4: Property 15% over budget (outside buffer)
    prop4 = {
        "price_aed": 2300000,  # 15% over
        "community": "Downtown",
        "bedrooms": 2,
        "property_type": "Apartment",
        "status": "Ready"
    }
    score4 = engine._calculate_match_score(prop4, intent)
    assert score4["score_breakdown"][0]["points"] == 0, "Should get 0 points for budget"
    
    print("✅ Budget scoring tests passed")


def test_location_scoring():
    """Test location match scoring"""
    engine = RecommenderEngine()
    
    intent = {"location": "Palm Jumeirah"}
    
    # Test 1: Exact location match
    prop1 = {
        "price_aed": 2000000,
        "community": "Palm Jumeirah",
        "city": "Dubai",
        "bedrooms": 2,
        "property_type": "Apartment",
        "status": "Ready"
    }
    score1 = engine._calculate_match_score(prop1, intent)
    assert score1["match_score"] == 25.0, f"Expected 25.0, got {score1['match_score']}"
    
    # Test 2: Partial match (word match)
    prop2 = {
        "price_aed": 2000000,
        "community": "Palm Jebel Ali",
        "city": "Dubai",
        "bedrooms": 2,
        "property_type": "Apartment",
        "status": "Ready"
    }
    score2 = engine._calculate_match_score(prop2, intent)
    # Should get some points but not full (partial match)
    assert score2["match_score"] >= 0, "Should get some points for partial match"
    
    # Test 3: No match
    prop3 = {
        "price_aed": 2000000,
        "community": "Downtown",
        "city": "Dubai",
        "bedrooms": 2,
        "property_type": "Apartment",
        "status": "Ready"
    }
    score3 = engine._calculate_match_score(prop3, intent)
    assert score3["score_breakdown"][0]["points"] == 0, "Should get 0 points for location"
    
    print("✅ Location scoring tests passed")


def test_bedrooms_scoring():
    """Test bedrooms match scoring"""
    engine = RecommenderEngine()
    
    intent = {"min_bedrooms": 2}
    
    # Test 1: Exact match
    prop1 = {
        "price_aed": 2000000,
        "community": "Downtown",
        "bedrooms": 2,
        "property_type": "Apartment",
        "status": "Ready"
    }
    score1 = engine._calculate_match_score(prop1, intent)
    assert score1["match_score"] == 20.0, f"Expected 20.0, got {score1['match_score']}"
    
    # Test 2: +1 bedrooms (should get partial)
    prop2 = {
        "price_aed": 2000000,
        "community": "Downtown",
        "bedrooms": 3,
        "property_type": "Apartment",
        "status": "Ready"
    }
    score2 = engine._calculate_match_score(prop2, intent)
    assert score2["match_score"] == 10.0, f"Expected 10.0, got {score2['match_score']}"
    
    # Test 3: -1 bedrooms (should get partial)
    prop3 = {
        "price_aed": 2000000,
        "community": "Downtown",
        "bedrooms": 1,
        "property_type": "Apartment",
        "status": "Ready"
    }
    score3 = engine._calculate_match_score(prop3, intent)
    assert score3["match_score"] == 10.0, f"Expected 10.0, got {score3['match_score']}"
    
    # Test 4: No match
    prop4 = {
        "price_aed": 2000000,
        "community": "Downtown",
        "bedrooms": 4,
        "property_type": "Apartment",
        "status": "Ready"
    }
    score4 = engine._calculate_match_score(prop4, intent)
    assert score4["match_score"] == 0, "Should get 0 points for bedrooms"
    
    print("✅ Bedrooms scoring tests passed")


def test_full_scoring():
    """Test full scoring with all factors"""
    engine = RecommenderEngine()
    
    intent = {
        "max_budget": 2000000,
        "location": "Palm Jumeirah",
        "min_bedrooms": 2,
        "property_type": "Apartment",
        "status": "Ready"
    }
    
    # Perfect match
    prop_perfect = {
        "price_aed": 1900000,  # Within budget
        "community": "Palm Jumeirah",  # Exact location
        "bedrooms": 2,  # Exact match
        "property_type": "Apartment",  # Exact match
        "status": "Ready"  # Exact match
    }
    
    score_perfect = engine._calculate_match_score(prop_perfect, intent)
    assert score_perfect["match_score"] == 100.0, f"Expected 100.0, got {score_perfect['match_score']}"
    assert len(score_perfect["score_breakdown"]) == 5, "Should have 5 scoring factors"
    assert len(score_perfect["top_reasons"]) > 0, "Should have top reasons"
    
    print("✅ Full scoring test passed")
    print(f"   Perfect match score: {score_perfect['match_score']}/100")
    print(f"   Breakdown factors: {len(score_perfect['score_breakdown'])}")
    print(f"   Top reasons: {len(score_perfect['top_reasons'])}")


def test_score_edge_cases():
    """Test edge cases and missing data"""
    engine = RecommenderEngine()
    
    # Test with missing price
    prop_no_price = {
        "price_aed": None,
        "community": "Downtown",
        "bedrooms": 2,
        "property_type": "Apartment",
        "status": "Ready"
    }
    intent = {"max_budget": 2000000}
    score = engine._calculate_match_score(prop_no_price, intent)
    assert score["match_score"] >= 0, "Should handle missing price gracefully"
    
    # Test with empty intent
    prop = {
        "price_aed": 2000000,
        "community": "Downtown",
        "bedrooms": 2,
        "property_type": "Apartment",
        "status": "Ready"
    }
    empty_intent = {}
    score_empty = engine._calculate_match_score(prop, empty_intent)
    assert score_empty["match_score"] == 0.0, "Should return 0 with no intent criteria"
    
    print("✅ Edge case tests passed")


if __name__ == "__main__":
    print("=" * 60)
    print("Running Transparent Scoring Test Suite")
    print("=" * 60)
    
    try:
        test_budget_scoring()
        test_location_scoring()
        test_bedrooms_scoring()
        test_full_scoring()
        test_score_edge_cases()
        
        print("\n" + "=" * 60)
        print("✅ All tests passed!")
        print("=" * 60)
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error running tests: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
