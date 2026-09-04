import os
import json
import random
from typing import Dict, Any

def run_recovery_simulation():
    # Paths relative to the script structure
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    data_dir = os.path.join(project_root, "data")
    
    events_json_path = os.path.join(data_dir, "revenue_events.json")
    diagnoses_json_path = os.path.join(data_dir, "diagnoses.json")
    decisions_json_path = os.path.join(data_dir, "recovery_decisions.json")
    
    attempts_output_path = os.path.join(data_dir, "recovery_attempts.json")
    summary_output_path = os.path.join(data_dir, "recovery_execution_summary.json")
    
    # 2. Load input datasets
    assert os.path.exists(events_json_path), f"Input events missing at: {events_json_path}"
    assert os.path.exists(diagnoses_json_path), f"Diagnoses missing at: {diagnoses_json_path}"
    assert os.path.exists(decisions_json_path), f"Decisions missing at: {decisions_json_path}"
    
    with open(events_json_path, "r") as f:
        events = json.load(f)
    with open(diagnoses_json_path, "r") as f:
        diagnoses = json.load(f)
    with open(decisions_json_path, "r") as f:
        decisions = json.load(f)
        
    assert len(events) == 120
    assert len(diagnoses) == 120
    assert len(decisions) == 120

    # Index by event_id for lookup
    events_map = {e["event_id"]: e for e in events}
    diagnoses_map = {d["event_id"]: d for d in diagnoses}
    
    attempts_list = []
    
    # Summary Counters
    successful_recoveries = 0
    failed_attempts = 0
    skipped_events = 0
    blocked_events = 0
    simulated_revenue_recovered = 0.0
    total_revenue_at_risk = 0.0
    
    # Deterministic simulation RNG
    rng = random.Random(42)
    executed_at_timestamp = "2026-08-29T22:00:00Z"

    # 3. Simulate attempts
    for idx, dec in enumerate(decisions, start=1):
        event_id = dec["event_id"]
        event = events_map[event_id]
        diagnosis = diagnoses_map[event_id]
        
        decision_val = dec["decision"]
        intervention = dec["selected_intervention"]
        amount = event["amount"]
        amount_in_inr = event["amount_in_inr"]
        total_revenue_at_risk += amount_in_inr
        
        # Initialize default attempt values
        outcome = "skipped"
        exec_status = "skipped"
        sim_recovered = 0.0
        failure_reason = None
        exec_reason = ""
        
        if decision_val == "stop" or intervention == "stop":
            outcome = "skipped"
            exec_status = "skipped"
            sim_recovered = 0.0
            failure_reason = "Recovery decision explicitly stopped automated intervention."
            exec_reason = "Automated recovery bypassed under stopping rule guidelines."
            skipped_events += 1
            
        elif intervention in ["human_collections_review", "manual_review"]:
            outcome = "blocked"
            exec_status = "blocked"
            sim_recovered = 0.0
            failure_reason = "Requires manual review."
            exec_reason = "Execution blocked pending human agent audit checklist validation."
            blocked_events += 1
            
        else: # decision == "recover"
            # Calculate dynamic success probability
            base_p = event.get("customer_previous_success_rate", 0.5)
            
            # Adjust by recoverability
            rec = diagnosis.get("recoverability", "medium")
            if rec == "high":
                base_p += 0.15
            elif rec == "low":
                base_p -= 0.30
                
            # Adjust by attempts count
            attempts_count = event.get("previous_recovery_attempts", 0)
            if attempts_count == 0:
                base_p += 0.05
            elif attempts_count == 1:
                base_p -= 0.05
            elif attempts_count == 2:
                base_p -= 0.15
            else:
                base_p -= 0.40
                
            # Adjust by cross-border status
            if event.get("is_cross_border", False):
                base_p -= 0.10
                
            # Adjust by intervention type
            if intervention in ["delayed_retry", "technical_retry"]:
                base_p += 0.10
            elif intervention in ["payment_method_update", "alternative_payment_method"]:
                base_p += 0.05
            elif intervention == "friction_reducing_nudge":
                base_p += 0.00
            elif intervention == "invoice_reminder":
                base_p -= 0.05
            elif intervention == "payment_plan_offer":
                base_p -= 0.10
                
            # Clamp probability between 0.05 and 0.95
            p = max(0.05, min(0.95, base_p))
            
            # Roll deterministic outcome
            roll = rng.random()
            if roll < p:
                outcome = "success"
                exec_status = "completed"
                sim_recovered = amount # Recover local currency amount (satisfies <= event amount)
                exec_reason = "Simulated transaction settled successfully via recovery channel."
                successful_recoveries += 1
                simulated_revenue_recovered += amount_in_inr
            else:
                outcome = "failed"
                exec_status = "completed"
                sim_recovered = 0.0
                failure_reason = f"Simulated retry failed due to root cause: {diagnosis.get('root_cause')}"
                exec_reason = "Simulated recovery transaction was declined by target gateway/client."
                failed_attempts += 1
                
        attempt_record = {
            "attempt_id": f"ATT-{idx:04d}",
            "event_id": event_id,
            "decision_id": dec["decision_id"],
            "diagnosis_id": dec["diagnosis_id"],
            "intervention": intervention,
            "execution_status": exec_status,
            "outcome": outcome,
            "simulated_amount_recovered": sim_recovered,
            "failure_reason": failure_reason,
            "execution_reason": exec_reason,
            "executed_at": executed_at_timestamp
        }
        attempts_list.append(attempt_record)
        
    # Write attempts JSON
    with open(attempts_output_path, "w") as f:
        json.dump(attempts_list, f, indent=2)
        
    # 4. Calculate Rate Summaries
    eligible_attempts_count = successful_recoveries + failed_attempts
    
    recovery_rate = 0.0
    if eligible_attempts_count > 0:
        recovery_rate = round(successful_recoveries / eligible_attempts_count, 4)
        
    overall_recovery_rate = round(successful_recoveries / len(decisions), 4)
    
    recovery_val_pct = 0.0
    if total_revenue_at_risk > 0:
        recovery_val_pct = round(simulated_revenue_recovered / total_revenue_at_risk, 4)
        
    summary_results = {
        "total_events": len(decisions),
        "attempts_created": len(decisions),
        "successful_recoveries": successful_recoveries,
        "failed_attempts": failed_attempts,
        "skipped_events": skipped_events,
        "blocked_events": blocked_events,
        "simulated_revenue_recovered": round(simulated_revenue_recovered, 2),
        "total_revenue_at_risk": round(total_revenue_at_risk, 2),
        "recovery_rate": recovery_rate,
        "overall_event_recovery_rate": overall_recovery_rate,
        "recovery_value_percentage": recovery_val_pct
    }
    
    # Write summary JSON
    with open(summary_output_path, "w") as f:
        json.dump(summary_results, f, indent=2)
        
    print(f"Simulator generated: {len(attempts_list)} attempts.")
    print(f"Summary recovered revenue: INR {summary_results['simulated_revenue_recovered']}")
    
    return attempts_list, summary_results

if __name__ == "__main__":
    run_recovery_simulation()
