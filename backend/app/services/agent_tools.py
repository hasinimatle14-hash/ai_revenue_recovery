import os
import json

def get_data_dir():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    return os.path.join(project_root, "data")

def load_json_file(filename: str):
    path = os.path.join(get_data_dir(), filename)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def get_event_context(event_id: str):
    events = load_json_file("revenue_events.json")
    for e in events:
        if e["event_id"] == event_id:
            return e
    return None

def get_diagnosis(event_id: str):
    diagnoses = load_json_file("diagnoses.json")
    for d in diagnoses:
        if d["event_id"] == event_id:
            return d
    return None

def get_recovery_decision(event_id: str):
    decisions = load_json_file("recovery_decisions.json")
    for dec in decisions:
        if dec["event_id"] == event_id:
            return dec
    return None

def get_simulation_attempt(event_id: str):
    attempts = load_json_file("recovery_attempts.json")
    for att in attempts:
        if att["event_id"] == event_id:
            return att
    return None

def calculate_agent_priority(event_context: dict) -> float:
    # Blend amount, priority score, and customer success rate
    amount_score = min(event_context.get("amount_in_inr", 0) / 100000.0, 1.0)
    history_score = 1.0 - (event_context.get("customer_previous_success_rate", 50) / 100.0)
    blend = (amount_score * 0.4) + (history_score * 0.6)
    return round(max(0.0, min(1.0, blend)), 2)

def check_attempt_limit(event: dict) -> bool:
    return event.get("previous_recovery_attempts", 0) >= 3

def check_high_value_low_recoverability(event: dict, diagnosis: dict) -> bool:
    amt = event.get("amount_in_inr", 0.0)
    rec = diagnosis.get("recoverability", "").lower()
    return amt >= 150000.0 and rec == "low"

def check_conflicting_signals(event: dict, diagnosis: dict, decision: dict) -> bool:
    conf = diagnosis.get("confidence", 0.0)
    rec = diagnosis.get("recoverability", "").lower()
    history_success = event.get("customer_previous_success_rate", 0.0)
    prev_attempts = event.get("previous_recovery_attempts", 0)
    
    # Conflict: High confidence diagnosis but low recoverability
    if conf >= 0.85 and rec == "low":
        return True
    # Conflict: Strong customer history but repeated failures
    if history_success >= 80.0 and prev_attempts >= 2:
        return True
    # Conflict: Eligible for recovery but diagnosed as genuine non payment intent
    if decision.get("eligible_for_recovery", False) and diagnosis.get("root_cause") == "genuine_non_payment_intent":
        return True
    return False

def build_agent_context(event_id: str) -> dict:
    event = get_event_context(event_id)
    if not event:
        return {}
        
    diagnosis = get_diagnosis(event_id) or {}
    decision = get_recovery_decision(event_id) or {}
    attempt = get_simulation_attempt(event_id) or {}
    
    return {
        "event": event,
        "diagnosis": diagnosis,
        "decision": decision,
        "attempt": attempt
    }
