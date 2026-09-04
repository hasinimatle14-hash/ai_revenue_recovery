import os
import json

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

def extract_features():
    events = load_json("revenue_events.json")
    diagnoses = load_json("diagnoses.json")
    decisions = load_json("recovery_decisions.json")
    attempts = load_json("recovery_attempts.json")
    agent_runs = load_json("agent_runs.json")
    
    # Map index structures
    diag_map = {d["event_id"]: d for d in diagnoses}
    dec_map = {d["event_id"]: d for d in decisions}
    att_map = {a["event_id"]: a for a in attempts}
    agent_map = {r["event_id"]: r for r in agent_runs}
    
    features = []
    
    # Normalization factors based on dataset limits
    max_amount = max([e["amount_in_inr"] for e in events]) if events else 1.0
    max_clv = 100000.0 # Standard merchant max benchmark CLV
    
    for e in events:
        eid = e["event_id"]
        diag = diag_map.get(eid, {})
        dec = dec_map.get(eid, {})
        att = att_map.get(eid, {})
        agent = agent_map.get(eid, {})
        
        # Determine simulation outcome
        outcome = "no_action"
        if att:
            outcome = att.get("execution_status", "no_action")
            
        recovered_amt = att.get("simulated_amount_recovered", 0.0) if att else 0.0
        
        feat = {
            "event_id": eid,
            "root_cause": diag.get("root_cause", "unknown"),
            "selected_intervention": dec.get("selected_intervention", "none"),
            "customer_segment": e.get("customer_segment", "standard"),
            "geography": "cross_border" if e.get("is_cross_border", False) else "domestic",
            "recoverability": diag.get("recoverability", "medium"),
            "attempt_count": e.get("previous_recovery_attempts", 0),
            "amount_in_inr": e.get("amount_in_inr", 0.0),
            "customer_previous_success_rate": e.get("customer_previous_success_rate", 80),
            "customer_lifetime_value": e.get("customer_lifetime_value", 5000),
            "simulated_outcome": outcome,
            "recovered_amount": recovered_amt,
            
            # Normalized features
            "normalized_amount": round(e.get("amount_in_inr", 0.0) / max_amount, 4) if max_amount > 0 else 0.0,
            "normalized_success_rate": round(e.get("customer_previous_success_rate", 80) / 100.0, 4),
            "normalized_clv": round(e.get("customer_lifetime_value", 5000) / max_clv, 4) if max_clv > 0 else 0.0
        }
        features.append(feat)
        
    return features

if __name__ == "__main__":
    feats = extract_features()
    print(f"Extracted features for {len(feats)} events.")
