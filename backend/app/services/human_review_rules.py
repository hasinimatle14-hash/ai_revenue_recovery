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

def validate_reviewer_action(event_id: str, decision: str) -> dict:
    """
    Validates a human reviewer decision against safety guidelines.
    Returns:
        dict: {
            "is_safe": bool,
            "reason": str or None,
            "final_action": str
        }
    """
    if decision not in ["approve", "reject"]:
        return {
            "is_safe": False,
            "reason": f"Invalid human decision category: '{decision}'. Must be 'approve' or 'reject'.",
            "final_action": "no_action"
        }
        
    events = load_json("revenue_events.json")
    decisions = load_json("recovery_decisions.json")
    diagnoses = load_json("diagnoses.json")
    
    event = next((e for e in events if e["event_id"] == event_id), None)
    rec_decision = next((d for d in decisions if d["event_id"] == event_id), None)
    diagnosis = next((d for d in diagnoses if d["event_id"] == event_id), None)
    
    if not event or not rec_decision or not diagnosis:
        return {
            "is_safe": False,
            "reason": f"Context databases missing for event ID: '{event_id}'",
            "final_action": "no_action"
        }
        
    prev_attempts = event.get("previous_recovery_attempts", 0)
    existing_stop = rec_decision.get("decision", "").lower() == "stop"
    
    # Rule A Check
    if prev_attempts >= 3 and decision == "approve":
        return {
            "is_safe": False,
            "reason": f"Rule A Triggered: Transaction has {prev_attempts} previous attempts. Overriding retry simulation is prohibited.",
            "final_action": "stop"
        }
        
    # Rule E Check
    if existing_stop and decision == "approve":
        return {
            "is_safe": False,
            "reason": "Rule E Triggered: Preserved stop status from recovery decisions stage. Approval is blocked.",
            "final_action": "stop"
        }
        
    # Rejections resolve to stop
    if decision == "reject":
        return {
            "is_safe": True,
            "reason": None,
            "final_action": "stop"
        }
        
    # Approvals map to simulation intervention actions
    intervention = rec_decision.get("selected_intervention", "")
    final_action = "proceed_with_simulation"
    if intervention in ["delayed_retry", "payment_plan_offer"]:
        final_action = "delay_and_retry"
    elif intervention in ["payment_method_update", "alternative_payment_method"]:
        final_action = "request_payment_method_update"
    elif intervention in ["stop"]:
        final_action = "stop"
        
    return {
        "is_safe": True,
        "reason": None,
        "final_action": final_action
    }
