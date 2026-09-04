import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI application
app = FastAPI(
    title="AI Revenue Recovery Agent Backend",
    description="Service API for detecting, diagnosing, and recovering revenue at risk.",
    version="1.0.0"
)

# Configure CORS to allow the frontend to communicate with the API
# We allow localhost origins typically used by Vite (e.g. 5173, 3000, 8000)
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://ai-revenue-recovery-3e6npz7vm-a-3b71.vercel.app",
    "https://ai-revenue-recovery-hmjv2yc91-a-3b71.vercel.app",
]

vercel_origin_regex = r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=vercel_origin_regex,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def read_health():
    """
    Health check endpoint to verify backend service connectivity.
    """
    return {
        "status": "ok",
        "service": "AI Revenue Recovery Agent"
    }

@app.get("/api/diagnosis/status")
def read_diagnosis_status():
    """
    Status endpoint for the AI Diagnosis Engine, checked by frontend.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    events_path = os.path.join(data_dir, "revenue_events.json")
    diagnoses_path = os.path.join(data_dir, "diagnoses.json")
    
    events_count = 0
    diagnoses_count = 0
    
    # Check events count
    if os.path.exists(events_path):
        try:
            with open(events_path, "r") as f:
                events = json.load(f)
                events_count = len(events)
        except Exception:
            events_count = 120  # Fallback to default count
            
    # Check diagnoses count
    if os.path.exists(diagnoses_path):
        try:
            with open(diagnoses_path, "r") as f:
                diagnoses = json.load(f)
                diagnoses_count = len(diagnoses)
        except Exception:
            diagnoses_count = 0

    if diagnoses_count == 120:
        return {
            "status": "ready",
            "events_analyzed": events_count,
            "diagnoses_generated": diagnoses_count
        }
    else:
        return {
            "status": "not_ready",
            "events_analyzed": events_count,
            "diagnoses_generated": diagnoses_count
        }

@app.get("/api/diagnoses/{event_id}")
def read_single_diagnosis(event_id: str):
    """
    Lookup a single diagnosis by its event_id (e.g. EVT-0001).
    """
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    diagnoses_path = os.path.join(data_dir, "diagnoses.json")
    
    if not os.path.exists(diagnoses_path):
        raise HTTPException(status_code=404, detail="Diagnoses dataset not generated yet")
        
    try:
        with open(diagnoses_path, "r") as f:
            diagnoses = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read diagnoses database: {str(e)}")
        
    for dgn in diagnoses:
        if dgn["event_id"] == event_id:
            return dgn
            
    raise HTTPException(status_code=404, detail=f"Diagnosis for event ID '{event_id}' not found")

@app.get("/api/recovery/status")
def read_recovery_status():
    """
    Status endpoint for the Recovery Engine, checked by frontend.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    decisions_path = os.path.join(data_dir, "recovery_decisions.json")
    events_path = os.path.join(data_dir, "revenue_events.json")
    
    events_count = 0
    decisions_count = 0
    recoverable_count = 0
    stopped_count = 0
    review_count = 0
    
    # Check events count
    if os.path.exists(events_path):
        try:
            with open(events_path, "r") as f:
                events = json.load(f)
                events_count = len(events)
        except Exception:
            events_count = 120
            
    # Check decisions count
    if os.path.exists(decisions_path):
        try:
            with open(decisions_path, "r") as f:
                decisions = json.load(f)
                decisions_count = len(decisions)
                for dec in decisions:
                    d = dec.get("decision")
                    if d == "recover":
                        recoverable_count += 1
                    elif d == "stop":
                        stopped_count += 1
                    elif d == "review":
                        review_count += 1
        except Exception:
            decisions_count = 0

    if decisions_count == 120:
        return {
            "status": "ready",
            "events_processed": events_count,
            "decisions_generated": decisions_count,
            "recoverable_events": recoverable_count,
            "stopped_events": stopped_count,
            "review_events": review_count
        }
    else:
        return {
            "status": "not_ready",
            "events_processed": events_count,
            "decisions_generated": decisions_count
        }

@app.get("/api/recovery/decision/{event_id}")
def read_single_recovery_decision(event_id: str):
    """
    Lookup a single recovery decision by its event_id (e.g. EVT-0001).
    """
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    decisions_path = os.path.join(data_dir, "recovery_decisions.json")
    
    if not os.path.exists(decisions_path):
        raise HTTPException(status_code=404, detail="Recovery decisions dataset not generated yet")
        
    try:
        with open(decisions_path, "r") as f:
            decisions = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read recovery decisions database: {str(e)}")
        
    for dec in decisions:
        if dec["event_id"] == event_id:
            return dec
            
    raise HTTPException(status_code=404, detail=f"Recovery decision for event ID '{event_id}' not found")

