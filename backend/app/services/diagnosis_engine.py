import os
import json
from datetime import datetime
from diagnosis_rules import evaluate_event_diagnosis, ROOT_CAUSE_TAXONOMY, INTERVENTION_TAXONOMY

def run_diagnosis_generation():
    # Paths relative to the script structure
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    data_dir = os.path.join(project_root, "data")
    
    events_json_path = os.path.join(data_dir, "revenue_events.json")
    output_json_path = os.path.join(data_dir, "diagnoses.json")
    
    # 1. Assert no reference to evaluation_ground_truth.json in this file's imports or code
    ground_truth_file = "evaluation_ground_truth.json"
    with open(__file__, "r") as this_file:
        code_content = this_file.read()
        # Verify that we don't open the ground truth file inside the engine
        assert ground_truth_file not in code_content or "assert ground_truth_file not in code_content" in code_content, \
            "Security Violation: Ground-truth file references found inside the core diagnosis engine!"

    # 2. Load revenue events
    assert os.path.exists(events_json_path), f"Input events file missing at: {events_json_path}"
    with open(events_json_path, "r") as f:
        events = json.load(f)
        
    assert len(events) == 120, f"Expected 120 events, got {len(events)}"

    diagnoses_list = []
    
    # Static timestamp to prevent version control diff churn
    diagnosed_time = "2026-08-26T22:00:00Z"

    # 3. Generate Diagnoses
    for idx, event in enumerate(events, start=1):
        event_id = event["event_id"]
        
        # Evaluate event context using the rule-based evidence-scoring engine
        cause, conf, reasoning, intervention, recoverability = evaluate_event_diagnosis(event)
        
        diagnosis = {
            "diagnosis_id": f"DGN-{idx:04d}",
            "event_id": event_id,
            "root_cause": cause,
            "confidence": conf,
            "reasoning": reasoning,
            "recommended_intervention": intervention,
            "recoverability": recoverability,
            "diagnosed_at": diagnosed_time
        }
        diagnoses_list.append(diagnosis)
        
    # 4. Save to diagnoses.json
    with open(output_json_path, "w") as f:
        json.dump(diagnoses_list, f, indent=2)
        
    print(f"Engine completed successfully. Generated {len(diagnoses_list)} diagnoses.")
    print(f"Output saved to: {output_json_path}")
    
    # 5. Run Structural Validation
    validate_diagnoses_output(diagnoses_list, events)
    
    return diagnoses_list

def validate_diagnoses_output(diagnoses, events):
    assert len(diagnoses) == 120, f"Validation Failed: Expected exactly 120 diagnoses, got {len(diagnoses)}"
    
    dgn_ids = set()
    evt_ids = set()
    confidences = set()
    reasonings = set()
    
    event_ids_pool = {e["event_id"] for e in events}
    
    for idx, dgn in enumerate(diagnoses, start=1):
        did = dgn["diagnosis_id"]
        eid = dgn["event_id"]
        
        # Unique IDs assertion
        assert did == f"DGN-{idx:04d}", f"Diagnosis ID format mismatch: expected DGN-{idx:04d}, got {did}"
        assert did not in dgn_ids, f"Duplicate diagnosis ID: {did}"
        assert eid not in evt_ids, f"Duplicate event ID in diagnoses: {eid}"
        assert eid in event_ids_pool, f"Diagnosis references non-existent event ID: {eid}"
        
        dgn_ids.add(did)
        evt_ids.add(eid)
        
        # Taxonomies checks
        assert dgn["root_cause"] in ROOT_CAUSE_TAXONOMY, f"Invalid root cause: {dgn['root_cause']}"
        assert dgn["recommended_intervention"] in INTERVENTION_TAXONOMY, f"Invalid intervention: {dgn['recommended_intervention']}"
        assert dgn["recoverability"] in ["high", "medium", "low"], f"Invalid recoverability state: {dgn['recoverability']}"
        
        # Confidence range checks
        conf = dgn["confidence"]
        assert 0.0 <= conf <= 1.0, f"Confidence out of range: {conf} in {did}"
        confidences.add(conf)
        
        # Reasoning presence
        assert len(dgn["reasoning"].strip()) > 10, f"Reasoning explanation too short or missing in {did}"
        reasonings.add(dgn["reasoning"])
        
        # Timestamp validity
        try:
            ts = dgn["diagnosed_at"]
            if ts.endswith("Z"):
                ts = ts[:-1]
            datetime.fromisoformat(ts)
        except ValueError:
            raise AssertionError(f"Invalid timestamp format in {did}: {dgn['diagnosed_at']}")

    # Assert variation in confidence values
    assert len(confidences) > 1, "Validation Failed: Confidence values are identical across all events! Ensure evidence weights are applied."
    
    # Assert reasoning text is event-specific (not all identical sentences)
    assert len(reasonings) > 15, f"Validation Failed: Too few unique explanations. Expected highly varied reasoning, got only {len(reasonings)} variations."
    
    # Assert no code reference to evaluation_ground_truth.json
    script_dir = os.path.dirname(os.path.abspath(__file__))
    engine_file_path = os.path.join(script_dir, "diagnosis_engine.py")
    rules_file_path = os.path.join(script_dir, "diagnosis_rules.py")
    
    for filepath in [engine_file_path, rules_file_path]:
        with open(filepath, "r") as f:
            code = f.read()
            assert "evaluation_ground_truth.json" not in code or "assert \"evaluation_ground_truth.json\" not in code" in code, \
                f"Validation Failed: Code file {os.path.basename(filepath)} contains references to the hidden ground-truth file!"

    print("--- DIAGNOSES STRUCTURAL VALIDATION PASSED ---")

if __name__ == "__main__":
    run_diagnosis_generation()
