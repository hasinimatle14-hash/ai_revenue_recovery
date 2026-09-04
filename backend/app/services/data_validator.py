import os
import json
from datetime import datetime

def validate_dataset():
    # Paths relative to the project structure
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    data_dir = os.path.join(project_root, "data")
    
    events_json_path = os.path.join(data_dir, "revenue_events.json")
    gt_json_path = os.path.join(data_dir, "evaluation_ground_truth.json")
    
    # 1. Check if files exist
    assert os.path.exists(events_json_path), f"File missing: {events_json_path}"
    assert os.path.exists(gt_json_path), f"File missing: {gt_json_path}"
    
    with open(events_json_path, "r") as f:
        events = json.load(f)
        
    with open(gt_json_path, "r") as f:
        ground_truth = json.load(f)
        
    # 2. Count verification
    assert len(events) == 120, f"Expected exactly 120 events, got {len(events)}"
    assert len(ground_truth) == 120, f"Expected exactly 120 ground-truth records, got {len(ground_truth)}"
    
    # 3. Ground-truth completeness mapping checks
    event_ids = [e["event_id"] for e in events]
    gt_ids = [g["event_id"] for g in ground_truth]
    
    # Verify uniqueness
    assert len(set(event_ids)) == 120, "Duplicate event IDs found in events list!"
    assert len(set(gt_ids)) == 120, "Duplicate event IDs found in ground-truth list!"
    
    # Verify exact mapping
    events_map = {e["event_id"]: e for e in events}
    gt_map = {g["event_id"]: g for g in ground_truth}
    
    for eid in event_ids:
        assert eid in gt_map, f"Event {eid} is missing matching ground truth record!"
        gt_rec = gt_map[eid]
        # Validate ground-truth fields exist
        required_gt_fields = [
            "event_id", 
            "ground_truth_root_cause", 
            "ground_truth_recommended_intervention", 
            "ground_truth_recoverability", 
            "ground_truth_expected_outcome"
        ]
        for field in required_gt_fields:
            assert field in gt_rec, f"Ground truth for {eid} is missing field: {field}"
            assert gt_rec[field] is not None, f"Ground truth field '{field}' for {eid} is null"
            
    for geid in gt_ids:
        assert geid in events_map, f"Ground-truth ID {geid} is not present in events list!"

    # 4. Ingested Events validation
    event_types = {"failed_payment": 0, "abandoned_checkout": 0, "failed_subscription": 0, "overdue_invoice": 0}
    domestic_count = 0
    cb_count = 0
    currencies_checked = set()

    country_currency_map = {
        "IN": "INR",
        "US": "USD",
        "GB": "GBP",
        "AE": "AED",
        "MY": "MYR",
        "SG": "SGD",
        "DE": "EUR"
    }

    decline_rules = {
        "failed_payment": [
            "insufficient_funds", "issuer_declined", "card_expired", "card_invalid",
            "risk_flagged", "network_error", "timeout", "authentication_failed", "currency_mismatch"
        ],
        "abandoned_checkout": [
            "customer_abandoned", "price_shock", "checkout_friction", "authentication_failed", "payment_method_unavailable"
        ],
        "failed_subscription": [
            "insufficient_funds", "card_expired", "issuer_declined", "risk_flagged", "network_error", "authentication_failed"
        ],
        "overdue_invoice": [
            "invoice_unpaid", "customer_dispute", "customer_cashflow_issue"
        ]
    }

    for event in events:
        eid = event["event_id"]
        
        # Verify base schema keys
        required_schema = [
            "event_id", "event_type", "timestamp", "customer_id", "customer_segment",
            "amount", "currency", "payment_method", "decline_reason_code", "country",
            "region", "is_cross_border", "merchant_id", "merchant_type", "previous_recovery_attempts",
            "merchant_country", "customer_timezone", "customer_language", "customer_lifetime_value",
            "customer_previous_success_rate", "customer_previous_recovery_count", "risk_signal", "amount_in_inr"
        ]
        for field in required_schema:
            assert field in event, f"Event {eid} is missing required schema field: {field}"
            
        # Unique and valid customer and merchant prefixes
        assert event["customer_id"].startswith("CUS-"), f"Invalid customer_id format for {eid}"
        assert event["merchant_id"].startswith("MER-"), f"Invalid merchant_id format for {eid}"
        
        # Segment validity
        assert event["customer_segment"] in ["retail", "SMB", "enterprise"], f"Invalid segment for {eid}"
        
        # Counts verification
        etype = event["event_type"]
        assert etype in event_types, f"Invalid event_type '{etype}' for {eid}"
        event_types[etype] += 1
        
        # Positive amounts check
        assert event["amount"] > 0, f"Amount must be positive, got {event['amount']} for {eid}"
        assert event["amount_in_inr"] > 0, f"Amount in INR must be positive for {eid}"
        
        # Timestamp ISO check
        try:
            # Check ISO format by parsing it
            dt_str = event["timestamp"]
            if dt_str.endswith("Z"):
                dt_str = dt_str[:-1]
            datetime.fromisoformat(dt_str)
        except ValueError:
            raise AssertionError(f"Invalid timestamp format '{event['timestamp']}' for {eid}")

        # Cross border logical consistency
        actual_cb = event["country"] != event["merchant_country"]
        assert event["is_cross_border"] == actual_cb, f"is_cross_border inconsistency for {eid}: expected {actual_cb}, got {event['is_cross_border']}"
        
        if event["is_cross_border"]:
            cb_count += 1
        else:
            domestic_count += 1
            
        # Plausible currency checking
        cust_country = event["country"]
        if cust_country in country_currency_map:
            assert event["currency"] == country_currency_map[cust_country], f"Currency mismatch for country {cust_country} in {eid}: expected {country_currency_map[cust_country]}, got {event['currency']}"
        currencies_checked.add(event["currency"])
        
        # Decline reason semantic checks
        decline = event["decline_reason_code"]
        assert decline in decline_rules[etype], f"Decline reason '{decline}' is semantically inconsistent with event type '{etype}' for {eid}"
        
        # Recovery attempts limit check
        assert 0 <= event["previous_recovery_attempts"] <= 4, f"Previous attempts out of range [0-4] for {eid}: {event['previous_recovery_attempts']}"
        
        # Type validations (avoiding everything as strings)
        assert isinstance(event["amount"], (int, float)), f"amount must be numeric in {eid}"
        assert isinstance(event["amount_in_inr"], (int, float)), f"amount_in_inr must be numeric in {eid}"
        assert isinstance(event["previous_recovery_attempts"], int), f"previous_recovery_attempts must be integer in {eid}"
        assert isinstance(event["is_cross_border"], bool), f"is_cross_border must be boolean in {eid}"
        assert isinstance(event["customer_lifetime_value"], (int, float)), f"customer_lifetime_value must be numeric in {eid}"
        assert isinstance(event["customer_previous_success_rate"], float), f"customer_previous_success_rate must be float in {eid}"
        assert isinstance(event["customer_previous_recovery_count"], int), f"customer_previous_recovery_count must be integer in {eid}"

        # Event-specific fields check
        if etype == "abandoned_checkout":
            assert event["checkout_session_id"] is not None, f"Missing checkout_session_id for {eid}"
            assert event["checkout_stage"] in ["payment_method_selection", "payment_details", "authentication", "review"], f"Invalid checkout_stage for {eid}"
            assert event["subscription_id"] is None, f"subscription_id should be null for checkout event {eid}"
            assert event["invoice_id"] is None, f"invoice_id should be null for checkout event {eid}"
            
        elif etype == "failed_subscription":
            assert event["subscription_id"] is not None, f"Missing subscription_id for {eid}"
            assert event["checkout_session_id"] is None, f"checkout_session_id should be null for subscription event {eid}"
            assert event["invoice_id"] is None, f"invoice_id should be null for subscription event {eid}"
            
        elif etype == "overdue_invoice":
            assert event["invoice_id"] is not None, f"Missing invoice_id for {eid}"
            assert event["days_overdue"] is not None, f"Missing days_overdue for {eid}"
            assert event["invoice_due_date"] is not None, f"Missing invoice_due_date for {eid}"
            assert event["checkout_session_id"] is None, f"checkout_session_id should be null for invoice event {eid}"
            assert event["subscription_id"] is None, f"subscription_id should be null for invoice event {eid}"
            
        else: # failed_payment
            assert event["checkout_session_id"] is None, f"checkout_session_id should be null for payment event {eid}"
            assert event["subscription_id"] is None, f"subscription_id should be null for payment event {eid}"
            assert event["invoice_id"] is None, f"invoice_id should be null for payment event {eid}"

    # Verify distributions check limits
    # failed_payment (~35), abandoned_checkout (~30), failed_subscription (~30), overdue_invoice (~25)
    assert 30 <= event_types["failed_payment"] <= 40, f"failed_payment count out of range: {event_types['failed_payment']}"
    assert 25 <= event_types["abandoned_checkout"] <= 35, f"abandoned_checkout count out of range: {event_types['abandoned_checkout']}"
    assert 25 <= event_types["failed_subscription"] <= 35, f"failed_subscription count out of range: {event_types['failed_subscription']}"
    assert 20 <= event_types["overdue_invoice"] <= 30, f"overdue_invoice count out of range: {event_types['overdue_invoice']}"
    
    # Domestic (~75), Cross-border (~45)
    assert 65 <= domestic_count <= 85, f"Domestic count out of range: {domestic_count}"
    assert 35 <= cb_count <= 55, f"Cross border count out of range: {cb_count}"
    
    # Ensure no duplicates in ground truth categories
    assert len(currencies_checked) > 1, "Only one currency was generated! Should have both INR and foreign currencies."

    print("--- VALIDATION PASSED SUCCESSFULLY ---")
    print(f"Verified {len(events)} events and matching ground-truth records.")
    print(f"Event Types: {json.dumps(event_types)}")
    print(f"Domestic Count: {domestic_count}, Cross Border Count: {cb_count}")
    print(f"Currencies generated: {sorted(list(currencies_checked))}")

if __name__ == "__main__":
    validate_dataset()
