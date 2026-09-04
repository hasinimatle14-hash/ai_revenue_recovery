import os
import json
from datetime import datetime

def run_evaluation():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    data_dir = os.path.join(project_root, "data")
    
    gt_path = os.path.join(data_dir, "evaluation_ground_truth.json")
    runs_path = os.path.join(data_dir, "agent_runs.json")
    output_path = os.path.join(data_dir, "agent_evaluation.json")
    
    assert os.path.exists(gt_path), f"Ground truth missing: {gt_path}"
    assert os.path.exists(runs_path), f"Runs missing: {runs_path}"
    
    with open(gt_path, "r", encoding="utf-8") as f:
        ground_truth = json.load(f)
    with open(runs_path, "r", encoding="utf-8") as f:
        agent_runs = json.load(f)
        
    gt_map = {item["event_id"]: item for item in ground_truth}
    runs_map = {item["event_id"]: item for item in agent_runs}
    
    # Vocabulary mapping between agent runs and ground truth recommended interventions
    recommendation_mapping = {
        "proceed_with_simulation": ["technical_retry", "invoice_reminder", "friction_reducing_nudge"],
        "delay_and_retry": ["delayed_retry", "payment_plan_offer"],
        "request_payment_method_update": ["payment_method_update", "alternative_payment_method"],
        "manual_review": ["human_collections_review"],
        "stop": ["stop"],
        "no_action": ["stop"]
    }
    
    correct_actions = 0
    total_evals = 120
    
    risk_distribution = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    human_review_cases = 0
    human_review_matched = 0
    safety_overrides = 0
    stop_rule_matches = 0
    total_confidence = 0.0
    
    high_conf_total = 0
    high_conf_correct = 0
    
    for eid in gt_map:
        gt = gt_map[eid]
        run = runs_map.get(eid)
        if not run:
            continue
            
        action = run["recommended_action"]
        gt_intervention = gt["ground_truth_recommended_intervention"]
        
        # Check action match
        matched = False
        allowed_gts = recommendation_mapping.get(action, [])
        if gt_intervention in allowed_gts:
            matched = True
            
        if matched:
            correct_actions += 1
            if run["confidence"] >= 0.75:
                high_conf_correct += 1
                
        if run["confidence"] >= 0.75:
            high_conf_total += 1
            
        # Risk distribution count
        risk_distribution[run["risk_level"]] += 1
        
        # Human review precision
        if run["requires_human_review"]:
            human_review_cases += 1
            if gt["ground_truth_expected_outcome"] == "requires_human_review":
                human_review_matched += 1
                
        # Safety policy override counts
        if run["policy_checks"]["override_required"]:
            safety_overrides += 1
            
        # Stop rule alignment
        if gt_intervention == "stop" and action == "stop":
            stop_rule_matches += 1
            
        total_confidence += run["confidence"]
        
    avg_confidence = round(total_confidence / total_evals, 4)
    action_accuracy = round(correct_actions / total_evals, 4)
    high_conf_accuracy = round(high_conf_correct / high_conf_total, 4) if high_conf_total > 0 else 0.0
    human_review_precision = round(human_review_matched / human_review_cases, 4) if human_review_cases > 0 else 0.0
    safety_override_rate = round(safety_overrides / total_evals, 4)
    
    evaluation_summary = {
        "evaluated_at": "2026-08-30T22:00:00Z",
        "total_evaluations": total_evals,
        "action_accuracy": action_accuracy,
        "average_confidence": avg_confidence,
        "high_confidence_total": high_conf_total,
        "high_confidence_accuracy": high_conf_accuracy,
        "human_review_count": human_review_cases,
        "human_review_precision": human_review_precision,
        "safety_override_count": safety_overrides,
        "safety_override_rate": safety_override_rate,
        "stop_rule_matches": stop_rule_matches,
        "risk_distribution": risk_distribution
    }
    
    # Save output
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(evaluation_summary, f, indent=2)
        
    print(f"Evaluation report generated successfully. Saved to {output_path}")
    print(f"Action accuracy: {action_accuracy * 100}%, Avg confidence: {avg_confidence * 100}%")
    return evaluation_summary

if __name__ == "__main__":
    run_evaluation()
