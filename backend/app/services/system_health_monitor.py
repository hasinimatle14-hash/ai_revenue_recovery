import os
import json

FIXED_TIMESTAMP = "2026-09-03T12:00:00Z"

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

def run_system_health_check():
    events = load_json("revenue_events.json")
    diagnoses = load_json("diagnoses.json")
    decisions = load_json("recovery_decisions.json")
    attempts = load_json("recovery_attempts.json")
    agent_runs = load_json("agent_runs.json")
    reviews = load_json("human_reviews.json")
    strategies = load_json("adaptive_strategies.json")
    audits = load_json("audit_trail.json")
    analytics = load_json("analytics_summary.json")

    total_events = len(events)
    diag_count = len(diagnoses)
    dec_count = len(decisions)
    att_count = len(attempts)
    agent_count = len(agent_runs)
    
    diag_comp = round((diag_count / total_events) * 100.0, 2) if total_events > 0 else 0.0
    dec_comp = round((dec_count / total_events) * 100.0, 2) if total_events > 0 else 0.0
    att_comp = round((att_count / total_events) * 100.0, 2) if total_events > 0 else 0.0
    agent_comp = round((agent_count / total_events) * 100.0, 2) if total_events > 0 else 0.0

    # Calculate overall pipeline completion across all 9 stages
    stage_completions = [100.0, diag_comp, dec_comp, att_comp, agent_comp, 100.0, 100.0, 100.0, 100.0]
    pipeline_completion_pct = round(sum(stage_completions) / len(stage_completions), 2)

    pending_reviews = sum(1 for r in reviews if r.get("review_status") == "pending" or r.get("status") == "pending")
    active_strat = sum(1 for s in strategies if s.get("status") == "active")

    # Determine health state deterministically
    health_status = "healthy"
    warnings = []

    if pending_reviews > 10:
        warnings.append(f"Elevated pending human review queue: {pending_reviews} cases pending.")
    if pipeline_completion_pct < 100.0:
        health_status = "warning"
        warnings.append(f"Pipeline processing incomplete ({pipeline_completion_pct}%).")

    health_report = {
        "status": health_status,
        "pipeline_completion_percentage": pipeline_completion_pct,
        "total_events": total_events,
        "diagnosis_completion": diag_comp,
        "decision_completion": dec_comp,
        "execution_completion": att_comp,
        "agent_processing_status": "completed" if agent_comp == 100.0 else "in_progress",
        "pending_human_reviews": pending_reviews,
        "active_strategies": active_strat,
        "audit_record_count": len(audits),
        "warnings": warnings,
        "service_statuses": {
            "revenue_events": "healthy",
            "ai_diagnosis": "healthy" if diag_comp == 100.0 else "warning",
            "recovery_decision": "healthy" if dec_comp == 100.0 else "warning",
            "recovery_execution": "healthy" if att_comp == 100.0 else "warning",
            "recovery_agent": "healthy" if agent_comp == 100.0 else "warning",
            "human_review": "healthy",
            "adaptive_strategy": "healthy" if active_strat > 0 else "warning",
            "analytics": "healthy" if analytics else "warning",
            "audit_trail": "healthy" if len(audits) > 0 else "warning"
        },
        "last_health_check": FIXED_TIMESTAMP
    }

    return health_report

if __name__ == "__main__":
    report = run_system_health_check()
    print(f"System Health Check Status: {report['status']} (Pipeline: {report['pipeline_completion_percentage']}%)")
