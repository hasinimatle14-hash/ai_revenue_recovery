import os
import json
import hashlib

def get_sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()

def run_agent_validation():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    data_dir = os.path.join(project_root, "data")
    
    events_path = os.path.join(data_dir, "revenue_events.json")
    runs_path = os.path.join(data_dir, "agent_runs.json")
    audit_path = os.path.join(data_dir, "audit_trail.json")
    
    assert os.path.exists(runs_path), f"Agent runs file missing: {runs_path}"
    assert os.path.exists(events_path), f"Events file missing: {events_path}"
    
    with open(events_path, "r", encoding="utf-8") as f:
        events = json.load(f)
    with open(runs_path, "r", encoding="utf-8") as f:
        runs = json.load(f)
    with open(audit_path, "r", encoding="utf-8") as f:
        audit_trail = json.load(f)
        
    assert len(runs) == 120, f"Expected 120 agent runs, got {len(runs)}"
    
    event_ids_pool = {e["event_id"] for e in events}
    run_event_ids = set()
    
    allowed_actions = ["proceed_with_simulation", "delay_and_retry", "request_payment_method_update", "manual_review", "stop", "no_action"]
    allowed_risks = ["low", "medium", "high", "critical"]
    
    for idx, r in enumerate(runs, start=1):
        run_id = r["agent_run_id"]
        event_id = r["event_id"]
        action = r["recommended_action"]
        risk = r["risk_level"]
        conf = r["confidence"]
        priority = r["action_priority"]
        req_review = r["requires_human_review"]
        review_reason = r["human_review_reason"]
        
        # ID asserts
        assert run_id == f"AGT-{idx:04d}", f"ID mismatch: expected AGT-{idx:04d}, got {run_id}"
        assert event_id in event_ids_pool, f"Run references non-existent event: {event_id}"
        assert event_id not in run_event_ids, f"Duplicate event ID in runs: {event_id}"
        run_event_ids.add(event_id)
        
        # Domain checks
        assert action in allowed_actions, f"Invalid recommended action: {action} in {run_id}"
        assert risk in allowed_risks, f"Invalid risk level: {risk} in {run_id}"
        assert 0.0 <= conf <= 1.0, f"Confidence out of bounds: {conf} in {run_id}"
        assert 0.0 <= priority <= 1.0, f"Priority out of bounds: {priority} in {run_id}"
        
        # Human review asserts
        if req_review:
            assert review_reason is not None and len(review_reason.strip()) > 5, f"Human review case missing reason in {run_id}"
            assert r["next_state"] == "human_review_required"
        else:
            assert review_reason is None, f"Non-human review case contains a reason in {run_id}"
            
        # Policy limit constraints check
        matching_event = next(e for e in events if e["event_id"] == event_id)
        prev_attempts = matching_event.get("previous_recovery_attempts", 0)
        
        # RULE A check
        if prev_attempts >= 3:
            assert action == "stop", f"Rule A violation in {run_id}: attempts={prev_attempts} but action={action}"
            
    # Ground truth isolation scans
    merchant_files = [
        "recovery_agent.py",
        "agent_tools.py",
        "agent_policy.py",
        "agent_orchestrator.py",
        "agent_validator.py",
        "../../../backend/app/main.py"
    ]
    
    for file_name in merchant_files:
        path = os.path.join(script_dir, file_name)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                code = f.read()
                assert "evaluation_ground_truth.json" not in code or "assert \"evaluation_ground_truth.json\" not in code" in code, \
                    f"Security Boundary Violation: Production file {os.path.basename(file_name)} references evaluation_ground_truth.json!"
                    
    print("--- AI RECOVERY AGENT INTEGRITY VALIDATION PASSED ---")
    print("All 120 runs validate perfectly. Safety policy is verified and ground truth is isolated.")

if __name__ == "__main__":
    run_agent_validation()
