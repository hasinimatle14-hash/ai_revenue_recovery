import os
import json

def run_optimization_validation():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    data_dir = os.path.join(project_root, "data")
    
    opt_path = os.path.join(data_dir, "recovery_optimization.json")
    assert os.path.exists(opt_path), f"Optimization dataset missing: {opt_path}"
    
    with open(opt_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    glob = data["global"]
    assert glob["total_events"] == 120, f"Expected 120 total events, got {glob['total_events']}"
    assert glob["total_simulated_revenue_at_risk"] >= 0.0, "Negative at risk revenue found"
    assert glob["total_simulated_revenue_recovered"] >= 0.0, "Negative recovered revenue found"
    assert 0.0 <= glob["overall_recovery_rate"] <= 1.0, f"Overall recovery rate out of bounds: {glob['overall_recovery_rate']}"
    assert 0.0 <= glob["recovery_value_percentage"] <= 1.0, f"Recovery value percentage out of bounds: {glob['recovery_value_percentage']}"
    
    # Interventions check
    for item in data["interventions"]:
        assert item["attempts"] == item["successes"] + item["failures"], "Intervention attempts math mismatch"
        assert 0.0 <= item["success_rate"] <= 1.0, "Intervention success rate out of bounds"
        assert item["simulated_revenue_recovered"] >= 0.0, "Negative intervention revenue found"
        
    # Recommendations check
    for rec in data["recommendations"]:
        assert 0.0 <= rec["confidence"] <= 1.0, "Recommendation confidence out of bounds"
        assert rec["supporting_event_count"] > 0, "Recommendation supporting events count must be positive"
        
    # Ground truth separation check
    merchant_files = [
        "human_review_rules.py",
        "human_review_engine.py",
        "human_review_service.py",
        "recovery_optimizer.py",
        "optimization_validator.py"
    ]
    gt_filename = "evaluation_" + "ground_truth.json"
    for file_name in merchant_files:
        path = os.path.join(script_dir, file_name)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                code = f.read()
                assert gt_filename not in code, \
                    f"Security Boundary Violation: Production file {os.path.basename(file_name)} references {gt_filename}!"
                    
    print("--- RECOVERY OPTIMIZATION INTEGRITY VALIDATION PASSED ---")
    print("All mathematical summaries, cohort rates, and boundary limits validate perfectly.")

if __name__ == "__main__":
    run_optimization_validation()
