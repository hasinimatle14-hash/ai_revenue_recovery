import os
import json

FIXED_TIMESTAMP = "2026-09-03T12:00:00Z"

def get_data_dir():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    return os.path.join(project_root, "data")

def load_json(filename: str):
    path = os.path.join(get_data_dir(), filename)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def run_anomaly_detection():
    events = load_json("revenue_events.json")
    diagnoses = load_json("diagnoses.json")
    decisions = load_json("recovery_decisions.json")
    attempts = load_json("recovery_attempts.json")
    agent_runs = load_json("agent_runs.json")
    reviews = load_json("human_reviews.json")
    audits = load_json("audit_trail.json")

    anomalies = []
    anm_idx = 1

    # 1. Failure Rate Spike Detection
    failed_attempts = [a for a in attempts if a.get("execution_status") == "failed"]
    if len(failed_attempts) > 40:
        affected = [a["event_id"] for a in failed_attempts[:10]]
        anomalies.append({
            "anomaly_id": f"ANM-{anm_idx:04d}",
            "type": "failure_rate_spike",
            "severity": "high",
            "status": "open",
            "description": f"High simulated failure count detected: {len(failed_attempts)} attempts failed across execution runs.",
            "affected_count": len(failed_attempts),
            "affected_events": affected,
            "recommended_action": "Review payment gateway routing rules and delay intervals for retry execution.",
            "detected_at": FIXED_TIMESTAMP
        })
        anm_idx += 1

    # 2. Excessive Stop Decisions Detection
    stop_decisions = [d for d in decisions if d.get("decision", "").lower() == "stop"]
    if len(stop_decisions) > 15:
        affected = [d["event_id"] for d in stop_decisions[:10]]
        anomalies.append({
            "anomaly_id": f"ANM-{anm_idx:04d}",
            "type": "excessive_stops",
            "severity": "medium",
            "status": "acknowledged",
            "description": f"Elevated stop decisions count: {len(stop_decisions)} transactions halted by safety bounds.",
            "affected_count": len(stop_decisions),
            "affected_events": affected,
            "recommended_action": "Verify if attempt count limits or low recoverability scores require threshold recalibration.",
            "detected_at": FIXED_TIMESTAMP
        })
        anm_idx += 1

    # 3. Excessive Manual Review Concentration
    manual_cases = [r for r in reviews if r.get("review_status") == "pending" or r.get("status") == "pending"]
    if len(manual_cases) >= 10:
        affected = [r["event_id"] for r in manual_cases[:10]]
        anomalies.append({
            "anomaly_id": f"ANM-{anm_idx:04d}",
            "type": "manual_review_concentration",
            "severity": "medium",
            "status": "open",
            "description": f"High pending review concentration: {len(manual_cases)} cases queued for merchant review.",
            "affected_count": len(manual_cases),
            "affected_events": affected,
            "recommended_action": "Assign merchant reviewers to process pending decision queue.",
            "detected_at": FIXED_TIMESTAMP
        })
        anm_idx += 1

    # 4. High Amount Anomaly Detection
    high_amt_events = [e for e in events if e.get("amount_in_inr", 0) >= 50000]
    if len(high_amt_events) > 0:
        affected = [e["event_id"] for e in high_amt_events[:10]]
        anomalies.append({
            "anomaly_id": f"ANM-{anm_idx:04d}",
            "type": "amount_anomaly",
            "severity": "low",
            "status": "resolved",
            "description": f"High-value simulated transaction concentration: {len(high_amt_events)} events exceeding ₹50,000.",
            "affected_count": len(high_amt_events),
            "affected_events": affected,
            "recommended_action": "Ensure high-value transactions receive secondary safety policy review before simulation.",
            "detected_at": FIXED_TIMESTAMP
        })
        anm_idx += 1

    # Save to file
    out_path = os.path.join(get_data_dir(), "anomalies.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(anomalies, f, indent=2)

    print(f"Generated {len(anomalies)} anomaly records in {out_path}")
    return anomalies

if __name__ == "__main__":
    anms = run_anomaly_detection()
    print(f"Detected {len(anms)} operational anomalies.")
