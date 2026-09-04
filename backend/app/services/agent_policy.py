from agent_tools import (
    check_attempt_limit,
    check_high_value_low_recoverability,
    check_conflicting_signals
)

def evaluate_policy_rules(context: dict) -> dict:
    """
    Evaluates safety policies on the consolidated recovery context.
    Returns:
        dict containing:
            "override_required": bool,
            "recommended_action": str or None,
            "requires_human_review": bool or None,
            "risk_level": str or None,
            "reason": str or None,
            "triggered_rules": list
    """
    event = context.get("event", {})
    diagnosis = context.get("diagnosis", {})
    decision = context.get("decision", {})
    attempt = context.get("attempt", {})
    
    triggered_rules = []
    
    # RULE E: Respect existing stop decision
    if decision.get("decision") == "stop" or attempt.get("outcome") == "skipped":
        triggered_rules.append("RULE_E_EXISTING_STOP")
        return {
            "override_required": True,
            "recommended_action": "stop",
            "requires_human_review": False,
            "risk_level": "low",
            "reason": "Automated stop decision preserved from previous recovery stages.",
            "triggered_rules": triggered_rules
        }

    # RULE A: Previous attempts >= 3
    if check_attempt_limit(event):
        triggered_rules.append("RULE_A_ATTEMPT_LIMIT")
        return {
            "override_required": True,
            "recommended_action": "stop",
            "requires_human_review": False,
            "risk_level": "high",
            "reason": "Maximum automated recovery attempts limit reached (3 attempts).",
            "triggered_rules": triggered_rules
        }
        
    # RULE C: High value (>= 1.5 Lakhs) and low recoverability
    if check_high_value_low_recoverability(event, diagnosis):
        triggered_rules.append("RULE_C_HIGH_VALUE_LOW_REC")
        return {
            "override_required": True,
            "recommended_action": "manual_review",
            "requires_human_review": True,
            "risk_level": "critical",
            "reason": f"High value transaction (INR {event.get('amount_in_inr'):,.2f}) with low recoverability.",
            "triggered_rules": triggered_rules
        }

    # RULE B: Low recoverability and previous attempts >= 1
    attempts = event.get("previous_recovery_attempts", 0)
    rec = diagnosis.get("recoverability", "").lower()
    if rec == "low" and attempts >= 1:
        triggered_rules.append("RULE_B_LOW_REC_PAST_ATTEMPT")
        return {
            "override_required": True,
            "recommended_action": "manual_review",
            "requires_human_review": True,
            "risk_level": "high",
            "reason": "Low recoverability transaction with past recovery attempts.",
            "triggered_rules": triggered_rules
        }
        
    # RULE D: Conflicting Signals
    if check_conflicting_signals(event, diagnosis, decision):
        triggered_rules.append("RULE_D_CONFLICTING_SIGNALS")
        return {
            "override_required": True,
            "recommended_action": "manual_review",
            "requires_human_review": True,
            "risk_level": "high",
            "reason": "Conflicting recovery signals detected across diagnosis and history.",
            "triggered_rules": triggered_rules
        }
        
    return {
        "override_required": False,
        "recommended_action": None,
        "requires_human_review": None,
        "risk_level": None,
        "reason": None,
        "triggered_rules": []
    }
