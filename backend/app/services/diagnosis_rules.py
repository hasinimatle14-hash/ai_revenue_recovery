import os
from typing import Dict, Any, Tuple

# Allowed Taxonomies
ROOT_CAUSE_TAXONOMY = [
    "insufficient_funds",
    "expired_or_invalid_payment_method",
    "issuer_risk_flag",
    "checkout_friction",
    "technical_failure",
    "genuine_non_payment_intent",
    "currency_fx_issue",
    "cross_border_issuer_risk",
    "payment_method_mismatch",
    "timezone_timing_issue",
    "compliance_review_required"
]

INTERVENTION_TAXONOMY = [
    "delayed_retry",
    "payment_method_update",
    "alternative_payment_method",
    "technical_retry",
    "friction_reducing_nudge",
    "invoice_reminder",
    "payment_plan_offer",
    "human_collections_review",
    "manual_review"
]

def evaluate_event_diagnosis(event: Dict[str, Any]) -> Tuple[str, float, str, str, str]:
    """
    Evaluates a single revenue event by assigning evidence support scores to 
    various root causes based on multiple available signals.
    
    Returns:
        Tuple[str, float, str, str, str]: (root_cause, confidence, reasoning, recommended_intervention, recoverability)
    """
    event_type = event.get("event_type")
    decline_code = event.get("decline_reason_code")
    pm = event.get("payment_method")
    attempts = event.get("previous_recovery_attempts", 0)
    success_rate = event.get("customer_previous_success_rate", 0.5)
    prev_recovery_count = event.get("customer_previous_recovery_count", 0)
    is_cross_border = event.get("is_cross_border", False)
    cust_segment = event.get("customer_segment", "retail")
    days_overdue = event.get("days_overdue")
    currency = event.get("currency", "INR")
    country = event.get("country", "IN")
    timezone = event.get("customer_timezone", "Asia/Kolkata")
    
    # Initialize support scores for all candidate root causes
    scores: Dict[str, float] = {cause: 0.0 for cause in ROOT_CAUSE_TAXONOMY}
    
    # 1. Decline code primary signals (base weights)
    if decline_code == "insufficient_funds":
        scores["insufficient_funds"] += 0.8
    elif decline_code == "customer_cashflow_issue":
        scores["insufficient_funds"] += 0.7
    elif decline_code in ["card_expired", "card_invalid"]:
        scores["expired_or_invalid_payment_method"] += 0.85
    elif decline_code == "risk_flagged":
        if is_cross_border:
            scores["cross_border_issuer_risk"] += 0.7
            scores["issuer_risk_flag"] += 0.4
        else:
            scores["issuer_risk_flag"] += 0.8
    elif decline_code in ["checkout_friction", "customer_abandoned"]:
        if event_type == "abandoned_checkout":
            scores["checkout_friction"] += 0.6
            scores["genuine_non_payment_intent"] += 0.5
        else:
            scores["genuine_non_payment_intent"] += 0.7
    elif decline_code == "price_shock":
        scores["genuine_non_payment_intent"] += 0.6
    elif decline_code == "payment_method_unavailable":
        if is_cross_border:
            scores["payment_method_mismatch"] += 0.75
        else:
            scores["checkout_friction"] += 0.7
    elif decline_code in ["network_error", "timeout", "authentication_failed"]:
        scores["technical_failure"] += 0.8
    elif decline_code == "currency_mismatch":
        scores["currency_fx_issue"] += 0.8
    elif decline_code == "fx_rate_expired":
        scores["currency_fx_issue"] += 0.7
    elif decline_code == "invoice_unpaid":
        scores["genuine_non_payment_intent"] += 0.65
    elif decline_code == "customer_dispute":
        scores["genuine_non_payment_intent"] += 0.8
        
    # 2. Historical signals adjustment
    # High success rate supports transient failures and decreases non-payment intent
    if success_rate >= 0.80:
        scores["insufficient_funds"] += 0.15
        scores["technical_failure"] += 0.15
        scores["currency_fx_issue"] += 0.1
        scores["genuine_non_payment_intent"] -= 0.25
    # Low success rate supports non-payment intent and chronic balance issues
    elif success_rate < 0.50:
        scores["genuine_non_payment_intent"] += 0.25
        scores["insufficient_funds"] += 0.1
        scores["technical_failure"] -= 0.15

    # 3. Execution attempts context
    # High previous attempts strongly indicate Refusal / Genuine Non-Payment Intent
    if attempts >= 3:
        scores["genuine_non_payment_intent"] += 0.3
        scores["insufficient_funds"] -= 0.1  # Less likely to be transient
        
    # 4. Overdue invoice context
    if event_type == "overdue_invoice" and days_overdue is not None:
        if days_overdue > 45:
            scores["genuine_non_payment_intent"] += 0.25
        if decline_code == "invoice_unpaid" and success_rate >= 0.85:
            # High success rate merchant but unpaid invoice suggests administrative friction
            scores["checkout_friction"] += 0.2
            
    # 5. Cross-border specific rules (applied ONLY if is_cross_border is true)
    if is_cross_border:
        # Cross border cards or local payment mismatches
        if pm == "upi":
            # UPI is domestic to India, cannot be easily settled for cross-border
            scores["payment_method_mismatch"] += 0.5
        elif pm == "international_card":
            # International card declines are often flagged as risk or currency issue
            if decline_code == "risk_flagged":
                scores["cross_border_issuer_risk"] += 0.2
            elif decline_code == "issuer_declined":
                scores["cross_border_issuer_risk"] += 0.3
                scores["currency_fx_issue"] += 0.15
                
        # Large Timezone mismatch check (timezone is US, UK, DE indicating late night batch runs)
        if "America" in timezone or "London" in timezone or "Berlin" in timezone:
            scores["timezone_timing_issue"] += 0.25
            
        # Large transaction amount in foreign corridor suggests compliance review
        if event.get("amount_in_inr", 0) > 100000 and decline_code == "risk_flagged":
            scores["compliance_review_required"] += 0.4
    else:
        # Zero out cross-border causes for domestic events to guarantee strict logic
        for cb_cause in ["currency_fx_issue", "cross_border_issuer_risk", "payment_method_mismatch", "timezone_timing_issue", "compliance_review_required"]:
            scores[cb_cause] = -1.0

    # 6. Resolve winning root cause
    # Filter out negative scores and find maximum
    winning_cause = max(scores, key=scores.get)
    max_score = scores[winning_cause]

    # 7. Confidence score calculation
    # Base confidence derived from support score
    base_confidence = min(0.98, max(0.45, max_score))
    
    # Assess ambiguity: check if runner up is very close
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    runner_cause, runner_score = sorted_scores[1]
    
    confidence = base_confidence
    # If the difference is narrow, indicate ambiguity by lowering confidence
    if max_score > 0 and (max_score - runner_score) < 0.15:
        confidence -= 0.12
        
    # Subtract slightly for repeated failed attempts (indicates higher uncertainty in recovery)
    if attempts > 0:
        confidence -= 0.03 * attempts
        
    # Ensure confidence stays within range [0.45 - 0.98]
    confidence = round(max(0.45, min(0.98, confidence)), 2)

    # 8. Recommend Intervention
    recommended_intervention = "manual_review"
    
    if winning_cause == "insufficient_funds":
        recommended_intervention = "payment_plan_offer" if event_type == "overdue_invoice" else "delayed_retry"
    elif winning_cause == "expired_or_invalid_payment_method":
        recommended_intervention = "payment_method_update"
    elif winning_cause in ["issuer_risk_flag", "cross_border_issuer_risk"]:
        recommended_intervention = "alternative_payment_method"
    elif winning_cause == "checkout_friction":
        recommended_intervention = "friction_reducing_nudge"
    elif winning_cause == "technical_failure":
        recommended_intervention = "technical_retry"
    elif winning_cause == "genuine_non_payment_intent":
        if event_type == "overdue_invoice" and (days_overdue and days_overdue > 30):
            recommended_intervention = "human_collections_review"
        elif decline_code == "price_shock":
            recommended_intervention = "payment_plan_offer"
        else:
            recommended_intervention = "invoice_reminder"
    elif winning_cause == "currency_fx_issue":
        recommended_intervention = "alternative_payment_method"
    elif winning_cause == "payment_method_mismatch":
        recommended_intervention = "payment_method_update"
    elif winning_cause == "timezone_timing_issue":
        recommended_intervention = "delayed_retry"
    elif winning_cause == "compliance_review_required":
        recommended_intervention = "manual_review"

    # 9. Recoverability Assessment
    # High previous success rate and low attempts suggest High recoverability
    # Low history, high attempts, or genuine non-payment intent suggest Low recoverability
    if attempts >= 3 or winning_cause == "genuine_non_payment_intent":
        recoverability = "low"
    elif success_rate >= 0.80 and attempts <= 1:
        recoverability = "high"
    else:
        recoverability = "medium"

    # 10. Generate Event-Specific reasoning
    reasoning = ""
    # Map country codes to text names for readability
    countries_names = {"IN": "India", "US": "United States", "GB": "United Kingdom", "AE": "UAE", "MY": "Malaysia", "SG": "Singapore", "DE": "Germany"}
    cname = countries_names.get(country, country)

    if winning_cause == "insufficient_funds":
        reasoning = (
            f"The transaction failed with an '{decline_code}' error. Since the customer ({cust_segment}) has a strong history of "
            f"payment success ({int(success_rate * 100)}%) and only {attempts} previous recovery attempts, this is diagnosed "
            f"as a transient insufficient funds issue. A delayed retry is recommended during standard billing hours."
        )
    elif winning_cause == "expired_or_invalid_payment_method":
        reasoning = (
            f"The payment channel '{pm}' declined due to '{decline_code}'. This indicates the card details on file are "
            f"expired or incorrect. Since this affects recurring billing for segment '{cust_segment}', we recommend prompting "
            f"the customer to update their billing credentials."
        )
    elif winning_cause == "issuer_risk_flag":
        reasoning = (
            f"The domestic payment failed due to '{decline_code}' from the card issuer. The customer has a success rate of "
            f"{int(success_rate * 100)}%, indicating a low-risk profile historically. Recommending alternative payment method selection."
        )
    elif winning_cause == "cross_border_issuer_risk":
        reasoning = (
            f"The cross-border transaction failed with '{decline_code}' from an international issuer. The customer is based in "
            f"{cname} (billing currency: {currency}). This denotes cross-border issuer friction. Requesting alternative payment method."
        )
    elif winning_cause == "checkout_friction":
        reasoning = (
            f"The customer abandoned the checkout during the '{event.get('checkout_stage')}' stage due to '{decline_code}'. "
            f"This suggests friction in the payment flow. A soft nudge or offering alternative checkouts should reduce abandonment."
        )
    elif winning_cause == "technical_failure":
        reasoning = (
            f"The transaction was interrupted by a network or authentication '{decline_code}'. The customer's strong payment "
            f"history ({int(success_rate * 100)}%) confirms transaction intent, indicating a transient gateway drop. Recommending technical retry."
        )
    elif winning_cause == "genuine_non_payment_intent":
        if event_type == "overdue_invoice":
            reasoning = (
                f"The invoice has remained unpaid for {days_overdue} days with decline code '{decline_code}'. With previous "
                f"recovery attempts ({attempts}) yielding no response, this is diagnosed as genuine non-payment intent, requiring collections escalation."
            )
        else:
            reasoning = (
                f"The customer abandoned the payment flow with '{decline_code}'. Due to repeated attempts ({attempts}) and a "
                f"moderate history success rate ({int(success_rate * 100)}%), this points to a genuine lack of transaction intent."
            )
    elif winning_cause == "currency_fx_issue":
        reasoning = (
            f"The international payment was rejected with '{decline_code}' in {cname}. This represents currency settlement or "
            f"forex conversion friction (billed in {currency}). Recommend offering local currency settlement."
        )
    elif winning_cause == "payment_method_mismatch":
        reasoning = (
            f"A payment method conflict occurred. The customer from {cname} attempted payment with '{pm}' which is unavailable "
            f"internationally. Recommend updating checkout details to suggest international cards."
        )
    elif winning_cause == "timezone_timing_issue":
        reasoning = (
            f"The transaction failed late at night in customer's local timezone ({timezone}) with decline code '{decline_code}'. "
            f"This indicates a timing-related card limit trigger. Recommend scheduling retry for customer's business hours."
        )
    elif winning_cause == "compliance_review_required":
        reasoning = (
            f"A high-value cross-border transaction of {currency} {event.get('amount')} (equivalent to ₹{event.get('amount_in_inr')}) "
            f"was flagged by the gateway as '{decline_code}'. This triggers manual compliance audit guidelines."
        )
    else:
        reasoning = f"The failure was diagnosed as {winning_cause} based on decline code '{decline_code}' and customer segment '{cust_segment}' history."

    return winning_cause, confidence, reasoning, recommended_intervention, recoverability
