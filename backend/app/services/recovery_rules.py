import os
from typing import Dict, Any

# Allowed Interventions
INTERVENTION_TAXONOMY = [
    "delayed_retry",
    "payment_method_update",
    "alternative_payment_method",
    "technical_retry",
    "friction_reducing_nudge",
    "invoice_reminder",
    "payment_plan_offer",
    "human_collections_review",
    "manual_review",
    "stop"
]

# Allowed Timings
TIMING_VALUES = [
    "immediate",
    "1_hour",
    "6_hours",
    "24_hours",
    "48_hours",
    "3_days"
]

def determine_recovery_decision(event: Dict[str, Any], diagnosis: Dict[str, Any]) -> Dict[str, Any]:
    """
    Takes a revenue event and its corresponding AI diagnosis to decide 
    recovery eligibility, select an intervention, determine timing, 
    calculate priority, and plan the next state.
    """
    event_id = event.get("event_id")
    diagnosis_id = diagnosis.get("diagnosis_id")
    root_cause = diagnosis.get("root_cause")
    recoverability = diagnosis.get("recoverability", "medium")
    confidence = diagnosis.get("confidence", 0.5)
    
    attempts = event.get("previous_recovery_attempts", 0)
    event_type = event.get("event_type")
    decline_code = event.get("decline_reason_code")
    amount_in_inr = event.get("amount_in_inr", 0.0)
    clv = event.get("customer_lifetime_value", 0)
    success_rate = event.get("customer_previous_success_rate", 0.5)
    is_cross_border = event.get("is_cross_border", False)
    days_overdue = event.get("days_overdue")
    
    # Defaults
    eligible = True
    eligibility_reason = "Customer has a recoverable transaction pattern with valid historical signals."
    decision = "recover" # recover, stop, review
    intervention = "delayed_retry"
    timing = "6_hours"
    current_state = "diagnosed"
    next_state = "intervention_planned"
    decision_reasoning = ""

    # Apply Stopping Rules
    # Rule A — Maximum attempts threshold
    if attempts >= 3:
        eligible = False
        decision = "stop"
        eligibility_reason = "Maximum automated recovery attempts reached."
        decision_reasoning = f"Automated recovery has been stopped because this event has reached {attempts} attempts, which is the system threshold for automated recovery."
        intervention = "stop"
        timing = "immediate"
        next_state = "stopped"
        
    # Rule B — Low recoverability combined with existing attempt
    elif recoverability == "low" and attempts >= 1:
        eligible = False
        decision = "stop"
        eligibility_reason = "Low recoverability profile and has at least one previous attempt."
        decision_reasoning = "This transaction has a low recoverability forecast based on historical success profiles, and has already failed one retry. Automated recovery stopped."
        intervention = "stop"
        timing = "immediate"
        next_state = "stopped"
        
    # Rule C — Expired payment method repeat limits
    elif root_cause == "expired_or_invalid_payment_method" and attempts >= 2:
        eligible = False
        decision = "stop"
        eligibility_reason = "Payment credentials remain expired after multiple update prompts."
        decision_reasoning = "Automated recovery has been stopped. The merchant has sent 2 update notifications, but credentials remain expired."
        intervention = "stop"
        timing = "immediate"
        next_state = "stopped"
        
    # Rule E — Genuine non-payment intent limits
    elif root_cause == "genuine_non_payment_intent" and attempts >= 2:
        eligible = False
        decision = "stop"
        eligibility_reason = "Genuine non-payment intent confirmed via repeated failures."
        decision_reasoning = "Customer has shown active non-payment intent or dispute across multiple contacts. Stopping automated notifications to avoid customer friction."
        intervention = "stop"
        timing = "immediate"
        next_state = "stopped"

    # Rule F — Manual Review Escalations
    elif root_cause in ["compliance_review_required", "currency_fx_issue"] or (event_type == "overdue_invoice" and days_overdue and days_overdue > 45):
        decision = "review"
        eligible = False
        eligibility_reason = "Requires administrative compliance review or collections escalation."
        next_state = "manual_review"
        timing = "48_hours"
        if root_cause == "compliance_review_required":
            intervention = "manual_review"
            decision_reasoning = f"High value international transaction (₹{amount_in_inr}) was flagged as high-risk, triggering manual compliance compliance review."
        elif root_cause == "currency_fx_issue":
            intervention = "alternative_payment_method"
            decision_reasoning = "Cross-border currency settlement error flagged. Transferring to manual review to offer local payment routing."
        else: # Overdue invoice > 45 days
            intervention = "human_collections_review"
            decision_reasoning = f"B2B Invoice is heavily overdue ({days_overdue} days). Transferring to human collections desk."

    # General Recoverable Cases
    else:
        current_state = "recovery_eligible"
        decision = "recover"
        
        # Determine Intervention and Timing based on Root Cause
        if root_cause == "insufficient_funds":
            if event_type == "overdue_invoice":
                intervention = "payment_plan_offer"
                timing = "24_hours"
                decision_reasoning = f"B2B Invoice overdue due to customer balance issues. Recommending a payment plan nudge in 24 hours."
            else:
                intervention = "delayed_retry"
                timing = "6_hours"
                decision_reasoning = "Payment declined due to balance. The customer has a stable historical success rate, indicating a delayed retry in 6 hours is optimal."
                
        elif root_cause == "expired_or_invalid_payment_method":
            intervention = "payment_method_update"
            timing = "immediate"
            decision_reasoning = "Card credentials expired. Triggering an immediate email and SMS nudge to update billing details."
            
        elif root_cause in ["issuer_risk_flag", "cross_border_issuer_risk"]:
            intervention = "alternative_payment_method"
            timing = "6_hours"
            decision_reasoning = f"Issuer declined card transaction as risk-flagged in {event.get('country')}. Directing user to select an alternative payment method."
            
        elif root_cause == "checkout_friction":
            intervention = "friction_reducing_nudge"
            timing = "1_hour"
            decision_reasoning = f"User abandoned checkout at '{event.get('checkout_stage')}' stage due to friction. Sending a checkout reminder link in 1 hour."
            
        elif root_cause == "technical_failure":
            intervention = "technical_retry"
            timing = "1_hour"
            decision_reasoning = f"Transient gateway '{decline_code}' error occurred. Scheduling a technical retry in 1 hour."
            
        elif root_cause == "genuine_non_payment_intent":
            intervention = "invoice_reminder"
            timing = "24_hours"
            decision_reasoning = "Overdue account balance. Scheduling standard invoice reminder invoice notification in 24 hours."
            
        elif root_cause == "payment_method_mismatch":
            intervention = "payment_method_update"
            timing = "immediate"
            decision_reasoning = "Cross-border payment method conflict (domestic payment method used). Prompting user to add international cards immediately."
            
        elif root_cause == "timezone_timing_issue":
            intervention = "delayed_retry"
            timing = "6_hours"
            decision_reasoning = "Transaction declined during late local hours. Retrying in 6 hours to align with standard international banking hours."
            
        else:
            intervention = "delayed_retry"
            timing = "24_hours"
            decision_reasoning = "General recovery scheduled based on transaction category."

    # Priority Score Calculation (logarithmic scale representation, bounded between 0.1 and 0.98)
    # Higher value transaction + Higher CLV + Better recoverability = Higher priority
    amount_factor = min(0.35, amount_in_inr / 250000.0)
    clv_factor = min(0.25, clv / 1500000.0)
    
    rec_weight = 0.30
    if recoverability == "high":
        rec_factor = 1.0
    elif recoverability == "medium":
        rec_factor = 0.6
    else:
        rec_factor = 0.2
    rec_contribution = rec_factor * rec_weight
    
    conf_contribution = 0.08 * confidence
    
    # Penalize repeated failures
    penalty = 0.05 * attempts
    
    priority_score = amount_factor + clv_factor + rec_contribution + conf_contribution - penalty
    priority_score = round(max(0.1, min(0.98, priority_score)), 2)

    return {
        "decision_id": "", # Added by engine
        "event_id": event_id,
        "diagnosis_id": diagnosis_id,
        "decision": decision,
        "eligible_for_recovery": eligible,
        "eligibility_reason": eligibility_reason,
        "selected_intervention": intervention,
        "timing": timing,
        "priority_score": priority_score,
        "decision_reasoning": decision_reasoning,
        "current_state": current_state,
        "next_state": next_state,
        "execution_status": "planned" # Prepares architecture for later execution
    }