@app.get("/api/recovery/execution/status")
def read_recovery_execution_status():
    """
    Execution status endpoint, checked by frontend.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    summary_path = os.path.join(data_dir, "recovery_execution_summary.json")
    
    if not os.path.exists(summary_path):
        return {
            "status": "not_ready",
            "events_processed": 120,
            "attempts_created": 0,
            "successful_recoveries": 0,
            "failed_attempts": 0,
            "skipped_events": 0,
            "blocked_events": 0,
            "simulated_revenue_recovered": 0.0
        }
        
    try:
        with open(summary_path, "r") as f:
            summary = json.load(f)
        return {
            "status": "ready",
            "events_processed": summary.get("total_events", 120),
            "attempts_created": summary.get("attempts_created", 120),
            "successful_recoveries": summary.get("successful_recoveries", 0),
            "failed_attempts": summary.get("failed_attempts", 0),
            "skipped_events": summary.get("skipped_events", 0),
            "blocked_events": summary.get("blocked_events", 0),
            "simulated_revenue_recovered": summary.get("simulated_revenue_recovered", 0.0)
        }
    except Exception:
        return {
            "status": "not_ready",
            "events_processed": 120,
            "attempts_created": 0,
            "successful_recoveries": 0,
            "failed_attempts": 0,
            "skipped_events": 0,
            "blocked_events": 0,
            "simulated_revenue_recovered": 0.0
        }

@app.get("/api/recovery/attempt/{event_id}")
def read_single_recovery_attempt(event_id: str):
    """
    Lookup a single recovery attempt by its event_id (e.g. EVT-0001).
    """
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    attempts_path = os.path.join(data_dir, "recovery_attempts.json")
    
    if not os.path.exists(attempts_path):
        raise HTTPException(status_code=404, detail="Recovery attempts dataset not simulated yet")
        
    try:
        with open(attempts_path, "r") as f:
            attempts = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read recovery attempts database: {str(e)}")
        
    for att in attempts:
        if att["event_id"] == event_id:
            return att
            
    raise HTTPException(status_code=404, detail=f"Recovery attempt for event ID '{event_id}' not found")

@app.get("/api/analytics/summary")
def get_analytics_summary():
    """Returns the full calculated analytics summary."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "analytics_summary.json")
    
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Analytics database not calculated yet")
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/event-types")
def get_analytics_event_types():
    summary = get_analytics_summary()
    return summary.get("by_event_type", {})

@app.get("/api/analytics/root-causes")
def get_analytics_root_causes():
    summary = get_analytics_summary()
    return summary.get("by_root_cause", {})

@app.get("/api/analytics/interventions")
def get_analytics_interventions():
    summary = get_analytics_summary()
    return summary.get("by_intervention", {})

@app.get("/api/analytics/segments")
def get_analytics_segments():
    summary = get_analytics_summary()
    return summary.get("by_customer_segment", {})

@app.get("/api/analytics/geography")
def get_analytics_geography():
    summary = get_analytics_summary()
    return summary.get("by_geography", {})

