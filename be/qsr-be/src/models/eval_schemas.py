from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from src.models.schemas import Scenario, Constraints, StaffingPlan

class OperatorEvalCase(BaseModel):
    """A single evaluation case for the Operator Agent"""
    id: str
    description: str
    scenario: Scenario
    constraints: Constraints
    operator_priority: str
    expected_focus: List[str] = Field(default_factory=list, description="Keywords expected in reasoning")
    max_labor_cost_threshold: Optional[float] = None

class OperatorEvalResult(BaseModel):
    """Result of evaluating a single case"""
    case_id: str
    passed: bool
    plan_generated: Optional[StaffingPlan] = None
    constraint_violations: List[str] = []
    priority_score: int = Field(ge=0, le=5, description="1-5 score from Judge LLM")
    reasoning_quality_score: int = Field(ge=0, le=5)
    judge_feedback: str
    error: Optional[str] = None

class OperatorEvalSummary(BaseModel):
    """Summary of an evaluation run"""
    model_config = {'protected_namespaces': ()}
    timestamp: str
    model_name: str
    total_cases: int
    passed_cases: int
    pass_rate: float
    avg_priority_score: float
    avg_reasoning_score: float
    results: List[OperatorEvalResult]

class JudgeScoring(BaseModel):
    """Internal model for judge scoring output"""
    priority_score: int = Field(ge=0, le=5)
    reasoning_score: int = Field(ge=0, le=5)
    feedback: str
