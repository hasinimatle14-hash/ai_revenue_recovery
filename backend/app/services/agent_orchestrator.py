import os
import json
from datetime import datetime, timedelta
from recovery_agent import run_agent_analysis

def add_time(ts_str: str, seconds: int = 0) -> str:
    if ts_str.endswith("Z"):
        ts_str = ts_str[:-1]
    dt = datetime.fromisoformat(ts_str)
    dt = dt + timedelta(seconds=seconds)
    return dt.isoformat() + "Z"

def run_orchestration():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    data_dir = os.path.join(project_root, "data")
    
    events_path = os.path.join(data_dir, "revenue_events.json")
    audit_path = os.path.join(data_dir, "audit_trail.json")
    agent_runs_path = os.path.join(data_dir, "agent_runs.json")
    with open(events_path, "r", encoding="utf-8") as f:
        events = json.load(f)
        
    agent_runs = []
    
    # Process all 120 events
    for idx, event in enumerate(events, start=1):
        event_id = event["event_id"]
        run_res = run_agent_analysis(event_id)
        
        # Override run ID and timestamp for 100% determinism
        run_res["agent_run_id"] = f"AGT-{idx:04d}"
        run_res["created_at"] = "2026-08-30T22:00:00Z"
        
        agent_runs.append(run_res)
        
    # Save agent runs
    with open(agent_runs_path, "w", encoding="utf-8") as f:
        json.dump(agent_runs, f, indent=2)
        
    print(f"Orchestration completed: 120 agent runs written to {agent_runs_path}")
    
    # Extend Audit Trail with Agent Logs
    # Read existing audits
    with open(audit_path, "r", encoding="utf-8") as f:
        existing_audits = json.load(f)
        
    # We will remove any previous agent audits to prevent duplicate accumulations during multiple runs
    operational_actions = ["event_detected", "diagnosis_generated", "decision_created", "execution_simulated"]
    clean_audits = [a for a in existing_audits if a["action"] in operational_actions]
    
    extended_audits = list(clean_audits)
    
    runs_map = {r["event_id"]: r for r in agent_runs}
    
    for event in events:
        eid = event["event_id"]
        run = runs_map.get(eid)
        if not run:
            continue
            
        base_ts = event["timestamp"]
        
        # 1. agent_context_collected at T + 6s
        extended_audits.append({
            "event_id": eid,
            "action": "agent_context_collected",
            "actor": "AI Recovery Agent",
            "timestamp": add_time(base_ts, seconds=6),
            "status": "success",
            "description": "AI Agent gathered complete transaction, CLV, customer success history, and diagnostics parameters."
        })
        
        # 2. agent_diagnosis_reviewed at T + 7s
        extended_audits.append({
            "event_id": eid,
            "action": "agent_diagnosis_reviewed",
            "actor": "AI Recovery Agent",
            "timestamp": add_time(base_ts, seconds=7),
            "status": "success",
            "description": f"AI Agent reviewed diagnosis core. Root cause: '{run['requires_human_review'] if run['requires_human_review'] else 'automated'}' pipeline paths active."
        })
        
        # 3. agent_policy_checked at T + 8s
        override_txt = "required" if run["policy_checks"]["override_required"] else "clear"
        extended_audits.append({
            "event_id": eid,
            "action": "agent_policy_checked",
            "actor": "AI Recovery Agent",
            "timestamp": add_time(base_ts, seconds=8),
            "status": "success",
            "description": f"Safety policy rules inspected. Override checks: {override_txt}. Policy overrides triggered: {run['policy_checks']['triggered_rules']}."
        })
        
        # 4. agent_action_recommended at T + 9s
        extended_audits.append({
            "event_id": eid,
            "action": "agent_action_recommended",
            "actor": "AI Recovery Agent",
            "timestamp": add_time(base_ts, seconds=9),
            "status": "success",
            "description": f"AI Agent recommended recovery action: '{run['recommended_action'].replace('_', ' ')}' with confidence {int(run['confidence']*100)}%."
        })
        
        # 5. Optional agent_human_review_required at T + 10s
        if run["requires_human_review"]:
            extended_audits.append({
                "event_id": eid,
                "action": "agent_human_review_required",
                "actor": "AI Recovery Agent",
                "timestamp": add_time(base_ts, seconds=10),
                "status": "success",
                "description": f"Escalating recovery run to manual approval queue. Reason: {run['human_review_reason']}"
            })
            
    # Sort all audits chronologically
    extended_audits.sort(key=lambda x: x["timestamp"])
    
    # Re-assign sequential audit IDs starting from AUD-0001
    for idx, record in enumerate(extended_audits, start=1):
        record["audit_id"] = f"AUD-{idx:04d}"
        
    # Write back to audit_trail.json
    with open(audit_path, "w", encoding="utf-8") as f:
        json.dump(extended_audits, f, indent=2)
        
    print(f"Extended audit trail written: {len(extended_audits)} total logs saved to {audit_path}")
    return agent_runs

if __name__ == "__main__":
    run_orchestration()
