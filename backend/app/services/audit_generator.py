import os
import json
from datetime import datetime, timedelta

def add_time(ts_str: str, seconds: int = 0, hours: int = 0) -> str:
    """Helper to add offsets chronologically to timestamp strings."""
    if ts_str.endswith("Z"):
        ts_str = ts_str[:-1]
    dt = datetime.fromisoformat(ts_str)
    dt = dt + timedelta(seconds=seconds, hours=hours)
    return dt.isoformat() + "Z"

def run_audit_generation():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    data_dir = os.path.join(project_root, "data")
    
    events_path = os.path.join(data_dir, "revenue_events.json")
    diagnoses_path = os.path.join(data_dir, "diagnoses.json")
    decisions_path = os.path.join(data_dir, "recovery_decisions.json")
    attempts_path = os.path.join(data_dir, "recovery_attempts.json")
    output_path = os.path.join(data_dir, "audit_trail.json")
    with open(events_path, "r") as f:
        events = json.load(f)
    with open(diagnoses_path, "r") as f:
        diagnoses = json.load(f)
    with open(decisions_path, "r") as f:
        decisions = json.load(f)
    with open(attempts_path, "r") as f:
        attempts = json.load(f)
        
    events_map = {e["event_id"]: e for e in events}
    diagnoses_map = {d["event_id"]: d for d in diagnoses}
    decisions_map = {dec["event_id"]: dec for dec in decisions}
    attempts_map = {att["event_id"]: att for att in attempts}
    
    raw_audit_records = []
    
    for event_id in events_map:
        event = events_map[event_id]
        diagnosis = diagnoses_map[event_id]
        decision = decisions_map[event_id]
        attempt = attempts_map[event_id]
        
        base_ts = event["timestamp"]
        currency = event["currency"]
        amount = event["amount"]
        amount_in_inr = event["amount_in_inr"]
        
        # 1. Event Detected Audit Log
        raw_audit_records.append({
            "event_id": event_id,
            "action": "event_detected",
            "actor": "System",
            "timestamp": base_ts,
            "status": "success",
            "description": f"Revenue at risk event detected. Amount: {amount} {currency} (INR {amount_in_inr:,.2f}). Ingestion pipeline connected."
        })
        
        # 2. Diagnosis Generated Audit Log
        diag_ts = add_time(base_ts, seconds=2)
        raw_audit_records.append({
            "event_id": event_id,
            "action": "diagnosis_generated",
            "actor": "AI Recovery Agent",
            "timestamp": diag_ts,
            "status": "success",
            "description": f"AI Engine diagnosed failure cause as '{diagnosis['root_cause'].replace('_', ' ')}' with {int(diagnosis['confidence']*100)}% confidence. Forecasted recoverability: {diagnosis['recoverability']}."
        })
        
        # 3. Decision Created Audit Log
        dec_ts = add_time(base_ts, seconds=5)
        raw_audit_records.append({
            "event_id": event_id,
            "action": "decision_created",
            "actor": "AI Recovery Agent",
            "timestamp": dec_ts,
            "status": "success",
            "description": f"Automated recovery decision calculated. Selected intervention: '{decision['selected_intervention']}' scheduled in {decision['timing'].replace('_', ' ')}. Priority score: {decision['priority_score']}."
        })
        
        # 4. Simulation Execution Audit Log
        exec_ts = base_ts
        timing_str = decision["timing"]
        if timing_str == "immediate":
            exec_ts = add_time(base_ts, seconds=10)
        elif timing_str == "1_hour":
            exec_ts = add_time(base_ts, hours=1)
        elif timing_str == "6_hours":
            exec_ts = add_time(base_ts, hours=6)
        elif timing_str == "24_hours":
            exec_ts = add_time(base_ts, hours=24)
        elif timing_str == "48_hours":
            exec_ts = add_time(base_ts, hours=48)
        elif timing_str == "3_days":
            exec_ts = add_time(base_ts, hours=72)
            
        outcome = attempt["outcome"]
        status = outcome # success, failed, skipped, blocked
        actor = "AI Recovery Agent"
        if outcome == "skipped":
            actor = "System"
        elif outcome == "blocked":
            actor = "Manual Review"
            
        desc = ""
        if outcome == "success":
            desc = f"Simulated retry execution succeeded. Simulated amount recovered: {attempt['simulated_amount_recovered']} {currency}."
        elif outcome == "failed":
            desc = f"Simulated retry execution failed. Reason: {attempt['failure_reason']}. Retry feedback: {attempt['execution_reason']}"
        elif outcome == "skipped":
            desc = f"Simulated retry execution skipped. Reason: {attempt['failure_reason']}"
        elif outcome == "blocked":
            desc = f"Simulated retry execution blocked. Reason: {attempt['failure_reason']} Escalating task queue."
            
        raw_audit_records.append({
            "event_id": event_id,
            "action": "execution_simulated",
            "actor": actor,
            "timestamp": exec_ts,
            "status": status,
            "description": desc
        })
        
    # Chronological sort across all events so the logs flow naturally in time
    raw_audit_records.sort(key=lambda x: x["timestamp"])
    
    # Assign sequential audit IDs
    for idx, record in enumerate(raw_audit_records, start=1):
        record["audit_id"] = f"AUD-{idx:04d}"
        
    # Write output
    with open(output_path, "w") as f:
        json.dump(raw_audit_records, f, indent=2)
        
    print(f"Audit trail generated: {len(raw_audit_records)} records saved to {output_path}")
    return raw_audit_records

if __name__ == "__main__":
    run_audit_generation()
