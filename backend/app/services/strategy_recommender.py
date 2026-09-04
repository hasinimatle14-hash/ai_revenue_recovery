import os
import json
from strategy_features import get_data_dir

def load_strategies():
    path = os.path.join(get_data_dir(), "adaptive_strategies.json")
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def recommend_adaptive_strategy(event, diagnosis, decision):
    """
    Analyzes transaction context, safety rules, and historical yields to recommend
    the optimal recovery intervention.
    """
    eid = event.get("event_id")
    prev_attempts = event.get("previous_recovery_attempts", 0)
    decision_action = decision.get("decision", "").lower()
    
    # 1. Enforce Immutable Safety Guidelines
    if prev_attempts >= 3:
        return {
            "recommended_action": "stop",
            "recommended_timing": "immediate",
            "confidence": 1.0,
            "reason": "Rule A Safety Block: Attempt threshold exceeded. Additional attempts prohibited."
        }
    if decision_action == "stop":
        return {
            "recommended_action": "stop",
            "recommended_timing": "immediate",
            "confidence": 1.0,
            "reason": "Rule E Safety Block: Existing decision state is stop. Overriding is prohibited."
        }
        
    rc = diagnosis.get("root_cause", "unknown")
    geo = "cross_border" if event.get("is_cross_border", False) else "domestic"
    amt = event.get("amount_in_inr", 0.0)
    
    # Determine cohort
    if rc == "insufficient_funds":
        if geo == "cross_border":
            cohort = "insufficient_funds_cross_border"
        elif amt >= 15000:
            cohort = "insufficient_funds_domestic_high_value"
        else:
            cohort = "insufficient_funds_domestic_low_value"
    elif rc in ["expired_card", "invalid_details", "authentication_failed"]:
        cohort = "card_credentials_domestic"
    elif rc in ["bank_downtime", "network_error"]:
        cohort = "technical_infrastructure_failure"
    elif rc in ["api_timeout", "gateway_error"]:
        cohort = "gateway_connection_failure"
    elif rc in ["b2b_invoice_unpaid", "b2b_net_terms"]:
        cohort = "b2b_terms_collections"
    else:
        cohort = "general_payment_failures"
        
    # Match against compiled strategies
    strategies = load_strategies()
    matching_strat = None
    for s in strategies:
        if s["cohort"] == cohort:
            matching_strat = s
            break
            
    if matching_strat:
        return {
            "recommended_action": matching_strat["recommended_intervention"],
            "recommended_timing": matching_strat["recommended_timing"],
            "confidence": matching_strat["confidence"],
            "reason": f"Adaptive Learning recommend: {matching_strat['reasoning']}"
        }
        
    # 2. Rule-Based Fallback Defaults
    confidence = float(diagnosis.get("confidence", 0.8))
    
    if confidence < 0.6:
        return {
            "recommended_action": "manual_review",
            "recommended_timing": "immediate",
            "confidence": confidence,
            "reason": "Low confidence indicator. Routing to merchant manual review queue."
        }
        
    if rc == "insufficient_funds":
        action = "delay_and_retry"
        timing = "delay_24h"
    elif rc in ["expired_card", "invalid_details"]:
        action = "request_payment_method_update"
        timing = "delay_1h"
    elif rc in ["b2b_invoice_unpaid", "b2b_net_terms"]:
        action = "delay_and_retry"
        timing = "next_day_9am"
    elif geo == "cross_border":
        # Cross border corridor fallback timing
        action = "delay_and_retry"
        timing = "delay_4h"
    else:
        action = decision.get("selected_intervention", "proceed_with_simulation")
        timing = "immediate"
        
    return {
        "recommended_action": action,
        "recommended_timing": timing,
        "confidence": confidence,
        "reason": f"Fallback rule applied for cohort {cohort}."
    }

if __name__ == "__main__":
    test_evt = {"event_id": "EVT-9999", "previous_recovery_attempts": 0, "is_cross_border": False, "amount_in_inr": 20000}
    test_diag = {"root_cause": "insufficient_funds", "confidence": 0.9}
    test_dec = {"decision": "retry", "selected_intervention": "retry"}
    rec = recommend_adaptive_strategy(test_evt, test_diag, test_dec)
    print(f"Test Recommendation: {rec}")
