import os
import json
from datetime import datetime
from agent_tools import build_agent_context, calculate_agent_priority
from agent_policy import evaluate_policy_rules

def run_agent_analysis(event_id: str) -> dict:
    """
    Analyzes a failed transaction event and determines recovery recommendation.
    """
    
    context = build_agent_context(event_id)
    if not context:
        return {}
        
    event = context["event"]
    diagnosis = context["diagnosis"]
    decision = context["decision"]
    attempt = context["attempt"]
    
    # 1. Policy layer check
    policy_res = evaluate_policy_rules(context)
    
    # 2. Risk classification
    amount = event.get("amount_in_inr", 0.0)
    clv = event.get("customer_lifetime_value", 0.0)
    prev_attempts = event.get("previous_recovery_attempts", 0)
    rec = diagnosis.get("recoverability", "medium").lower()
    
    if policy_res["override_required"] and policy_res["risk_level"]:
        risk_level = policy_res["risk_level"]
    else:
        # Determine risk based on amount, CLV, and past attempts
        if amount >= 150000.0 or clv >= 100000.0:
            risk_level = "critical" if prev_attempts >= 2 else "high"
        elif amount >= 50000.0 or prev_attempts >= 2:
            risk_level = "high"
        elif amount >= 10000.0 or rec == "low":
            risk_level = "medium"
        else:
            risk_level = "low"
            
    # 3. Agent Confidence score calculation
    diag_conf = diagnosis.get("confidence", 0.80)
    history_success = event.get("customer_previous_success_rate", 80.0) / 100.0
    
    base_conf = (diag_conf * 0.7) + (history_success * 0.3)
    if prev_attempts > 0:
        base_conf -= (0.08 * prev_attempts)
    if event.get("is_cross_border", False):
        base_conf -= 0.05
    if rec == "low":
        base_conf -= 0.10
        
    confidence = max(0.15, min(1.0, base_conf))
    confidence = round(confidence, 2)
    
    # 4. Map Action Recommendation
    if policy_res["override_required"]:
        recommended_action = policy_res["recommended_action"]
        requires_human_review = policy_res["requires_human_review"]
        reasoning = (
            f"Safety override triggered: {policy_res['reason']} "
            f"The AI orchestrator blocks automated execution."
        )
    else:
        # Map intervention to allowed action vocabulary
        intervention = decision.get("selected_intervention", "")
        requires_human_review = False
        
        if intervention in ["technical_retry"]:
            recommended_action = "proceed_with_simulation"
        elif intervention in ["delayed_retry", "payment_plan_offer"]:
            recommended_action = "delay_and_retry"
        elif intervention in ["payment_method_update", "alternative_payment_method"]:
            recommended_action = "request_payment_method_update"
        elif intervention in ["invoice_reminder", "friction_reducing_nudge"]:
            recommended_action = "proceed_with_simulation"
        elif intervention in ["stop"]:
            recommended_action = "stop"
        elif intervention in ["manual_review", "human_collections_review"]:
            recommended_action = "manual_review"
            requires_human_review = True
        else:
            recommended_action = "no_action"
            
        # Formulate detail contextual reasoning
        rec_words = rec if rec else "medium"
        success_rate = event.get("customer_previous_success_rate", 50)
        p_attempts = event.get("previous_recovery_attempts", 0)
        cause_words = diagnosis.get("root_cause", "unknown").replace("_", " ")
        
        reasoning = (
            f"The transaction has a strong historical success rate of {success_rate}%, "
            f"{p_attempts} previous recovery attempts, and a {rec_words} recoverability. "
            f"The AI diagnosis identifies '{cause_words}' and recommends '{intervention.replace('_', ' ')}'. "
            f"No safety policy rules block automated recovery, so the agent recommends proceeding with '{recommended_action}' simulation."
        )
        
    # Calculate Action Priority
    action_priority = calculate_agent_priority(event)
    
    # Next state transition resolution
    if requires_human_review:
        next_state = "human_review_required"
    elif recommended_action == "stop":
        next_state = "stopped"
    else:
        next_state = "automated_simulation"
        
    return {
        "agent_run_id": "", # populated by orchestrator
        "event_id": event_id,
        "diagnosis_id": diagnosis.get("diagnosis_id", "DGN-unknown"),
        "decision_id": decision.get("decision_id", "DEC-unknown"),
        "attempt_id": attempt.get("attempt_id", "ATT-unknown"),
        "recommended_action": recommended_action,
        "risk_level": risk_level,
        "confidence": confidence,
        "action_priority": action_priority,
        "requires_human_review": requires_human_review,
        "human_review_reason": policy_res["reason"] if (requires_human_review and policy_res["override_required"]) else ("Manual recovery review requested by decision engine." if requires_human_review else None),
        "reasoning": reasoning,
        "next_state": next_state,
        "policy_checks": {
            "override_required": policy_res["override_required"],
            "triggered_rules": policy_res["triggered_rules"],
            "reason": policy_res["reason"]
        },
        "execution_mode": "simulation",
        "created_at": datetime.now().isoformat() + "Z"
    }