@app.get("/api/audit")
def get_audit_trail(event_id: str = None, action: str = None, status: str = None):
    """Retrieves chronological audit trail records with optional filtering."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "audit_trail.json")
    
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Audit trail database not generated yet")
    try:
        with open(path, "r") as f:
            records = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    filtered = []
    for r in records:
        if event_id and r["event_id"] != event_id:
            continue
        if action and r["action"] != action:
            continue
        if status and r["status"] != status:
            continue
        filtered.append(r)
    return filtered

@app.get("/api/audit/{event_id}")
def get_single_event_audit(event_id: str):
    """Retrieves chronological audit records for a specific event."""
    return get_audit_trail(event_id=event_id)

@app.get("/api/recovery/runs")
def get_recovery_runs():
    """Combines event, diagnosis, decision, and attempt datasets for the frontend."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    
    events_path = os.path.join(data_dir, "revenue_events.json")
    diagnoses_path = os.path.join(data_dir, "diagnoses.json")
    decisions_path = os.path.join(data_dir, "recovery_decisions.json")
    attempts_path = os.path.join(data_dir, "recovery_attempts.json")
    
    if not (os.path.exists(events_path) and os.path.exists(diagnoses_path) and os.path.exists(decisions_path) and os.path.exists(attempts_path)):
        raise HTTPException(status_code=404, detail="One or more database files are missing. Run pipeline first.")
        
    try:
        with open(events_path, "r") as f:
            events = json.load(f)
        with open(diagnoses_path, "r") as f:
            diagnoses = json.load(f)
        with open(decisions_path, "r") as f:
            decisions = json.load(f)
        with open(attempts_path, "r") as f:
            attempts = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read databases: {str(e)}")
        
    dgn_map = {d["event_id"]: d for d in diagnoses}
    dec_map = {dec["event_id"]: dec for dec in decisions}
    att_map = {att["event_id"]: att for att in attempts}
    
    runs = []
    for event in events:
        eid = event["event_id"]
        diagnosis = dgn_map.get(eid, {})
        decision = dec_map.get(eid, {})
        attempt = att_map.get(eid, {})
        
        runs.append({
            "event_id": eid,
            "event_type": event["event_type"],
            "amount": event["amount"],
            "currency": event["currency"],
            "amount_in_inr": event["amount_in_inr"],
            "timestamp": event["timestamp"],
            "payment_method": event["payment_method"],
            "customer_segment": event["customer_segment"],
            "country": event["country"],
            "merchant_country": event["merchant_country"],
            "is_cross_border": event["is_cross_border"],
            "previous_recovery_attempts": event["previous_recovery_attempts"],
            
            "root_cause": diagnosis.get("root_cause", ""),
            "confidence": diagnosis.get("confidence", 0.0),
            "recoverability": diagnosis.get("recoverability", ""),
            "reasoning": diagnosis.get("reasoning", ""),
            
            "decision": decision.get("decision", ""),
            "eligible_for_recovery": decision.get("eligible_for_recovery", False),
            "selected_intervention": decision.get("selected_intervention", ""),
            "timing": decision.get("timing", ""),
            "priority_score": decision.get("priority_score", 0.0),
            "eligibility_reason": decision.get("eligibility_reason", ""),
            "current_state": decision.get("current_state", ""),
            "next_state": decision.get("next_state", ""),
            
            "attempt_id": attempt.get("attempt_id", ""),
            "execution_status": attempt.get("execution_status", ""),
            "outcome": attempt.get("outcome", ""),
            "simulated_amount_recovered": attempt.get("simulated_amount_recovered", 0.0),
            "failure_reason": attempt.get("failure_reason"),
            "execution_reason": attempt.get("execution_reason", ""),
            "executed_at": attempt.get("executed_at", "")
        })
    return runs

@app.get("/api/recovery/runs/{event_id}")
def get_single_recovery_run(event_id: str):
    """Returns the complete lifecycle run record for a single event."""
    from fastapi import HTTPException
    runs = get_recovery_runs()
    for run in runs:
        if run["event_id"] == event_id:
            return run
    raise HTTPException(status_code=404, detail=f"Recovery run for event ID '{event_id}' not found")

