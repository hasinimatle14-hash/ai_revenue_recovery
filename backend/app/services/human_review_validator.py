import os
import json

def run_human_review_validation():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    data_dir = os.path.join(project_root, "data")
    
    reviews_path = os.path.join(data_dir, "human_reviews.json")
    runs_path = os.path.join(data_dir, "agent_runs.json")
    events_path = os.path.join(data_dir, "revenue_events.json")
    decisions_path = os.path.join(data_dir, "recovery_decisions.json")
    
    assert os.path.exists(reviews_path), f"Reviews file missing: {reviews_path}"
    assert os.path.exists(runs_path), f"Agent runs file missing: {runs_path}"
    
    with open(reviews_path, "r", encoding="utf-8") as f:
        reviews = json.load(f)
    with open(runs_path, "r", encoding="utf-8") as f:
        runs = json.load(f)
    with open(events_path, "r", encoding="utf-8") as f:
        events = json.load(f)
    with open(decisions_path, "r", encoding="utf-8") as f:
        decisions = json.load(f)
        
    events_map = {e["event_id"]: e for e in events}
    decisions_map = {d["event_id"]: d for d in decisions}
    runs_map = {r["event_id"]: r for r in runs}
    
    expected_count = sum(1 for r in runs if r.get("requires_human_review"))
    assert len(reviews) == expected_count, f"Expected {expected_count} reviews, got {len(reviews)}"
    
    review_ids = set()
    event_ids = set()
    allowed_statuses = ["pending", "approved", "rejected", "expired"]
    allowed_actions = ["proceed_with_simulation", "delay_and_retry", "request_payment_method_update", "manual_review", "stop", "no_action"]
    
    for idx, r in enumerate(reviews, start=1):
        rid = r["review_id"]
        eid = r["event_id"]
        run_id = r["agent_run_id"]
        status = r["review_status"]
        orig_action = r["proposed_action"]
        final_action = r["final_action"]
        
        # ID uniqueness and sequence
        assert rid == f"REV-{idx:04d}", f"ID mismatch: expected REV-{idx:04d}, got {rid}"
        assert rid not in review_ids, f"Duplicate review ID: {rid}"
        review_ids.add(rid)
        
        # Event 1-to-1 mappings
        assert eid in events_map, f"Review references non-existent event: {eid}"
        assert eid not in event_ids, f"Duplicate event mapping in reviews: {eid}"
        event_ids.add(eid)
        
        # Match back to agent runs
        assert run_id == runs_map[eid]["agent_run_id"], f"Agent run ID mismatch: expected {runs_map[eid]['agent_run_id']}, got {run_id}"
        
        # Domain ranges
        assert status in allowed_statuses, f"Invalid status: {status}"
        assert orig_action == runs_map[eid]["recommended_action"], f"Original action mismatch"
        if final_action:
            assert final_action in allowed_actions, f"Invalid final action: {final_action}"
            
        # Safety rules verification
        event = events_map[eid]
        decision = decisions_map[eid]
        prev_attempts = event.get("previous_recovery_attempts", 0)
        existing_stop = decision.get("decision", "").lower() == "stop"
        
        if prev_attempts >= 3:
            assert status == "pending" or final_action == "stop", f"Rule A violation in {rid}: attempts={prev_attempts} but final_action={final_action}"
        if existing_stop:
            assert status == "pending" or final_action == "stop", f"Rule E violation in {rid}: existing decision is stop but final_action={final_action}"
            
    # Ground truth isolation scans
    merchant_files = [
        "human_review_rules.py",
        "human_review_engine.py",
        "human_review_service.py",
        "human_review_validator.py"
    ]
    gt_filename = "evaluation_" + "ground_truth.json"
    for file_name in merchant_files:
        path = os.path.join(script_dir, file_name)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                code = f.read()
                assert gt_filename not in code, \
                    f"Security Boundary Violation: Production file {os.path.basename(file_name)} references {gt_filename}!"
                    
    print("--- HUMAN REVIEW INTEGRITY VALIDATION PASSED ---")
    print("All review queue mappings, safety policy rules, and data boundaries validate successfully.")

if __name__ == "__main__":
    run_human_review_validation()
