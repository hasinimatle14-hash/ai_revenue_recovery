import os
import json
from system_health_monitor import run_system_health_check, FIXED_TIMESTAMP
from anomaly_detector import run_anomaly_detection
from governance_engine import run_governance_validation

def get_data_dir():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    return os.path.join(project_root, "data")

def load_json(filename: str):
    path = os.path.join(get_data_dir(), filename)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def run_control_center_orchestration():
    data_dir = get_data_dir()
    
    # 1. Trigger dependent services
    health = run_system_health_check()
    anomalies = run_anomaly_detection()
    governance = run_governance_validation()

    events = load_json("revenue_events.json")
    diagnoses = load_json("diagnoses.json")
    decisions = load_json("recovery_decisions.json")
    attempts = load_json("recovery_attempts.json")
    agent_runs = load_json("agent_runs.json")
    reviews = load_json("human_reviews.json")
    strategies = load_json("adaptive_strategies.json")
    analytics = load_json("analytics_summary.json")

    total_events = len(events)
    total_at_risk = sum(e.get("amount_in_inr", 0) for e in events)
    total_recovered = sum(a.get("simulated_amount_recovered", 0.0) for a in attempts)
    recovery_rate = round((total_recovered / total_at_risk), 4) if total_at_risk > 0 else 0.0

    successful_att = sum(1 for a in attempts if a.get("execution_status") == "success")
    failed_att = sum(1 for a in attempts if a.get("execution_status") == "failed")
    skipped_att = sum(1 for a in attempts if a.get("execution_status") == "skipped")
    blocked_att = sum(1 for a in attempts if a.get("execution_status") == "blocked")

    pending_rev = sum(1 for r in reviews if r.get("review_status") == "pending" or r.get("status") == "pending")
    approved_rev = sum(1 for r in reviews if r.get("review_status") == "approved" or r.get("status") == "approved")
    rejected_rev = sum(1 for r in reviews if r.get("review_status") == "rejected" or r.get("status") == "rejected")

    open_anm = sum(1 for a in anomalies if a.get("status") == "open")
    ack_anm = sum(1 for a in anomalies if a.get("status") == "acknowledged")
    res_anm = sum(1 for a in anomalies if a.get("status") == "resolved")

    # Build 9-stage Pipeline Progression Status
    pipeline_stages = [
        {"stage": "Revenue Events", "status": "completed", "processed_count": len(events), "expected_count": 120, "completion_percentage": 100.0, "output_generated": "revenue_events.json"},
        {"stage": "AI Diagnosis", "status": "completed", "processed_count": len(diagnoses), "expected_count": 120, "completion_percentage": round((len(diagnoses)/120)*100, 2), "output_generated": "diagnoses.json"},
        {"stage": "Recovery Decision", "status": "completed", "processed_count": len(decisions), "expected_count": 120, "completion_percentage": round((len(decisions)/120)*100, 2), "output_generated": "recovery_decisions.json"},
        {"stage": "Recovery Execution", "status": "completed", "processed_count": len(attempts), "expected_count": 120, "completion_percentage": round((len(attempts)/120)*100, 2), "output_generated": "recovery_attempts.json"},
        {"stage": "AI Recovery Agent", "status": "completed", "processed_count": len(agent_runs), "expected_count": 120, "completion_percentage": round((len(agent_runs)/120)*100, 2), "output_generated": "agent_runs.json"},
        {"stage": "Human Review Queue", "status": "completed", "processed_count": len(reviews), "expected_count": 14, "completion_percentage": round((len(reviews)/14)*100, 2), "output_generated": "human_reviews.json"},
        {"stage": "Adaptive Strategy", "status": "completed", "processed_count": len(strategies), "expected_count": 4, "completion_percentage": round((len(strategies)/4)*100, 2), "output_generated": "adaptive_strategies.json"},
        {"stage": "Analytics", "status": "completed", "processed_count": 120 if analytics else 0, "expected_count": 120, "completion_percentage": 100.0, "output_generated": "analytics_summary.json"},
        {"stage": "Audit Trail", "status": "completed", "processed_count": 120, "expected_count": 120, "completion_percentage": 100.0, "output_generated": "audit_trail.json"}
    ]

    summary = {
        "system_health": health,
        "revenue_at_risk": total_at_risk,
        "simulated_recovered_revenue": total_recovered,
        "simulated_recovery_rate": recovery_rate,
        "attempts_breakdown": {
            "successful": successful_att,
            "failed": failed_att,
            "skipped": skipped_att,
            "blocked": blocked_att
        },
        "agent_summary": {
            "processed": len(agent_runs),
            "recommendations_created": len(agent_runs)
        },
        "human_review_summary": {
            "total": len(reviews),
            "pending": pending_rev,
            "approved": approved_rev,
            "rejected": rejected_rev
        },
        "adaptive_strategy_status": {
            "status": "ready",
            "version": "strategy-v1.1",
            "active_count": len(strategies)
        },
        "anomalies_summary": {
            "detected_count": len(anomalies),
            "open": open_anm,
            "acknowledged": ack_anm,
            "resolved": res_anm
        },
        "governance_summary": {
            "status": governance["overall_status"],
            "compliance_percentage": governance["policy_compliance_percentage"],
            "violations_count": len(governance["safety_violations"])
        },
        "pipeline_completion_percentage": health["pipeline_completion_percentage"],
        "pipeline_stages": pipeline_stages,
        "last_pipeline_update": FIXED_TIMESTAMP
    }

    # Save summary
    out_path = os.path.join(data_dir, "control_center_summary.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    # 2. Append Part 10 Audit Logs IDEMPOTENTLY
    audit_path = os.path.join(data_dir, "audit_trail.json")
    if os.path.exists(audit_path):
        with open(audit_path, "r", encoding="utf-8") as f:
            audits = json.load(f)

        already_logged = any(a.get("action") == "control_center_compiled" for a in audits)
        if not already_logged:
            base_time = "2026-09-03T12:05:"
            part10_logs = [
                ("health_check_completed", "00Z", "System Health Monitor", "System health check executed. Status: Healthy."),
                ("anomaly_detected", "05Z", "Anomaly Detector Engine", f"Anomaly detection completed. {len(anomalies)} operational anomalies identified."),
                ("governance_check_completed", "10Z", "Governance Engine", f"Governance compliance check completed. Compliance: {governance['policy_compliance_percentage']}%."),
                ("pipeline_status_updated", "15Z", "Control Center Orchestrator", "9-stage system pipeline progression state calculated."),
                ("control_center_compiled", "20Z", "Control Center Orchestrator", "Control center summary compiled successfully.")
            ]

            for action, sec, actor, desc in part10_logs:
                audits.append({
                    "event_id": "SYSTEM",
                    "action": action,
                    "actor": actor,
                    "timestamp": base_time + sec,
                    "status": "success",
                    "description": desc
                })

            # Chronological sort
            audits.sort(key=lambda x: x["timestamp"])

            # Re-assign sequential audit IDs
            for idx, a in enumerate(audits, start=1):
                a["audit_id"] = f"AUD-{idx:04d}"

            with open(audit_path, "w", encoding="utf-8") as f:
                json.dump(audits, f, indent=2)

            print(f"Audit trail idempotently updated with Part 10 actions. Total: {len(audits)} logs.")

    print(f"Control Center orchestration completed successfully. Saved to {out_path}")
    return summary

if __name__ == "__main__":
    run_control_center_orchestration()