@app.get("/api/agent/runs")
def get_agent_runs():
    """Retrieves all 120 AI agent runs."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    runs_path = os.path.join(data_dir, "agent_runs.json")
    
    if not os.path.exists(runs_path):
        raise HTTPException(status_code=404, detail="Agent runs database not compiled yet")
    try:
        with open(runs_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agent/status")
def get_agent_status():
    """Returns a high-level summary of the AI agent runs status."""
    runs = get_agent_runs()
    total = len(runs)
    human_queue = sum(1 for r in runs if r.get("requires_human_review"))
    avg_conf = sum(r.get("confidence", 0.0) for r in runs) / total if total > 0 else 0.0
    
    return {
        "status": "ready",
        "events_processed": total,
        "agent_runs": total,
        "human_review_queue": human_queue,
        "average_confidence": round(avg_conf, 4)
    }

@app.get("/api/agent/runs/{event_id}")
def get_single_agent_run(event_id: str):
    """Retrieves a single agent run by its event_id."""
    from fastapi import HTTPException
    runs = get_agent_runs()
    for run in runs:
        if run["event_id"] == event_id:
            return run
    raise HTTPException(status_code=404, detail=f"Agent run for event ID '{event_id}' not found")

@app.get("/api/agent/review-queue")
def get_agent_review_queue():
    """Retrieves list of agent runs requiring human intervention."""
    runs = get_agent_runs()
    return [r for r in runs if r.get("requires_human_review")]

@app.get("/api/agent/metrics")
def get_agent_metrics():
    """Retrieves calculated benchmark metrics from agent_evaluation.json."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "agent_evaluation.json")
    
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Agent evaluation database not calculated yet")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agent/runs/{event_id}/timeline")
def get_agent_run_timeline(event_id: str):
    """Retrieves structured timeline steps specifically for the recovery agent run."""
    run = get_single_agent_run(event_id)
    policy = run.get("policy_checks", {})
    override_txt = "Safety Override Triggered" if policy.get("override_required") else "Clear"
    
    return [
        {
            "step": "Context collected",
            "status": "completed",
            "description": "AI Agent gathered complete transaction, CLV, and customer history parameters."
        },
        {
            "step": "Diagnosis reviewed",
            "status": "completed",
            "description": f"AI Agent reviewed failure diagnosis logic. Ingested diagnosis ID: {run.get('diagnosis_id')}."
        },
        {
            "step": "Decision reviewed",
            "status": "completed",
            "description": f"AI Agent reviewed planned recovery intervention decision. Ingested decision ID: {run.get('decision_id')}."
        },
        {
            "step": "Policy checked",
            "status": "completed",
            "description": f"Safety policy rules inspected. Status: {override_txt}. Triggered rules: {policy.get('triggered_rules')}."
        },
        {
            "step": "Risk assessed",
            "status": "completed",
            "description": f"Risk level determined: '{run.get('risk_level').upper()}' based on amount and past history."
        },
        {
            "step": "Action recommended",
            "status": "completed",
            "description": f"Recommended action set: '{run.get('recommended_action').replace('_', ' ')}' with confidence {int(run.get('confidence', 0.0)*100)}%."
        }
    ]

@app.get("/api/reviews")
def get_all_reviews(status: str = None):
    """Retrieves all human review records."""
    from app.services.human_review_service import load_reviews
    reviews = load_reviews()
    if status:
        reviews = [r for r in reviews if r.get("review_status") == status]
    return reviews

@app.get("/api/reviews/status")
def get_reviews_status():
    """Returns dynamic status counts for the human reviews."""
    from app.services.human_review_service import load_reviews
    reviews = load_reviews()
    total = len(reviews)
    pending = sum(1 for r in reviews if r.get("review_status") == "pending")
    approved = sum(1 for r in reviews if r.get("review_status") == "approved")
    rejected = sum(1 for r in reviews if r.get("review_status") == "rejected")
    blocked = sum(1 for r in reviews if r.get("final_action") == "stop")
    
    return {
        "status": "ready",
        "total_reviews": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "blocked": blocked
    }

@app.get("/api/reviews/{review_id}")
def get_single_review(review_id: str):
    """Retrieves a single review record."""
    from fastapi import HTTPException
    from app.services.human_review_service import load_reviews
    reviews = load_reviews()
    for r in reviews:
        if r["review_id"] == review_id:
            return r
    raise HTTPException(status_code=404, detail=f"Human review record '{review_id}' not found.")

@app.post("/api/reviews/{review_id}/decision")
def post_review_decision(review_id: str, payload: dict):
    """Submits, validates, and persists a merchant reviewer decision."""
    from fastapi import HTTPException
    from app.services.human_review_service import record_human_decision
    
    decision = payload.get("decision")
    reason = payload.get("reason", "")
    reviewer = payload.get("reviewed_by", "merchant")
    
    if not decision:
        raise HTTPException(status_code=400, detail="Missing decision field.")
        
    try:
        updated_review = record_human_decision(
            review_id=review_id,
            decision=decision,
            reason=reason,
            reviewer=reviewer
        )
        return updated_review
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except ValueError as ve:
        err_msg = str(ve)
        if "CONFLICT" in err_msg:
            raise HTTPException(status_code=409, detail=err_msg)
        elif "UNSAFE" in err_msg:
            raise HTTPException(status_code=400, detail=err_msg)
        else:
            raise HTTPException(status_code=400, detail=err_msg)

