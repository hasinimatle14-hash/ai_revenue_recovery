import os
import json
from datetime import datetime, timedelta
from .human_review_rules import validate_reviewer_action

def get_data_dir():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    return os.path.join(project_root, "data")

def load_reviews():
    path = os.path.join(get_data_dir(), "human_reviews.json")
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_reviews(reviews):
    path = os.path.join(get_data_dir(), "human_reviews.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(reviews, f, indent=2)

def record_human_decision(review_id: str, decision: str, reason: str, reviewer: str = "merchant") -> dict:
    """
    Submits, validates, and persists a merchant reviewer decision.
    Raises:
        KeyError: If review_id does not exist.
        ValueError: If decision is invalid, duplicate, or unsafe.
    """
    reviews = load_reviews()
    review = next((r for r in reviews if r["review_id"] == review_id), None)
    
    if not review:
        raise KeyError(f"Review record '{review_id}' not found.")
        
    if review["review_status"] != "pending":
        raise ValueError(f"CONFLICT: Review record '{review_id}' is already {review['review_status']}.")
        
    event_id = review["event_id"]
    
    # Run safety rules check
    validation = validate_reviewer_action(event_id, decision)
    if not validation["is_safe"]:
        raise ValueError(f"UNSAFE: {validation['reason']}")
        
    # Update review record
    status_val = "approved" if decision == "approve" else "rejected"
    review["status"] = status_val
    review["review_status"] = status_val
    review["human_decision"] = decision
    review["reviewer_decision"] = decision
    review["reviewer_reason"] = reason
    review["final_action"] = validation["final_action"]
    review["reviewed_by"] = reviewer
    review["updated_at"] = datetime.now().isoformat() + "Z"
    review["reviewed_at"] = review["updated_at"]
    
    save_reviews(reviews)
    
    # Append chronological logs to audit trail
    audit_path = os.path.join(get_data_dir(), "audit_trail.json")
    if os.path.exists(audit_path):
        with open(audit_path, "r", encoding="utf-8") as f:
            audits = json.load(f)
            
        timestamp_str = review["reviewed_at"]
        
        # 1. human_decision_recorded
        audits.append({
            "event_id": event_id,
            "action": "human_decision_recorded",
            "actor": f"Reviewer ({reviewer})",
            "timestamp": timestamp_str,
            "status": "success",
            "description": f"Merchant decision '{decision}' recorded for review ID: '{review_id}'. Reason: {reason}"
        })
        
        # 2. review_completed
        audits.append({
            "event_id": event_id,
            "action": "review_completed",
            "actor": "AI Recovery Agent",
            "timestamp": (datetime.fromisoformat(timestamp_str[:-1]) + timedelta(seconds=2)).isoformat() + "Z",
            "status": "success",
            "description": f"Review queue cycle complete. Final recovery action resolved to: '{validation['final_action']}'"
        })
        
        # Re-sort chronologically
        audits.sort(key=lambda x: x["timestamp"])
        
        # Re-assign sequential audit IDs starting from AUD-0001
        for idx, record in enumerate(audits, start=1):
            record["audit_id"] = f"AUD-{idx:04d}"
            
        with open(audit_path, "w", encoding="utf-8") as f:
            json.dump(audits, f, indent=2)
            
    return review
