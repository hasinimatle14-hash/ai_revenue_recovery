import os
import json
from datetime import datetime

def run_simulation_validation():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    data_dir = os.path.join(project_root, "data")
    
    events_json_path = os.path.join(data_dir, "revenue_events.json")
    attempts_json_path = os.path.join(data_dir, "recovery_attempts.json")
    summary_json_path = os.path.join(data_dir, "recovery_execution_summary.json")
    
    assert os.path.exists(events_json_path), f"Events file missing: {events_json_path}"
    assert os.path.exists(attempts_json_path), f"Attempts file missing: {attempts_json_path}"
    assert os.path.exists(summary_json_path), f"Summary file missing: {summary_json_path}"
    
    with open(events_json_path, "r") as f:
        events = json.load(f)
    with open(attempts_json_path, "r") as f:
        attempts = json.load(f)
    with open(summary_json_path, "r") as f:
        summary = json.load(f)
        
    assert len(events) == 120
    assert len(attempts) == 120
    
    events_map = {e["event_id"]: e for e in events}
    
    # 1. Individual Attempt Checks
    attempt_ids = set()
    event_ids = set()
    
    successful_count = 0
    failed_count = 0
    skipped_count = 0
    blocked_count = 0
    sum_recovered_inr = 0.0
    
    for idx, att in enumerate(attempts, start=1):
        att_id = att["attempt_id"]
        event_id = att["event_id"]
        
        # ID assertions
        assert att_id == f"ATT-{idx:04d}", f"Attempt ID format mismatch: {att_id}"
        assert att_id not in attempt_ids, f"Duplicate attempt ID: {att_id}"
        assert event_id not in event_ids, f"Duplicate event ID in attempts: {event_id}"
        assert event_id in events_map, f"Attempt maps to non-existent event: {event_id}"
        
        attempt_ids.add(att_id)
        event_ids.add(event_id)
        
        event = events_map[event_id]
        event_amt = event["amount"]
        event_amt_inr = event["amount_in_inr"]
        
        # Status taxonomy bounds
        assert att["execution_status"] in ["completed", "skipped", "blocked"]
        assert att["outcome"] in ["success", "failed", "skipped", "blocked"]
        
        recovered_amt = att["simulated_amount_recovered"]
        assert recovered_amt >= 0.0, f"Recovered amount is negative in {att_id}"
        
        # Outcome mapping checks
        outcome = att["outcome"]
        if outcome == "success":
            assert att["execution_status"] == "completed"
            assert recovered_amt == event_amt, f"Successful amount mismatch: expected {event_amt}, got {recovered_amt} in {att_id}"
            successful_count += 1
            sum_recovered_inr += event_amt_inr
        elif outcome == "failed":
            assert att["execution_status"] == "completed"
            assert recovered_amt == 0.0, f"Failed attempt recovered non-zero: {recovered_amt}"
            failed_count += 1
        elif outcome == "skipped":
            assert att["execution_status"] == "skipped"
            assert recovered_amt == 0.0, f"Skipped attempt recovered non-zero: {recovered_amt}"
            skipped_count += 1
        elif outcome == "blocked":
            assert att["execution_status"] == "blocked"
            assert recovered_amt == 0.0, f"Blocked attempt recovered non-zero: {recovered_amt}"
            blocked_count += 1
            
        # Timestamp validity
        try:
            ts = att["executed_at"]
            if ts.endswith("Z"):
                ts = ts[:-1]
            datetime.fromisoformat(ts)
        except ValueError:
            raise AssertionError(f"Invalid timestamp in {att_id}: {att['executed_at']}")
            
    # 2. Summary Matching Checks
    assert summary["total_events"] == 120
    assert summary["attempts_created"] == 120
    assert summary["successful_recoveries"] == successful_count, f"Summary success count mismatch: {summary['successful_recoveries']} vs {successful_count}"
    assert summary["failed_attempts"] == failed_count, f"Summary failed count mismatch: {summary['failed_attempts']} vs {failed_count}"
    assert summary["skipped_events"] == skipped_count, f"Summary skipped count mismatch: {summary['skipped_events']} vs {skipped_count}"
    assert summary["blocked_events"] == blocked_count, f"Summary blocked count mismatch: {summary['blocked_events']} vs {blocked_count}"
    
    assert abs(summary["simulated_revenue_recovered"] - sum_recovered_inr) < 0.01, f"Summary revenue mismatch: {summary['simulated_revenue_recovered']} vs {sum_recovered_inr}"
    
    # 3. Code Separation Checks
    for file_name in ["recovery_simulator.py", "recovery_simulation_validator.py"]:
        path = os.path.join(script_dir, file_name)
        with open(path, "r") as f:
            code = f.read()
            assert "evaluation_ground_truth.json" not in code or "assert \"evaluation_ground_truth.json\" not in code" in code, \
                f"Validation Failed: {file_name} contains references to evaluation_ground_truth.json!"
                
    print("--- RECOVERY SIMULATION VALIDATION PASSED ---")

if __name__ == "__main__":
    run_simulation_validation()
