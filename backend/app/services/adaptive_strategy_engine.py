import os
import json
from datetime import datetime
from strategy_features import extract_features, get_data_dir

def get_cohort(rc, geo, amt):
    if rc == "insufficient_funds":
        if geo == "cross_border":
            return "insufficient_funds_cross_border"
        elif amt >= 15000:
            return "insufficient_funds_domestic_high_value"
        else:
            return "insufficient_funds_domestic_low_value"
    elif rc in ["expired_card", "invalid_details", "authentication_failed"]:
        return "card_credentials_domestic"
    elif rc in ["bank_downtime", "network_error"]:
        return "technical_infrastructure_failure"
    elif rc in ["api_timeout", "gateway_error"]:
        return "gateway_connection_failure"
    elif rc in ["b2b_invoice_unpaid", "b2b_net_terms"]:
        return "b2b_terms_collections"
    else:
        return "general_payment_failures"

def get_timing_for_intervention(rc, intervention):
    if rc == "insufficient_funds":
        return "delay_24h"
    elif rc in ["expired_card", "invalid_details"]:
        return "delay_1h"
    elif rc in ["bank_downtime", "network_error", "api_timeout"]:
        return "delay_4h"
    return "immediate"

def run_adaptive_strategy_analysis():
    features = extract_features()
    
    # 1. Group events by (cohort, intervention)
    cohort_data = {}
    for feat in features:
        rc = feat["root_cause"]
        geo = feat["geography"]
        amt = feat["amount_in_inr"]
        cohort = get_cohort(rc, geo, amt)
        interv = feat["selected_intervention"]
        
        if cohort not in cohort_data:
            cohort_data[cohort] = {}
        if interv not in cohort_data[cohort]:
            cohort_data[cohort][interv] = {
                "attempts": 0,
                "successes": 0,
                "failures": 0,
                "total_at_risk": 0.0,
                "total_recovered": 0.0
            }
            
        stats = cohort_data[cohort][interv]
        stats["attempts"] += 1
        if feat["simulated_outcome"] == "success":
            stats["successes"] += 1
            stats["total_recovered"] += feat["recovered_amount"]
        elif feat["simulated_outcome"] == "failed":
            stats["failures"] += 1
            
        stats["total_at_risk"] += feat["amount_in_inr"]
        
    # 2. Extract best recommendations per cohort
    strategies = []
    cohort_names = sorted(list(cohort_data.keys()))
    
    for idx, cohort in enumerate(cohort_names, start=1):
        interv_stats = cohort_data[cohort]
        
        # Sort interventions by success rate then recovery value rate descending
        sorted_intervs = []
        for interv, stats in interv_stats.items():
            if interv == "none":
                continue
            attempts = stats["attempts"]
            success_rate = stats["successes"] / attempts if attempts > 0 else 0.0
            value_rate = stats["total_recovered"] / stats["total_at_risk"] if stats["total_at_risk"] > 0 else 0.0
            
            # Simple Laplace-like confidence: success_rate * (1 - 1 / (attempts + 1))
            confidence = round(success_rate * (1.0 - 1.0 / (attempts + 1)), 4) if attempts > 0 else 0.0
            
            sorted_intervs.append({
                "intervention": interv,
                "attempts": attempts,
                "successes": stats["successes"],
                "success_rate": round(success_rate, 4),
                "value_rate": round(value_rate, 4),
                "confidence": confidence,
                "total_recovered": stats["total_recovered"]
            })
            
        # Sort key: confidence desc, success_rate desc, attempts desc
        sorted_intervs.sort(key=lambda x: (x["confidence"], x["success_rate"], x["attempts"]), reverse=True)
        
        if not sorted_intervs:
            continue
            
        best = sorted_intervs[0]
        
        # Map cohorts to root causes
        causes_map = {
            "insufficient_funds_cross_border": ["insufficient_funds"],
            "insufficient_funds_domestic_high_value": ["insufficient_funds"],
            "insufficient_funds_domestic_low_value": ["insufficient_funds"],
            "card_credentials_domestic": ["expired_card", "invalid_details", "authentication_failed"],
            "technical_infrastructure_failure": ["bank_downtime", "network_error"],
            "gateway_connection_failure": ["api_timeout", "gateway_error"],
            "b2b_terms_collections": ["b2b_invoice_unpaid", "b2b_net_terms"],
            "general_payment_failures": ["unknown", "other"]
        }
        
        applicable_causes = causes_map.get(cohort, ["unknown"])
        timing = get_timing_for_intervention(applicable_causes[0], best["intervention"])
        
        reasoning = f"Analyzing {best['attempts']} simulated cases in cohort '{cohort}' reveals that '{best['intervention']}' achieves a success rate of {int(best['success_rate']*100)}% with a value yield of {int(best['value_rate']*100)}%."
        
        strategies.append({
            "strategy_id": f"STR-{idx:04d}",
            "cohort": cohort,
            "applicable_root_causes": applicable_causes,
            "recommended_intervention": best["intervention"],
            "recommended_timing": timing,
            "expected_success_rate": best["success_rate"],
            "expected_recovery_value_rate": best["value_rate"],
            "confidence": best["confidence"],
            "sample_size": best["attempts"],
            "reasoning": reasoning,
            "strategy_version": "strategy-v1.0",
            "created_at": "2026-08-31T12:00:00Z",
            "status": "active"
        })
        
    # Save output
    out_path = os.path.join(get_data_dir(), "adaptive_strategies.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(strategies, f, indent=2)
        
    print(f"Generated {len(strategies)} adaptive strategy recommendations in {out_path}")
    return strategies

if __name__ == "__main__":
    run_adaptive_strategy_analysis()
