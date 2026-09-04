import os
import json

def run_review_generation():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    data_dir = os.path.join(project_root, "data")
    
    runs_path = os.path.join(data_dir, "agent_runs.json")
    reviews_path = os.path.join(data_dir, "human_reviews.json")
    if not os.path.exists(runs_path):
        print(f"Error: Agent runs file missing at {runs_path}")
        return
        
    with open(runs_path, "r", encoding="utf-8") as f:
        runs = json.load(f)
        
    review_cases = [r for r in runs if r.get("requires_human_review")]
    print(f"Found {len(review_cases)} agent runs requiring human review.")
    
    human_reviews = []
    for idx, r in enumerate(review_cases, start=1):
        human_reviews.append({
            "review_id": f"REV-{idx:04d}",
            "event_id": r["event_id"],
            "agent_run_id": r["agent_run_id"],
            "diagnosis_id": r["diagnosis_id"],
            "decision_id": r["decision_id"],
            "status": "pending",
            "review_status": "pending",
            "original_agent_action": r["recommended_action"],
            "proposed_action": r["recommended_action"],
            "risk_level": r["risk_level"],
            "agent_confidence": r["confidence"],
            "allowed_actions": [
                "approve_simulation",
                "reject_simulation"
            ],
            "human_decision": None,
            "final_action": None,
            "review_reason": r.get("human_review_reason", "High-value transaction with conflicting recovery signals."),
            "reviewed_by": None,
            "reviewed_at": None,
            "reviewer_reason": None,
            "created_at": "2026-08-30T22:00:00Z",
            "updated_at": "2026-08-30T22:00:00Z"
        })
        
    with open(reviews_path, "w", encoding="utf-8") as f:
        json.dump(human_reviews, f, indent=2)
        
    print(f"Generated {len(human_reviews)} review records in {reviews_path}")
    return human_reviews

if __name__ == "__main__":
    run_review_generation()
