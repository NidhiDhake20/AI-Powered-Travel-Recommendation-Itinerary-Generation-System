# recommendation-service/services/scoring_engine.py

from shared_config import (
    DESTINATION_DETAILS, PURPOSE_DESTINATIONS,
    INTEREST_DESTINATIONS, AGE_DESTINATIONS,
    HEALTH_RESTRICTIONS,
)


def apply_health_filter(destinations: list, health_issue: str) -> list:
    restricted = HEALTH_RESTRICTIONS.get(health_issue, [])
    return [d for d in destinations if d not in restricted]


def score_purpose(destination: str, purpose: str) -> float:
    preferred = PURPOSE_DESTINATIONS.get(purpose, [])
    if destination in preferred:
        return 100.0
    dest_type  = DESTINATION_DETAILS.get(destination, {}).get("type", "")
    type_map   = {
        "Adventure":       ["Adventure"],
        "Honeymoon":       ["Beach", "Nature"],
        "Family Vacation": ["City", "Historical", "Nature"],
        "Leisure":         ["Historical", "Nature", "Beach"],
        "Business":        ["City"],
    }
    if dest_type in type_map.get(purpose, []):
        return 70.0
    return 40.0


def score_age(destination: str, age_range: str) -> float:
    preferred = AGE_DESTINATIONS.get(age_range, [])
    if destination in preferred:
        return 100.0
    dest_type = DESTINATION_DETAILS.get(destination, {}).get("type", "")
    age_type_map = {
        "18-25": ["Adventure", "Beach"],
        "26-35": ["Nature", "Beach", "Adventure"],
        "36-45": ["Nature", "Historical", "City"],
        "46-60": ["Historical", "City", "Nature"],
    }
    if dest_type in age_type_map.get(age_range, []):
        return 70.0
    return 50.0


def score_budget(destination: str, budget_inr: int) -> float:
    """Simple budget scoring based on destination type"""
    dest_type = DESTINATION_DETAILS.get(destination, {}).get("type", "")
    budget_ranges = {
        "Beach":      (15000, 80000),
        "Adventure":  (25000, 90000),
        "Nature":     (15000, 75000),
        "Historical": (10000, 60000),
        "City":       (20000, 100000),
    }
    min_b, max_b = budget_ranges.get(dest_type, (10000, 130000))
    if min_b <= budget_inr <= max_b:
        return 100.0
    elif budget_inr < min_b:
        diff = (min_b - budget_inr) / min_b * 100
        return max(0, 100 - diff)
    else:
        diff = (budget_inr - max_b) / max_b * 50
        return max(50, 100 - diff)


def merge_scores(
    destination:   str,
    ml_score:      float,
    api_score:     float,
    purpose_score: float,
    age_score:     float,
    budget_score:  float,
    has_ml:        bool,
    has_api:       bool,
) -> float:
    """Merge all scores into final score"""
    if has_ml and has_api:
        base = ml_score * 0.50 + api_score * 0.50
    elif has_ml:
        base = ml_score * 0.70
    else:
        base = api_score * 0.60

    final = (
        base          * 0.50 +
        purpose_score * 0.20 +
        age_score     * 0.15 +
        budget_score  * 0.15
    )
    return round(final, 2)


def build_reasons(
    destination:   str,
    interests:     list,
    purpose:       str,
    age_range:     str,
    budget_inr:    int,
    purpose_score: float,
) -> list:
    reasons = []
    from shared_config import INTEREST_DESTINATIONS
    matched = [i for i in interests if destination in INTEREST_DESTINATIONS.get(i, [])]
    if matched:
        reasons.append(f"Matches your interests: {', '.join(matched)}")
    if purpose_score >= 90:
        reasons.append(f"Top pick for {purpose} trips")
    elif purpose_score >= 70:
        reasons.append(f"Great choice for {purpose}")
    dest = DESTINATION_DETAILS.get(destination, {})
    reasons.append(f"Best visited: {dest.get('best_time', 'Year round')}")
    reasons.append(f"Famous for {dest.get('cuisine', 'local cuisine')}")
    return reasons[:4]