@app.get("/api/optimization/summary")
def get_optimization_summary():
    """Returns global optimization metrics from recovery_optimization.json."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "recovery_optimization.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Recovery optimization dataset not generated yet")
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("global", {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/optimization/interventions")
def get_optimization_interventions():
    """Returns intervention performance metrics from recovery_optimization.json."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "recovery_optimization.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Recovery optimization dataset not generated yet")
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("interventions", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/optimization/recommendations")
def get_optimization_recommendations():
    """Returns optimization recommendations from recovery_optimization.json."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "recovery_optimization.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Recovery optimization dataset not generated yet")
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("recommendations", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/strategy/status")
def get_strategy_status():
    """Returns adaptive learning pipeline summary status indicators."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "adaptive_learning_summary.json")
    if not os.path.exists(path):
        return {
            "status": "not_ready",
            "strategies_generated": 0,
            "cohorts_analyzed": 0,
            "learning_version": "none",
            "confidence": 0.0
        }
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {
                "status": "ready",
                "strategies_generated": data.get("strategies_generated", 0),
                "cohorts_analyzed": data.get("cohorts_analyzed", 0),
                "learning_version": data.get("learning_version", "strategy-v1.0"),
                "confidence": data.get("confidence", 0.0)
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/strategies")
def get_all_strategies():
    """Returns all adaptive strategy recommendation rules."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "adaptive_strategies.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Adaptive strategies dataset not generated yet")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/strategies/recommended")
def get_recommended_strategies():
    """Returns currently active recommended strategy items."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "adaptive_strategies.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Adaptive strategies dataset not generated yet")
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return [s for s in data if s.get("status") == "active"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/strategies/versions")
def get_strategy_versions():
    """Returns the historical versions changelog list."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "strategy_versions.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Strategy version history log not generated yet")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/strategies/{strategy_id}")
def get_single_strategy(strategy_id: str):
    """Returns details for a single strategy ID."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "adaptive_strategies.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Adaptive strategies dataset not generated yet")
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            for s in data:
                if s["strategy_id"] == strategy_id:
                    return s
            raise HTTPException(status_code=404, detail=f"Strategy record '{strategy_id}' not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/strategy/simulation")
def get_strategy_simulation_results():
    """Returns simulated incremental value what-if metrics."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "strategy_simulation.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Strategy simulation dataset not generated yet")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/strategy/learning")
def get_adaptive_learning_summary():
    """Returns continuous learning pipeline execution outputs."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "adaptive_learning_summary.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Adaptive learning summary dataset not generated yet")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/system/health")
def get_system_health():
    """Returns overall system health status and completion metrics."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "control_center_summary.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Control center summary dataset not generated yet")
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("system_health", {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/control-center/summary")
def get_control_center_summary():
    """Returns aggregated Part 10 control center payload."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "control_center_summary.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Control center summary dataset not generated yet")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/anomalies")
def get_all_anomalies(severity: str = None, type: str = None, status: str = None):
    """Returns detected operational anomalies with optional severity, type, and status filtering."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "anomalies.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Anomalies dataset not generated yet")
    try:
        with open(path, "r", encoding="utf-8") as f:
            items = json.load(f)
            if severity:
                items = [i for i in items if i.get("severity") == severity]
            if type:
                items = [i for i in items if i.get("type") == type]
            if status:
                items = [i for i in items if i.get("status") == status]
            return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/anomalies/{anomaly_id}")
def get_single_anomaly(anomaly_id: str):
    """Returns details for a single anomaly ID."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "anomalies.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Anomalies dataset not generated yet")
    try:
        with open(path, "r", encoding="utf-8") as f:
            items = json.load(f)
            for i in items:
                if i["anomaly_id"] == anomaly_id:
                    return i
            raise HTTPException(status_code=404, detail=f"Anomaly record '{anomaly_id}' not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/governance/status")
def get_governance_status():
    """Returns governance compliance percentage and check count indicators."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "governance_report.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Governance report dataset not generated yet")
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {
                "overall_status": data.get("overall_status", "compliant"),
                "policy_compliance_percentage": data.get("policy_compliance_percentage", 100.0),
                "total_checks_evaluated": data.get("total_checks_evaluated", 0),
                "passed_checks": data.get("passed_checks", 0),
                "warning_checks": data.get("warning_checks", 0),
                "failed_checks": data.get("failed_checks", 0),
                "violations_count": len(data.get("safety_violations", []))
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/governance/report")
def get_governance_report():
    """Returns full governance report JSON."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "governance_report.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Governance report dataset not generated yet")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/system/pipeline")
def get_system_pipeline_status():
    """Returns 9-stage pipeline progression completion status."""
    from fastapi import HTTPException
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "..", "data"))
    path = os.path.join(data_dir, "control_center_summary.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Control center summary dataset not generated yet")
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("pipeline_stages", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




if __name__ == "__main__":
    import uvicorn
    # Defaulting to port 8000
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)
