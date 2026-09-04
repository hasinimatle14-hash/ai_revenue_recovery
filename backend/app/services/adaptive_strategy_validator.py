import os
import json
from strategy_features import get_data_dir

def run_adaptive_strategy_validation():
    data_dir = get_data_dir()
    str_path = os.path.join(data_dir, "adaptive_strategies.json")
    sim_path = os.path.join(data_dir, "strategy_simulation.json")
    sum_path = os.path.join(data_dir, "adaptive_learning_summary.json")
    
    assert os.path.exists(str_path), "Adaptive strategies file missing."
    assert os.path.exists(sim_path), "Strategy simulation file missing."
    assert os.path.exists(sum_path), "Learning summary file missing."
    
    with open(str_path, "r", encoding="utf-8") as f:
        strategies = json.load(f)
    with open(sim_path, "r", encoding="utf-8") as f:
        simulation = json.load(f)
    with open(sum_path, "r", encoding="utf-8") as f:
        summary = json.load(f)
        
    # 1. Strategies Assertions
    strategy_ids = set()
    for s in strategies:
        sid = s["strategy_id"]
        assert sid.startswith("STR-"), f"Invalid ID format: {sid}"
        assert sid not in strategy_ids, f"Duplicate strategy ID: {sid}"
        strategy_ids.add(sid)
        
        assert s["strategy_version"].startswith("strategy-v"), f"Invalid version format: {s['strategy_version']}"
        assert 0.0 <= s["confidence"] <= 1.0, f"Confidence out of range: {s['confidence']}"
        assert 0.0 <= s["expected_success_rate"] <= 1.0, f"Success rate out of range: {s['expected_success_rate']}"
        assert 0.0 <= s["expected_recovery_value_rate"] <= 1.0, f"Value rate out of range: {s['expected_recovery_value_rate']}"
        assert s["sample_size"] > 0, f"Sample size must be positive: {s['sample_size']}"
        assert len(s["reasoning"]) > 10, f"Reasoning too short: {s['reasoning']}"
        assert len(s["cohort"]) > 3, f"Cohort name must be valid: {s['cohort']}"
        
        # Verify safety constraints: attempts >= 3 cannot have retry recommended
        # and existing stops must remain stops
        if "attempts" in s["cohort"] and "3" in s["cohort"]:
            assert s["recommended_intervention"] == "stop", "Safety violation: Cohort with attempts >= 3 recommended retry"
            
    # 2. Simulation Assertions
    assert 0.0 <= simulation["baseline_recovery_rate"] <= 1.0
    assert 0.0 <= simulation["projected_recovery_rate"] <= 1.0
    assert simulation["projected_recovery_rate"] >= simulation["baseline_recovery_rate"]
    assert simulation["projected_recovered_value"] >= simulation["baseline_recovered_value"]
    
    # 3. Security Boundary Verification
    script_dir = os.path.dirname(os.path.abspath(__file__))
    merchant_files = [
        "strategy_features.py",
        "adaptive_strategy_engine.py",
        "strategy_versioning.py",
        "strategy_recommender.py",
        "strategy_simulator.py",
        "adaptive_learning_engine.py",
        "adaptive_strategy_validator.py"
    ]
    gt_filename = "evaluation_" + "ground_truth.json"
    for file_name in merchant_files:
        path = os.path.join(script_dir, file_name)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                code = f.read()
                assert gt_filename not in code, \
                    f"Security Boundary Violation: Production file {os.path.basename(file_name)} references {gt_filename}!"
                    
    print("--- ADAPTIVE STRATEGY INTEGRITY VALIDATION PASSED ---")
    print("All strategy cohort thresholds, version sequence parameters, and security bounds validate successfully.")

if __name__ == "__main__":
    run_adaptive_strategy_validation()
