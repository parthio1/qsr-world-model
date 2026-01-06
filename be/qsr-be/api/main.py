"""FastAPI application for QSR World Model"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
from pathlib import Path
from datetime import datetime
from src.coordinator.orchestrator import QSROrchestrator
from src.models.schemas import (
    PlanningRequest, PlanningResponse,
    EvaluationRequest, EvaluationResponse
)
from src.config.settings import settings
from src.utils.logger import setup_logger
from src.utils.llm_utils import LLMQuotaError, LLMServiceError
from pydantic import ValidationError

logger = setup_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="QSR World Model API",
    description="AI-powered QSR operations planning and evaluation",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(LLMQuotaError)
async def llm_quota_exception_handler(request, exc: LLMQuotaError):
    return JSONResponse(
        status_code=429,
        content={"detail": "The AI model is currently overloaded. Please wait a moment and try again.", "error_type": "quota_exceeded"},
    )

@app.exception_handler(LLMServiceError)
async def llm_service_exception_handler(request, exc: LLMServiceError):
    return JSONResponse(
        status_code=503,
        content={"detail": "AI Service is temporarily unavailable. Please try again later.", "error_type": "service_unavailable"},
    )

@app.exception_handler(ValidationError)
async def validation_exception_handler(request, exc: ValidationError):
    logger.error(f"Validation Error: {exc}")
    return JSONResponse(
        status_code=422,
        content={"detail": "The AI generated an invalid response format. Please retry.", "error_type": "parsing_error"},
    )

# Initialize orchestrator
orchestrator = QSROrchestrator()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "QSR World Model API",
        "status": "operational",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "agents": {
            "world_model": "ready",
            "decision_maker": "ready",
            "scorer": "ready",
            "evaluator": "ready"
        },
        "configuration": {
            "model": settings.gemini_model,
#          "temperature": settings.temperature
        }
    }

@app.post("/api/v1/plan", response_model=PlanningResponse)
async def plan_shift(request: PlanningRequest):
    """
    Generate optimal staffing plan for a shift
    
    This endpoint:
    1. Generates multiple staffing options
    2. Simulates each option's outcomes
    3. Scores options on profit, customer satisfaction, staff wellbeing
    4. Returns the best option with full analysis
    """
    try:
        logger.info(f"Received planning request for {request.scenario.shift.value} shift")
        
        # Execute planning
        response = orchestrator.plan_shift(request)
        
        # Save result
        result_file = Path(settings.results_dir) / f"plan_{response.request_id}.json"
        with open(result_file, 'w') as f:
            json.dump(response.model_dump(mode='json'), f, indent=2, default=str)
        
        logger.info(f"Planning complete, saved to {result_file}")
        return response
        
    except Exception as e:
        logger.error(f"Planning failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/evaluate", response_model=EvaluationResponse)
async def evaluate_shift(request: EvaluationRequest):
    """
    Evaluate a completed shift by comparing prediction vs actual
    
    This endpoint:
    1. Compares AI predictions against actual performance
    2. Calculates prediction errors
    3. Identifies root causes
    4. Suggests model improvements
    """
    try:
        logger.info(f"Received evaluation request for plan {request.planning_response.request_id}")
        
        # Execute evaluation
        response = orchestrator.evaluate_shift(request)
        
        # Save result
        result_file = Path(settings.results_dir) / f"eval_{response.request_id}.json"
        with open(result_file, 'w') as f:
            json.dump(response.model_dump(mode='json'), f, indent=2, default=str)
        
        logger.info(f"Evaluation complete, saved to {result_file}")
        return response
        
    except Exception as e:
        logger.error(f"Evaluation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/results/{request_id}")
async def get_result(request_id: str):
    """Retrieve a previously saved planning or evaluation result"""
    try:
        # Try planning result
        plan_file = Path(settings.results_dir) / f"plan_{request_id}.json"
        if plan_file.exists():
            with open(plan_file, 'r') as f:
                return json.load(f)
        
        # Try evaluation result
        eval_file = Path(settings.results_dir) / f"eval_{request_id}.json"
        if eval_file.exists():
            with open(eval_file, 'r') as f:
                return json.load(f)
        
        raise HTTPException(status_code=404, detail=f"Result not found: {request_id}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve result: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/results")
async def list_results(limit: int = 10):
    """List recent planning results"""
    try:
        results_dir = Path(settings.results_dir)
        plan_files = sorted(results_dir.glob("plan_*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
        
        results = []
        for plan_file in plan_files[:limit]:
            with open(plan_file, 'r') as f:
                data = json.load(f)
                results.append({
                    "request_id": data["request_id"],
                    "timestamp": data["timestamp"],
                    "shift": data["scenario"]["shift"],
                    "best_score": data["shadow_operator_best_plan"]["scores"]["overall_score"],
                    "file": plan_file.name
                })
        
        return {"results": results, "total": len(results)}
        
    except Exception as e:
        logger.error(f"Failed to list results: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    import argparse

    parser = argparse.ArgumentParser(description="Run the QSR World Model API")
    parser.add_argument("--host", default=settings.api_host, help="Host to bind to")
    parser.add_argument("--port", type=int, default=settings.api_port, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", default=settings.api_reload, help="Enable auto-reload")
    
    args = parser.parse_args()

    uvicorn.run(
        "api.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level=settings.log_level.lower()
    )
