import os
import json
from datetime import datetime

def run_analytics_calculation():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    data_dir = os.path.join(project_root, "data")
    
    events_path = os.path.join(data_dir, "revenue_events.json")
    diagnoses_path = os.path.join(data_dir, "diagnoses.json")
    decisions_path = os.path.join(data_dir, "recovery_decisions.json")
    attempts_path = os.path.join(data_dir, "recovery_attempts.json")
    output_path = os.path.join(data_dir, "analytics_summary.json")
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
    
    # Global metrics
    total_events = len(events)
    total_revenue_at_risk = 0.0
    eligible_events = 0
    successful_recoveries = 0
    failed_recoveries = 0
    blocked_events = 0
    stopped_events = 0
    simulated_revenue_recovered = 0.0
    
    # Category mappings for breakdowns
    by_event_type = {}
    by_root_cause = {}
    by_intervention = {}
    by_customer_segment = {}
    by_geography = {
        "domestic": {"event_count": 0, "revenue_at_risk": 0.0, "successful_recoveries": 0, "failed_recoveries": 0, "recovered_value": 0.0, "recovery_rate": 0.0},
        "cross-border": {"event_count": 0, "revenue_at_risk": 0.0, "successful_recoveries": 0, "failed_recoveries": 0, "recovered_value": 0.0, "recovery_rate": 0.0}
    }
    
    for eid in events_map:
        event = events_map[eid]
        diagnosis = diagnoses_map[eid]
        decision = decisions_map[eid]
        attempt = attempts_map[eid]
        
        # Ingest general properties
        amount_in_inr = event["amount_in_inr"]
        total_revenue_at_risk += amount_in_inr
        
        is_eligible = decision["eligible_for_recovery"]
        if is_eligible:
            eligible_events += 1
            
        outcome = attempt["outcome"]
        recovered_amt_inr = amount_in_inr if outcome == "success" else 0.0
        
        if outcome == "success":
            successful_recoveries += 1
            simulated_revenue_recovered += amount_in_inr
        elif outcome == "failed":
            failed_recoveries += 1
        elif outcome == "blocked":
            blocked_events += 1
        elif outcome == "skipped":
            stopped_events += 1
            
        # 1. Event Type Breakdown Ingestion
        etype = event["event_type"]
        if etype not in by_event_type:
            by_event_type[etype] = {"total_events": 0, "revenue_at_risk": 0.0, "successful_recoveries": 0, "failed_recoveries": 0, "simulated_revenue_recovered": 0.0, "recovery_rate": 0.0}
        
        by_event_type[etype]["total_events"] += 1
        by_event_type[etype]["revenue_at_risk"] += amount_in_inr
        if outcome == "success":
            by_event_type[etype]["successful_recoveries"] += 1
            by_event_type[etype]["simulated_revenue_recovered"] += amount_in_inr
        elif outcome == "failed":
            by_event_type[etype]["failed_recoveries"] += 1
            
        # 2. Root Cause Breakdown Ingestion
        rc = diagnosis["root_cause"]
        if rc not in by_root_cause:
            by_root_cause[rc] = {"root_cause_count": 0, "revenue_at_risk": 0.0, "successful_recoveries": 0, "simulated_revenue_recovered": 0.0}
            
        by_root_cause[rc]["root_cause_count"] += 1
        by_root_cause[rc]["revenue_at_risk"] += amount_in_inr
        if outcome == "success":
            by_root_cause[rc]["successful_recoveries"] += 1
            by_root_cause[rc]["simulated_revenue_recovered"] += amount_in_inr
            
        # 3. Intervention Breakdown Ingestion
        intv = decision["selected_intervention"]
        if intv not in by_intervention:
            by_intervention[intv] = {"intervention_count": 0, "success_count": 0, "failure_count": 0, "success_rate": 0.0, "simulated_recovered_value": 0.0}
            
        by_intervention[intv]["intervention_count"] += 1
        if outcome == "success":
            by_intervention[intv]["success_count"] += 1
            by_intervention[intv]["simulated_recovered_value"] += amount_in_inr
        elif outcome == "failed":
            by_intervention[intv]["failure_count"] += 1
            
        # 4. Customer Segment Breakdown Ingestion
        segment = event["customer_segment"]
        if segment not in by_customer_segment:
            by_customer_segment[segment] = {"event_count": 0, "revenue_at_risk": 0.0, "successful_recoveries": 0, "failed_recoveries": 0, "recovery_rate": 0.0}
            
        by_customer_segment[segment]["event_count"] += 1
        by_customer_segment[segment]["revenue_at_risk"] += amount_in_inr
        if outcome == "success":
            by_customer_segment[segment]["successful_recoveries"] += 1
        elif outcome == "failed":
            by_customer_segment[segment]["failed_recoveries"] += 1
            
        # 5. Geography Breakdown Ingestion
        geo = "cross-border" if event["is_cross_border"] else "domestic"
        by_geography[geo]["event_count"] += 1
        by_geography[geo]["revenue_at_risk"] += amount_in_inr
        if outcome == "success":
            by_geography[geo]["successful_recoveries"] += 1
            by_geography[geo]["recovered_value"] += amount_in_inr
        elif outcome == "failed":
            by_geography[geo]["failed_recoveries"] += 1
            
    # Calculate recovery rate ratios
    eligible_retries = successful_recoveries + failed_recoveries
    global_recovery_rate = round(successful_recoveries / eligible_retries, 4) if eligible_retries > 0 else 0.0
    overall_recovery_rate = round(successful_recoveries / total_events, 4)
    global_recovery_val_pct = round(simulated_revenue_recovered / total_revenue_at_risk, 4)
    
    # Calculate breakdown ratios
    for etype in by_event_type:
        d = by_event_type[etype]
        denom = d["successful_recoveries"] + d["failed_recoveries"]
        d["recovery_rate"] = round(d["successful_recoveries"] / denom, 4) if denom > 0 else 0.0
        d["revenue_at_risk"] = round(d["revenue_at_risk"], 2)
        d["simulated_revenue_recovered"] = round(d["simulated_revenue_recovered"], 2)
        
    for rc in by_root_cause:
        d = by_root_cause[rc]
        d["revenue_at_risk"] = round(d["revenue_at_risk"], 2)
        d["simulated_revenue_recovered"] = round(d["simulated_revenue_recovered"], 2)
        
    for intv in by_intervention:
        d = by_intervention[intv]
        denom = d["success_count"] + d["failure_count"]
        d["success_rate"] = round(d["success_count"] / denom, 4) if denom > 0 else 0.0
        d["simulated_recovered_value"] = round(d["simulated_recovered_value"], 2)
        
    for segment in by_customer_segment:
        d = by_customer_segment[segment]
        denom = d["successful_recoveries"] + d["failed_recoveries"]
        d["recovery_rate"] = round(d["successful_recoveries"] / denom, 4) if denom > 0 else 0.0
        d["revenue_at_risk"] = round(d["revenue_at_risk"], 2)
        
    for geo in by_geography:
        d = by_geography[geo]
        denom = d["successful_recoveries"] + d["failed_recoveries"]
        d["recovery_rate"] = round(d["successful_recoveries"] / denom, 4) if denom > 0 else 0.0
        d["revenue_at_risk"] = round(d["revenue_at_risk"], 2)
        d["recovered_value"] = round(d["recovered_value"], 2)
        
    analytics_summary = {
        "generated_at": "2026-08-30T22:00:00Z",
        "total_events": total_events,
        "total_revenue_at_risk": round(total_revenue_at_risk, 2),
        "eligible_events": eligible_events,
        "successful_recoveries": successful_recoveries,
        "failed_recoveries": failed_recoveries,
        "blocked_events": blocked_events,
        "stopped_events": stopped_events,
        "simulated_revenue_recovered": round(simulated_revenue_recovered, 2),
        "recovery_rate": global_recovery_rate,
        "overall_event_recovery_rate": overall_recovery_rate,
        "recovery_value_percentage": global_recovery_val_pct,
        "by_event_type": by_event_type,
        "by_root_cause": by_root_cause,
        "by_intervention": by_intervention,
        "by_customer_segment": by_customer_segment,
        "by_geography": by_geography
    }
    
    # Write summary
    with open(output_path, "w") as f:
        json.dump(analytics_summary, f, indent=2)
        
    print(f"Analytics summary calculated successfully. Saved to {output_path}")
    return analytics_summary

if __name__ == "__main__":
    run_analytics_calculation()
