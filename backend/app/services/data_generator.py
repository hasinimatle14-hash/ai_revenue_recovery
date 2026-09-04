import os
import json
import csv
import random
from datetime import datetime, timedelta

def generate_synthetic_data(seed=42):
    # Set deterministic random seed
    rng = random.Random(seed)
    
    # Ensure directories exist
    # Determine the directory path relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    data_dir = os.path.join(project_root, "data")
    os.makedirs(data_dir, exist_ok=True)

    # 1. PRE-GENERATE CUSTOMER POOL (50 customers)
    # This allows repeat customers to exist in the dataset to simulate customer history.
    customer_pool = []
    
    countries_data = {
        "IN": {
            "name": "India",
            "currency": "INR",
            "regions": ["Telangana", "Karnataka", "Maharashtra", "Tamil Nadu", "Delhi", "Gujarat"],
            "timezone": "Asia/Kolkata",
            "language": "en-IN",
            "methods": ["upi", "card", "netbanking", "wallet", "bank_transfer"]
        },
        "US": {
            "name": "United States",
            "currency": "USD",
            "regions": ["California", "Texas", "New York"],
            "timezone": "America/New_York",
            "language": "en-US",
            "methods": ["international_card", "bank_transfer"]
        },
        "GB": {
            "name": "United Kingdom",
            "currency": "GBP",
            "regions": ["England", "Scotland"],
            "timezone": "Europe/London",
            "language": "en-GB",
            "methods": ["international_card", "bank_transfer"]
        },
        "AE": {
            "name": "United Arab Emirates",
            "currency": "AED",
            "regions": ["Dubai", "Abu Dhabi"],
            "timezone": "Asia/Dubai",
            "language": "en-AE",
            "methods": ["international_card"]
        },
        "MY": {
            "name": "Malaysia",
            "currency": "MYR",
            "regions": ["Kuala Lumpur", "Selangor"],
            "timezone": "Asia/Kuala_Lumpur",
            "language": "en-MY",
            "methods": ["international_card"]
        },
        "SG": {
            "name": "Singapore",
            "currency": "SGD",
            "regions": ["Central Region"],
            "timezone": "Asia/Singapore",
            "language": "en-SG",
            "methods": ["international_card"]
        },
        "DE": {
            "name": "Germany",
            "currency": "EUR",
            "regions": ["Bavaria", "Berlin", "Hamburg"],
            "timezone": "Europe/Berlin",
            "language": "de-DE",
            "methods": ["international_card", "bank_transfer"]
        }
    }

    # Generate customer configurations
    for i in range(1, 61):
        cust_id = f"CUS-{i:04d}"
        
        # Segment distribution: retail (60%), SMB (30%), enterprise (10%)
        rand_val = rng.random()
        if rand_val < 0.60:
            segment = "retail"
            clv = rng.randint(2000, 35000)
        elif rand_val < 0.90:
            segment = "SMB"
            clv = rng.randint(40000, 250000)
        else:
            segment = "enterprise"
            clv = rng.randint(300000, 2500000)
            
        # Geographic assignment (approx 65% domestic customers, 35% international)
        is_domestic = rng.random() < 0.65
        country_code = "IN" if is_domestic else rng.choice([c for c in countries_data.keys() if c != "IN"])
        country_info = countries_data[country_code]
        
        region = rng.choice(country_info["regions"])
        
        # Success rates & history profiles
        hist_type = rng.choice(["high_reliability", "medium_recovery", "low_history"])
        if hist_type == "high_reliability":
            prev_success = round(rng.uniform(0.85, 0.98), 2)
            prev_recoveries = rng.randint(1, 4)
        elif hist_type == "medium_recovery":
            prev_success = round(rng.uniform(0.55, 0.84), 2)
            prev_recoveries = rng.randint(2, 6)
        else:
            prev_success = round(rng.uniform(0.20, 0.54), 2)
            prev_recoveries = 0

        customer_pool.append({
            "customer_id": cust_id,
            "customer_segment": segment,
            "country": country_code,
            "region": region,
            "customer_timezone": country_info["timezone"],
            "customer_language": country_info["language"],
            "customer_lifetime_value": clv,
            "customer_previous_success_rate": prev_success,
            "customer_previous_recovery_count": prev_recoveries,
            "methods_pool": country_info["methods"],
            "currency_code": country_info["currency"]
        })

    # 2. PRE-GENERATE MERCHANTS POOL (10 merchants)
    merchants_pool = [
        {"merchant_id": "MER-001", "merchant_type": "ecommerce", "merchant_country": "IN"},
        {"merchant_id": "MER-002", "merchant_type": "SaaS", "merchant_country": "IN"},
        {"merchant_id": "MER-003", "merchant_type": "marketplace", "merchant_country": "IN"},
        {"merchant_id": "MER-004", "merchant_type": "education", "merchant_country": "IN"},
        {"merchant_id": "MER-005", "merchant_type": "travel", "merchant_country": "IN"},
        {"merchant_id": "MER-006", "merchant_type": "professional_services", "merchant_country": "IN"},
        {"merchant_id": "MER-007", "merchant_type": "SaaS", "merchant_country": "IN"},
        {"merchant_id": "MER-008", "merchant_type": "ecommerce", "merchant_country": "IN"},
        {"merchant_id": "MER-009", "merchant_type": "marketplace", "merchant_country": "IN"},
        {"merchant_id": "MER-010", "merchant_type": "education", "merchant_country": "IN"},
    ]

    # Currency exchange rates to INR (approximations for amount_in_inr logic)
    exchange_rates = {
        "INR": 1.0,
        "USD": 83.5,
        "EUR": 90.2,
        "GBP": 106.1,
        "AED": 22.7,
        "SGD": 61.8,
        "MYR": 17.6
    }

    # 3. CONSTRUCT 120 SLOTS
    # Total sizes: failed_payment=35, abandoned_checkout=30, failed_subscription=30, overdue_invoice=25
    slots = (
        ["failed_payment"] * 35 +
        ["abandoned_checkout"] * 30 +
        ["failed_subscription"] * 30 +
        ["overdue_invoice"] * 25
    )
    rng.shuffle(slots) # Shuffle slots deterministically

    # Cross border allocation flag (75 domestic, 45 cross border)
    # We create a list of boolean flags representing whether each slot is cross border
    cb_flags = [False] * 75 + [True] * 45
    rng.shuffle(cb_flags)

    events_list = []
    ground_truth_list = []
    
    base_time = datetime(2026, 8, 20, 10, 0, 0)

    # 4. GENERATION LOOP (EVT-0001 to EVT-0120)
    for idx, (event_type, is_cross_border) in enumerate(zip(slots, cb_flags), start=1):
        event_id = f"EVT-{idx:04d}"
        
        # Filter customer pool based on domestic vs cross border requirement
        if is_cross_border:
            eligible_customers = [c for c in customer_pool if c["country"] != "IN"]
        else:
            eligible_customers = [c for c in customer_pool if c["country"] == "IN"]
            
        customer = rng.choice(eligible_customers)
        merchant = rng.choice(merchants_pool)
        
        # Plausible previous recovery attempts
        previous_attempts = rng.choices([0, 1, 2, 3, 4], weights=[0.45, 0.30, 0.15, 0.08, 0.02])[0]
        
        # Calculate amount depending on customer segment and event type
        currency = customer["currency_code"]
        rate = exchange_rates[currency]
        
        if customer["customer_segment"] == "retail":
            amount_inr = rng.choice([799, 1249, 2499, 3999, 5800, 7500, 9999])
        elif customer["customer_segment"] == "SMB":
            amount_inr = rng.choice([8500, 12450, 18750, 24900, 35000, 42500])
        else: # enterprise
            if event_type == "overdue_invoice":
                amount_inr = rng.choice([125000, 185000, 250000, 380000, 450000])
            else:
                amount_inr = rng.choice([45000, 75000, 115000, 150000, 220000])

        # Convert to local currency (not rounded, except to 2 decimals)
        amount = round(amount_inr / rate, 2)
        # Recalculate amount_in_inr for data consistency
        amount_in_inr = round(amount * rate, 2)

        # Timestamps spread over the last 5 days
        time_offset = rng.uniform(0.1, 4.8)
        event_time = base_time + timedelta(days=time_offset)
        timestamp = event_time.isoformat() + "Z"
        
        # Ingestion specifics
        payment_method = rng.choice(customer["methods_pool"])
        attempted_payment_method = payment_method
        original_payment_method = payment_method
        
        # Fields for specific event types
        checkout_session_id = None
        checkout_stage = None
        subscription_id = None
        invoice_id = None
        invoice_due_date = None
        days_overdue = None
        
        # Generate decline reason codes and setup ground truth elements
        decline_reason_code = ""
        gt_root_cause = ""
        gt_intervention = ""
        gt_recoverability = ""
        gt_expected_outcome = ""
        risk_signal = "low"

        if event_type == "failed_payment":
            decline_reason_code = rng.choices(
                ["insufficient_funds", "issuer_declined", "card_expired", "card_invalid", "risk_flagged", "network_error", "timeout", "authentication_failed", "currency_mismatch"],
                weights=[0.30, 0.20, 0.10, 0.05, 0.10, 0.08, 0.07, 0.07, 0.03]
            )[0]
            
        elif event_type == "abandoned_checkout":
            checkout_session_id = f"sess_{rng.randint(100000, 999999)}"
            checkout_stage = rng.choice(["payment_method_selection", "payment_details", "authentication", "review"])
            decline_reason_code = rng.choice(["customer_abandoned", "price_shock", "checkout_friction", "authentication_failed", "payment_method_unavailable"])
            
        elif event_type == "failed_subscription":
            subscription_id = f"sub_{rng.randint(100000, 999999)}"
            decline_reason_code = rng.choices(
                ["insufficient_funds", "card_expired", "issuer_declined", "risk_flagged", "network_error", "authentication_failed"],
                weights=[0.35, 0.25, 0.15, 0.10, 0.08, 0.07]
            )[0]
            
        elif event_type == "overdue_invoice":
            invoice_id = f"inv_{rng.randint(100000, 999999)}"
            days_overdue = rng.choice([5, 12, 18, 27, 35, 50, 75])
            due_date_time = event_time - timedelta(days=days_overdue)
            invoice_due_date = due_date_time.strftime("%Y-%m-%d")
            decline_reason_code = rng.choice(["invoice_unpaid", "customer_dispute", "customer_cashflow_issue"])

        # Determine Ground-Truth logically
        # 1. Define Root Cause Category
        if decline_reason_code in ["insufficient_funds", "customer_cashflow_issue"]:
            gt_root_cause = "insufficient_funds"
            gt_intervention = "delayed_retry" if event_type != "overdue_invoice" else "payment_plan_offer"
            gt_recoverability = "medium"
            gt_expected_outcome = "recoverable"
            
        elif decline_reason_code in ["card_expired", "card_invalid"]:
            gt_root_cause = "expired_or_invalid_payment_method"
            gt_intervention = "payment_method_update"
            gt_recoverability = "high"
            gt_expected_outcome = "recoverable"
            
        elif decline_reason_code == "risk_flagged":
            risk_signal = "high"
            if is_cross_border:
                gt_root_cause = "cross_border_issuer_risk"
                gt_intervention = "bank_authorization_prompt"
                gt_recoverability = "medium"
                gt_expected_outcome = "recoverable"
            else:
                gt_root_cause = "issuer_risk_flag"
                gt_intervention = "bank_authorization_prompt"
                gt_recoverability = "medium"
                gt_expected_outcome = "requires_human_review"
                
        elif decline_reason_code in ["checkout_friction", "payment_method_unavailable"]:
            if is_cross_border and decline_reason_code == "payment_method_unavailable":
                gt_root_cause = "payment_method_mismatch"
                gt_intervention = "payment_method_update"
                gt_recoverability = "medium"
                gt_expected_outcome = "recoverable"
            else:
                gt_root_cause = "checkout_friction"
                gt_intervention = "friction_reducing_nudge"
                gt_recoverability = "high"
                gt_expected_outcome = "recoverable"
                
        elif decline_reason_code in ["network_error", "timeout", "authentication_failed"]:
            gt_root_cause = "technical_failure"
            gt_intervention = "technical_retry"
            gt_recoverability = "high"
            gt_expected_outcome = "recoverable"
            
        elif decline_reason_code in ["customer_abandoned", "price_shock"]:
            gt_root_cause = "genuine_non_payment_intent"
            gt_intervention = "payment_plan_offer" if decline_reason_code == "price_shock" else "friction_reducing_nudge"
            gt_recoverability = "low"
            gt_expected_outcome = "unlikely_to_recover"
            
        elif decline_reason_code == "currency_mismatch":
            gt_root_cause = "currency_fx_issue"
            gt_intervention = "manual_review"
            gt_recoverability = "medium"
            gt_expected_outcome = "recoverable"
            
        elif decline_reason_code == "invoice_unpaid":
            gt_root_cause = "genuine_non_payment_intent"
            gt_intervention = "invoice_reminder"
            gt_recoverability = "high"
            gt_expected_outcome = "recoverable"
            
        elif decline_reason_code == "customer_dispute":
            gt_root_cause = "genuine_non_payment_intent"
            gt_intervention = "human_collections_review"
            gt_recoverability = "low"
            gt_expected_outcome = "requires_human_review"
            
        else:
            gt_root_cause = "technical_failure"
            gt_intervention = "manual_review"
            gt_recoverability = "medium"
            gt_expected_outcome = "requires_human_review"

        # Apply specific overrides for extreme attempts
        if previous_attempts >= 3:
            gt_recoverability = "low"
            if gt_expected_outcome == "recoverable":
                gt_expected_outcome = "requires_human_review"

        # Construct customer-facing event dict
        event = {
            "event_id": event_id,
            "event_type": event_type,
            "timestamp": timestamp,
            "customer_id": customer["customer_id"],
            "customer_segment": customer["customer_segment"],
            "amount": amount,
            "currency": currency,
            "payment_method": payment_method,
            "decline_reason_code": decline_reason_code,
            "country": customer["country"],
            "region": customer["region"],
            "is_cross_border": is_cross_border,
            "merchant_id": merchant["merchant_id"],
            "merchant_type": merchant["merchant_type"],
            "previous_recovery_attempts": previous_attempts,
            # Additional useful fields
            "merchant_country": merchant["merchant_country"],
            "customer_timezone": customer["customer_timezone"],
            "customer_language": customer["customer_language"],
            "checkout_session_id": checkout_session_id,
            "subscription_id": subscription_id,
            "invoice_id": invoice_id,
            "invoice_due_date": invoice_due_date,
            "days_overdue": days_overdue,
            "attempted_payment_method": attempted_payment_method,
            "original_payment_method": original_payment_method,
            "customer_lifetime_value": customer["customer_lifetime_value"],
            "customer_previous_success_rate": customer["customer_previous_success_rate"],
            "customer_previous_recovery_count": customer["customer_previous_recovery_count"],
            "risk_signal": risk_signal,
            "checkout_stage": checkout_stage,
            "amount_in_inr": amount_in_inr
        }
        
        # Construct ground truth dict
        gt = {
            "event_id": event_id,
            "ground_truth_root_cause": gt_root_cause,
            "ground_truth_recommended_intervention": gt_intervention,
            "ground_truth_recoverability": gt_recoverability,
            "ground_truth_expected_outcome": gt_expected_outcome
        }
        
        events_list.append(event)
        ground_truth_list.append(gt)

    # 5. WRITE JSON FILES
    events_json_path = os.path.join(data_dir, "revenue_events.json")
    with open(events_json_path, "w") as f:
        json.dump(events_list, f, indent=2)
        
    gt_json_path = os.path.join(data_dir, "evaluation_ground_truth.json")
    with open(gt_json_path, "w") as f:
        json.dump(ground_truth_list, f, indent=2)

    # 6. WRITE CSV FILE (flat format)
    csv_path = os.path.join(data_dir, "revenue_events.csv")
    if events_list:
        headers = list(events_list[0].keys())
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            for row in events_list:
                writer.writerow(row)

    print(f"Generated {len(events_list)} events successfully.")
    print(f"Saved dataset to {events_json_path}")
    print(f"Saved ground truth to {gt_json_path}")
    print(f"Saved CSV visualization to {csv_path}")
    
    return events_list, ground_truth_list

if __name__ == "__main__":
    generate_synthetic_data()
