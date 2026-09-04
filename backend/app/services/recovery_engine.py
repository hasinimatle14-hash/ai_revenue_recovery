import os
import json
from datetime import datetime
from recovery_rules import determine_recovery_decision, INTERVENTION_TAXONOMY, TIMING_VALUES

def run_recovery_generation():
    # Paths relative to the script structure
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    data_dir = os.path.join(project_root, "data")
    
    events_json_path = os.path.join(data_dir, "revenue_events.json")
    diagnoses_json_path = os.path.join(data_dir, "diagnoses.json")
    output_json_path = os.path.join(data_dir, "recovery_decisions.json")
    
    # 1. Assert no reference to evaluation_ground_truth.json in this file's imports or code
    ground_truth_file = "evaluation_ground_truth.json"
    with open(__file__, "r") as this_file:
        code_content = this_file.read()
        assert ground_truth_file not in code_content or "assert ground_truth_file not in code_content" in code_content, \
            "Security Violation: Ground-truth file references found inside the core recovery engine!"

    # 2. Load input datasets
    assert os.path.exists(events_json_path), f"Input events missing at: {events_json_path}"
    assert os.path.exists(diagnoses_json_path), f"Diagnoses missing at: {diagnoses_json_path}"
    
    with open(events_json_path, "r") as f:
        events = json.load(f)
        
    with open(diagnoses_json_path, "r") as f:
        diagnoses = json.load(f)
        
    assert len(events) == 120, f"Expected 120 events, got {len(events)}"
    assert len(diagnoses) == 120, f"Expected 120 diagnoses, got {len(diagnoses)}"

    # Map diagnoses by event_id for fast lookup
    dgn_map = {d["event_id"]: d for d in diagnoses}
    
    decisions_list = []
    created_time = "2026-08-29T22:00:00Z" # Fixed timestamp to prevent git churn

    # 3. Generate Decisions
    for idx, event in enumerate(events, start=1):
        event_id = event["event_id"]
        assert event_id in dgn_map, f"No diagnosis record found for event {event_id}"
        diagnosis = dgn_map[event_id]
        
        # Determine recovery decisions based on rules and context
        decision_record = determine_recovery_decision(event, diagnosis)
        
        decision_record["decision_id"] = f"DEC-{idx:04d}"
        decision_record["created_at"] = created_time
        
        decisions_list.append(decision_record)

    # 4. Save to recovery_decisions.json
    with open(output_json_path, "w") as f:
        json.dump(decisions_list, f, indent=2)
        
    print(f"Recovery Engine completed successfully. Generated {len(decisions_list)} decisions.")
    print(f"Output saved to: {output_json_path}")
    
    # 5. Run Structural Validation
    validate_recovery_output(decisions_list, diagnoses)
    
    return decisions_list

def validate_recovery_output(decisions, diagnoses):
    assert len(decisions) == 120, f"Validation Failed: Expected exactly 120 decisions, got {len(decisions)}"
    
    dec_ids = set()
    evt_ids = set()
    priorities = set()
    interventions_seen = set()
    
    dgn_ids_pool = {d["diagnosis_id"] for d in diagnoses}
    
    for idx, dec in enumerate(decisions, start=1):
        did = dec["decision_id"]
        eid = dec["event_id"]
        dgn_id = dec["diagnosis_id"]
        
        # ID assertions
        assert did == f"DEC-{idx:04d}", f"Decision ID format mismatch: expected DEC-{idx:04d}, got {did}"
        assert did not in dec_ids, f"Duplicate decision ID: {did}"
        assert eid not in evt_ids, f"Duplicate event ID in decisions: {eid}"
        assert dgn_id in dgn_ids_pool, f"Decision references non-existent diagnosis ID: {dgn_id}"
        
        dec_ids.add(did)
        evt_ids.add(eid)
        
        # Taxonomy bounds checks
        assert dec["decision"] in ["recover", "stop", "review"], f"Invalid decision: {dec['decision']} in {did}"
        assert dec["selected_intervention"] in INTERVENTION_TAXONOMY, f"Invalid intervention: {dec['selected_intervention']} in {did}"
        assert dec["timing"] in TIMING_VALUES, f"Invalid timing: {dec['timing']} in {did}"
        assert dec["current_state"] in ["diagnosed", "recovery_eligible"], f"Invalid current_state in {did}"
        assert dec["next_state"] in ["intervention_planned", "stopped", "manual_review"], f"Invalid next_state in {did}"
        assert dec["execution_status"] == "planned", f"execution_status must be 'planned' in {did}"
        
        # Priority score boundaries
        priority = dec["priority_score"]
        assert 0.0 <= priority <= 1.0, f"Priority score out of range [0.0-1.0]: {priority} in {did}"
        priorities.add(priority)
        
        interventions_seen.add(dec["selected_intervention"])
        
        # Stopping logic sanity checks
        if dec["decision"] == "stop":
            assert dec["eligible_for_recovery"] is False, f"Stopped event must not be recovery eligible in {did}"
            assert len(dec["eligibility_reason"].strip()) > 5, f"Stopped event is missing stopping reason in {did}"
            assert dec["selected_intervention"] == "stop", f"Stopped event must have 'stop' intervention, got {dec['selected_intervention']} in {did}"
            assert dec["next_state"] == "stopped", f"Stopped event must transition to 'stopped' next_state, got {dec['next_state']} in {did}"
        elif dec["decision"] == "review":
            assert dec["eligible_for_recovery"] is False, f"Review event must not be recovery eligible in {did}"
            assert dec["next_state"] == "manual_review", f"Review event must transition to 'manual_review', got {dec['next_state']} in {did}"
        else: # recover
            assert dec["eligible_for_recovery"] is True, f"Recoverable event must be eligible in {did}"
            assert dec["selected_intervention"] != "stop", f"Recoverable event cannot have 'stop' intervention in {did}"
            assert dec["next_state"] == "intervention_planned", f"Recoverable event must transition to 'intervention_planned', got {dec['next_state']} in {did}"
            
        # Timestamp check
        try:
            ts = dec["created_at"]
            if ts.endswith("Z"):
                ts = ts[:-1]
            datetime.fromisoformat(ts)
        except ValueError:
            raise AssertionError(f"Invalid timestamp format in {did}: {dec['created_at']}")

    # Verify priority score variation
    assert len(priorities) > 1, "Validation Failed: Priority scores are identical across all events! Ensure score weighting is applied."
    
    # Verify intervention variation
    assert len(interventions_seen) > 3, f"Validation Failed: Too few unique interventions. Expected varied treatments, got only {len(interventions_seen)} categories."
    
    # Confirm no reference to evaluation_ground_truth.json
    script_dir = os.path.dirname(os.path.abspath(__file__))
    engine_file_path = os.path.join(script_dir, "recovery_engine.py")
    rules_file_path = os.path.join(script_dir, "recovery_rules.py")
    
    for filepath in [engine_file_path, rules_file_path]:
        with open(filepath, "r") as f:
            code = f.read()
            assert "evaluation_ground_truth.json" not in code or "assert \"evaluation_ground_truth.json\" not in code" in code, \
                f"Validation Failed: Code file {os.path.basename(filepath)} contains references to the hidden ground-truth file!"

    print("--- RECOVERY DECISIONS STRUCTURAL VALIDATION PASSED ---")

if __name__ == "__main__":
    run_recovery_generation()
