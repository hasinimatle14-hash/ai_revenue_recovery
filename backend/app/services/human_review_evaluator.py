import os
import json
from datetime import datetime

def run_human_review_evaluation():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    data_dir = os.path.join(project_root, "data")
    
    gt_path = os.path.join(data_dir, "evaluation_ground_truth.json")
    reviews_path = os.path.join(data_dir, "human_reviews.json")
    output_path = os.path.join(data_dir, "human_review_evaluation.json")
    
    assert os.path.exists(gt_path), f"Ground truth missing: {gt_path}"
    assert os.path.exists(reviews_path), f"Human reviews missing: {reviews_path}"
    
    with open(gt_path, "r", encoding="utf-8") as f:
        ground_truth = json.load(f)
    with open(reviews_path, "r", encoding="utf-8") as f:
        reviews = json.load(f)
        
    gt_map = {item["event_id"]: item for item in ground_truth}
    
    total_reviews = len(reviews)
    pending_count = 0
    approved_count = 0
    rejected_count = 0
    correct_decisions = 0
    safety_compliance = 0
    
    final_action_mapping = {
        "proceed_with_simulation": ["technical_retry", "invoice_reminder", "friction_reducing_nudge"],
        "delay_and_retry": ["delayed_retry", "payment_plan_offer"],
        "request_payment_method_update": ["payment_method_update", "alternative_payment_method"],
        "stop": ["stop"],
        "no_action": ["stop"]
    }
    
    for r in reviews:
        eid = r["event_id"]
        status = r["review_status"]
        gt = gt_map.get(eid, {})
        
        if status == "pending":
            pending_count += 1
        elif status == "approved":
            approved_count += 1
        elif status == "rejected":
            rejected_count += 1
            
        # Accuracy checks for completed review decisions
        if status != "pending":
            final_action = r["final_action"]
            gt_intervention = gt.get("ground_truth_recommended_intervention")
            
            # Action match check
            matched = False
            allowed_gts = final_action_mapping.get(final_action, [])
            if gt_intervention in allowed_gts:
                matched = True
                
            if matched:
                correct_decisions += 1
                
            # Safety checks check
            # Stopped events must not be retry approved
            gt_outcome = gt.get("ground_truth_expected_outcome")
            if gt_outcome == "stop" and final_action != "stop":
                pass # safety violation
            else:
                safety_compliance += 1
        else:
            # Pending checks defaults
            safety_compliance += 1
            
    completed_reviews = approved_count + rejected_count
    accuracy = round(correct_decisions / completed_reviews, 4) if completed_reviews > 0 else 1.0
    safety_rate = round(safety_compliance / total_reviews, 4) if total_reviews > 0 else 1.0
    completion_rate = round(completed_reviews / total_reviews, 4) if total_reviews > 0 else 0.0
    
    evaluation_summary = {
        "evaluated_at": "2026-08-30T22:00:00Z",
        "total_reviews": total_reviews,
        "pending_reviews": pending_count,
        "approved_reviews": approved_count,
        "rejected_reviews": rejected_count,
        "review_completion_rate": completion_rate,
        "review_decision_accuracy": accuracy,
        "safety_compliance_rate": safety_rate,
        "simulated_recovery_impact_inr": approved_count * 12500.0 # simulation impact metric
    }
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(evaluation_summary, f, indent=2)
        
    print(f"Human review evaluation report generated successfully. Saved to {output_path}")
    return evaluation_summary

if __name__ == "__main__":
    run_human_review_evaluation()
