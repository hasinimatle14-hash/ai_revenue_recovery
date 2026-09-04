import os
import json
from datetime import datetime

def run_audit_validation():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    data_dir = os.path.join(project_root, "data")
    
    events_path = os.path.join(data_dir, "revenue_events.json")
    audit_path = os.path.join(data_dir, "audit_trail.json")
    
    assert os.path.exists(events_path), f"Events file missing: {events_path}"
    assert os.path.exists(audit_path), f"Audit file missing: {audit_path}"
    
    with open(events_path, "r") as f:
        events = json.load(f)
    with open(audit_path, "r") as f:
        audit_trail = json.load(f)
        
    assert len(events) == 120, f"Expected 120 events, got {len(events)}"
    assert len(audit_trail) >= 480, f"Expected at least 480 audit records, got {len(audit_trail)}"
    
    event_ids_pool = {e["event_id"] for e in events}
    
    audit_ids = set()
    prev_ts = None
    
    allowed_actions = [
        "event_detected", "diagnosis_generated", "decision_created", "execution_simulated",
        "agent_context_collected", "agent_diagnosis_reviewed", "agent_policy_checked",
        "agent_action_recommended", "agent_human_review_required",
        "human_decision_recorded", "review_completed",
        "strategy_features_generated", "cohort_analyzed", "strategy_generated", 
        "strategy_version_created", "strategy_simulated", "adaptive_learning_completed",
        "health_check_completed", "anomaly_detected", "governance_check_completed",
        "pipeline_status_updated", "control_center_compiled"
    ]
    allowed_actors = ["System", "AI Recovery Agent", "Manual Review", "System Optimizer", "System Health Monitor", "Anomaly Detector Engine", "Governance Engine", "Control Center Orchestrator"]
    allowed_statuses = ["success", "failed", "skipped", "blocked"]
    
    for idx, record in enumerate(audit_trail, start=1):
        aid = record["audit_id"]
        eid = record["event_id"]
        action = record["action"]
        actor = record["actor"]
        ts = record["timestamp"]
        status = record["status"]
        desc = record["description"]
        
        # ID constraints
        assert aid == f"AUD-{idx:04d}", f"Audit ID mismatch: expected AUD-{idx:04d}, got {aid}"
        assert aid not in audit_ids, f"Duplicate audit ID: {aid}"
        audit_ids.add(aid)
        
        assert eid in event_ids_pool or eid in ["SYSTEM", "None", None], f"Audit references non-existent event ID: {eid}"
        
        # Taxonomy constraints
        assert action in allowed_actions, f"Invalid action: {action} in {aid}"
        assert actor in allowed_actors or "Reviewer" in actor or "merchant" in actor, f"Invalid actor: {actor} in {aid}"
        assert status in allowed_statuses, f"Invalid status: {status} in {aid}"
        assert len(desc.strip()) > 10, f"Description too short in {aid}"
        
        # Timestamp parsing & chronological sort verification
        try:
            cleaned_ts = ts[:-1] if ts.endswith("Z") else ts
            dt = datetime.fromisoformat(cleaned_ts)
            
            if prev_ts is not None:
                assert dt >= prev_ts, f"Audit trail not sorted chronologically: {ts} is before {prev_ts.isoformat()}Z at {aid}"
            prev_ts = dt
        except ValueError:
            raise AssertionError(f"Invalid timestamp in {aid}: {ts}")
            
    # Confirm code separation
    for file_name in ["audit_generator.py", "audit_validator.py"]:
        path = os.path.join(script_dir, file_name)
        with open(path, "r") as f:
            code = f.read()
            assert "evaluation_ground_truth.json" not in code or "assert \"evaluation_ground_truth.json\" not in code" in code, \
                f"Validation Failed: {file_name} contains references to evaluation_ground_truth.json!"
                
    print("--- AUDIT TRAIL VALIDATION PASSED ---")

if __name__ == "__main__":
    run_audit_validation()
