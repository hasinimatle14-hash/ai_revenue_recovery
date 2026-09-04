# Synthetic Revenue-at-Risk Data Layer

This folder houses the canonical synthetic datasets for the **AI Revenue Recovery Agent**, compiled for the Razorpay AI Buildathon 2026. All transaction events, customer histories, and recovery parameters generated here are completely synthetic and derived deterministically.

---

## 1. Dataset Purpose
The purpose of this dataset is to provide a rich, consistent, and realistic set of transaction failure profiles for the AI Revenue Recovery Agent. It serves as the baseline data foundation that future modules (AI Diagnosis, Intervention Routing, and State Machine Execution) will consume and execute recovery actions upon.

## 2. Dataset Metrics
* **Total Volume:** 120 events (`EVT-0001` through `EVT-0120`)
* **Ground-Truth Records:** 120 matching records (`EVT-0001` through `EVT-0120`)

## 3. Event Type Distribution
The dataset contains a realistic distribution across the four required billing failure types:
1. **failed_payment:** 35 events (One-time payment gateway failures)
2. **abandoned_checkout:** 30 events (Friction or price abandonment during payment details selection)
3. **failed_subscription:** 30 events (Recurring renewal failures)
4. **overdue_invoice:** 25 events (Overdue B2B receivables)

## 4. Domestic / Cross-Border Composition
* **Domestic India Events:** 75 events (`country = IN`, `merchant_country = IN`, `is_cross_border = false`, currency `INR`)
* **Cross-Border Events:** 45 events (`country != merchant_country`, `is_cross_border = true`, currencies include `USD`, `AED`, `MYR`, `GBP`, `EUR`, `SGD`)

Cross-border cases are distributed proportionally across all four event categories.

---

## 5. Dataset Schema (revenue_events.json)

Each event object includes the following fields:

| Field | Type | Description |
| :--- | :--- | :--- |
| `event_id` | String | Unique index matching `EVT-[0001-0120]` |
| `event_type` | String | Categorization: `failed_payment`, `abandoned_checkout`, `failed_subscription`, `overdue_invoice` |
| `timestamp` | String | ISO-8601 formatted ingestion timestamp |
| `customer_id` | String | Customer index `CUS-[0001-0050]` (permitting repeats for historical query testing) |
| `customer_segment` | String | Tier: `retail`, `SMB`, `enterprise` |
| `amount` | Float | Transaction value in customer's billing currency |
| `currency` | String | Currency code (e.g. `INR`, `USD`, `EUR`) |
| `payment_method` | String | Method (e.g. `upi`, `card`, `netbanking`, `international_card`, `bank_transfer`) |
| `decline_reason_code` | String | System decline code (e.g. `insufficient_funds`, `card_expired`, `checkout_friction`) |
| `country` | String | ISO country code of customer |
| `region` | String | State/Region of customer |
| `is_cross_border` | Boolean | True if customer and merchant countries differ |
| `merchant_id` | String | Merchant index `MER-[001-010]` |
| `merchant_type` | String | Industry category (e.g. `SaaS`, `ecommerce`, `marketplace`, `travel`) |
| `previous_recovery_attempts`| Integer | Completed recovery attempts before current stage `[0-4]` |
| `merchant_country` | String | Location of merchant (`IN`) |
| `customer_timezone` | String | Billing timezone |
| `customer_language` | String | Customer's language setting |
| `checkout_session_id` | String | Active session (only present for `abandoned_checkout`, else `null`) |
| `checkout_stage` | String | Step at abandonment (only present for `abandoned_checkout`, else `null`) |
| `subscription_id` | String | Active contract (only present for `failed_subscription`, else `null`) |
| `invoice_id` | String | Active invoice (only present for `overdue_invoice`, else `null`) |
| `invoice_due_date` | String | Due date (only present for `overdue_invoice`, else `null`) |
| `days_overdue` | Integer | Delay in days (only present for `overdue_invoice`, else `null`) |
| `attempted_payment_method` | String | Gateway payment channel attempted |
| `original_payment_method` | String | Historical card/payment method on file |
| `customer_lifetime_value` | Integer | Historical net value |
| `customer_previous_success_rate`| Float | Previous transaction success probability `[0.0-1.0]` |
| `customer_previous_recovery_count`| Integer | Successful recovery runs count |
| `risk_signal` | String | Risk categorization (`low` or `high`) |
| `amount_in_inr` | Float | Standardized monetary value converted to INR |

---

## 6. Synthetic Generation Method & Random Seed
The dataset is programmatically compiled using a Python script located at `backend/app/services/data_generator.py`. 
To ensure reproducibility, a fixed random seed of **`42`** is loaded inside a localized generator instance (`random.Random(42)`). Running the script repeatedly yields files with matching SHA256 hashes, ensuring consistent evaluation inputs for the recovery algorithms.

---

## 7. Ground-Truth Evaluation Data (evaluation_ground_truth.json)
To audit the reasoning quality of the future AI agent, we generate a hidden ground-truth file containing the correct diagnostics and treatment strategies:
- `event_id`: Matches `EVT-[0001-0120]`
- `ground_truth_root_cause`: The true failure origin (e.g., `insufficient_funds`, `expired_or_invalid_payment_method`, `checkout_friction`, `technical_failure`, `cross_border_issuer_risk`, `currency_fx_issue`).
- `ground_truth_recommended_intervention`: The optimal channel/trigger choice (e.g. `delayed_retry`, `payment_method_update`, `bank_authorization_prompt`, `friction_reducing_nudge`, `technical_retry`, `invoice_reminder`).
- `ground_truth_recoverability`: Categorization (`high`, `medium`, `low`).
- `ground_truth_expected_outcome`: Expected result (`recoverable`, `unlikely_to_recover`, `requires_human_review`).

### ⚠️ Separation Rationale
**Why are these files separate?**
The customer-facing application is a real-world SaaS prototype. The merchant dashboard must only display details available to the transaction pipeline. Exposing ground truth directly inside `revenue_events.json` would be equivalent to giving the AI agent the answers in advance. By separating them, the AI can read only raw events, make its own diagnosis, and then developers/evaluators can compare the AI output against the ground truth in `evaluation_ground_truth.json` to calculate precision, recall, and treatment quality metrics.

---

## 8. Validation Rules
The verification script `backend/app/services/data_validator.py` enforces the following logical constraints:
1. **Total Count:** Exactly 120 matching entries, no omissions or duplicates.
2. **Completeness:** Every event maps to exactly one ground truth ID.
3. **Cross-Border Rule:** `is_cross_border` must strictly equal `(country != merchant_country)`.
4. **Geography & Currency:** Currencies and timezones must map to countries (e.g. `INR` for `IN`, `USD` for `US`).
5. **Event-Specific Integrity:** Only overdue invoices contain invoice fields, only subscriptions contain subscription fields, and only checkouts contain checkout stages.
6. **Semantic Reasonableness:** Decline reason codes must belong to their event types (e.g. no "customer_dispute" on subscriptions). Payment methods represent plausible channels (uncommon cross-border configurations are allowed as legitimate edge cases, but not blocked).
