"""Data models and schemas for QSR World Model"""

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Literal
from datetime import datetime, date
from enum import Enum

# ===== ENUMS =====

class ShiftType(str, Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"

class WeatherType(str, Enum):
    SUNNY = "sunny"
    CLOUDY = "cloudy"
    RAINY = "rainy"
    STORMY = "stormy"

class RiskLevel(str, Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"

# ===== INPUT MODELS =====

class RestaurantConfig(BaseModel):
    """Restaurant infrastructure configuration"""
    location: str
    has_drive_thru: bool = True
    drive_thru_lanes: Optional[int] = Field(default=2, ge=1, le=4)
    kitchen_staff_capacity: Literal["small", "medium", "large"] = "medium"
    dine_in: bool = True
    dine_in_seat_capacity: Optional[int] = Field(default=50, ge=0)

class Scenario(BaseModel):
    """Operational scenario definition"""
    shift: ShiftType 
    date: date
    day_of_week: str
    weather: WeatherType
    special_events: List[str] = []
    restaurant: RestaurantConfig
    
    @validator('day_of_week')
    def validate_day(cls, v):
        valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        if v.lower() not in valid_days:
            raise ValueError(f'day_of_week must be one of {valid_days}')
        return v.lower()

class Constraints(BaseModel):
    """Operational constraints"""
    available_staff: int = Field(ge=1)
    budget_hours: float = Field(ge=0)
    min_staff_per_station: Dict[str, int] = {
        "drive_thru": 2,
        "kitchen": 3,
        "front_counter": 1
    }

class AlignmentWeights(BaseModel):
    """Multi-objective optimization weights"""
    profit: float = Field(default=0.40, ge=0, le=1)
    customer_satisfaction: float = Field(default=0.35, ge=0, le=1)
    staff_wellbeing: float = Field(default=0.25, ge=0, le=1)
    
    @validator('staff_wellbeing')
    def validate_sum(cls, v, values):
        total = values.get('profit', 0) + values.get('customer_satisfaction', 0) + v
        if not (0.99 <= total <= 1.01):  # Allow small floating point errors
            raise ValueError('Alignment weights must sum to 1.0')
        return v

# ===== OUTPUT MODELS =====

class Staffing(BaseModel):
    """Staffing allocation"""
    drive_thru: int = Field(ge=0)
    kitchen: int = Field(ge=0)
    front_counter: int = Field(ge=0)
    total: int = 0
    
    @validator('total', always=True)
    def calculate_total(cls, v, values):
        return values.get('drive_thru', 0) + values.get('kitchen', 0) + values.get('front_counter', 0)

class StaffingPlan(BaseModel):
    """A staffing plan option"""
    id: str
    strategy: str
    estimated_total_guest: int
    estimated_peak_guest: int
    staffing: Staffing
    estimated_labor_cost: float
    risk_level: RiskLevel
    rationale: str
    reasoning: Optional[str] = None

class PredictedMetrics(BaseModel):
    """Predicted operational metrics"""
    customers_served: int = Field(ge=0)
    revenue: float = Field(ge=0)
    avg_wait_time_seconds: int = Field(ge=0)
    peak_wait_time_seconds: Optional[int] = Field(ge=0)
    max_queue_length: int = Field(ge=0)
    labor_cost: float = Field(ge=0)
    food_cost: float = Field(ge=0)
    staff_utilization: float = Field(ge=0, le=1)
    order_accuracy: float = Field(ge=0, le=1)

class SimulationResult(BaseModel):
    """World model simulation output"""
    predicted_metrics: PredictedMetrics
    key_events: List[str] = []
    bottlenecks: List[str] = []
    confidence: float = Field(ge=0, le=1)
    reasoning: Optional[str] = None

class ScoreDetails(BaseModel):
    """Detailed score breakdown"""
    raw_score: float = Field(ge=0, le=1)
    weighted: float
    details: Dict

class Scores(BaseModel):
    """Multi-objective scores"""
    profit: ScoreDetails
    customer_satisfaction: ScoreDetails
    staff_wellbeing: ScoreDetails
    overall_score: float = Field(ge=0, le=1)
    ranking: str
    strengths: List[str] = []
    weaknesses: List[str] = []
    recommendation: str
    reasoning: Optional[str] = None

class EvaluationResult(BaseModel):
    """Post-execution evaluation"""
    accuracy_analysis: Dict[str, str]
    error_analysis: List[Dict]
    root_causes: List[str]
    model_improvements: List[Dict]
    decision_quality: Dict
    learning_summary: str

# ===== COMPLETE WORKFLOW MODELS =====

class PlanningRequest(BaseModel):
    """Complete planning request"""
    scenario: Scenario
    constraints: Optional[Constraints] = None
    alignment_weights: Optional[AlignmentWeights] = None
    operator_priority: Literal["balanced", "profit_focus", "service_focus"] = "balanced"

class OptionEvaluation(BaseModel):
    """Evaluation of a single staffing option"""
    option: StaffingPlan
    simulation: SimulationResult
    scores: Scores

class IterationTrace(BaseModel):
    """Trace data for a single reasoning iteration"""
    iteration_number: int
    evaluations: List[OptionEvaluation]
    feedback: Optional[str] = None

class PlanningResponse(BaseModel):
    """Complete planning response"""
    request_id: str
    timestamp: datetime
    scenario: Scenario
    options_evaluated: Optional[List[OptionEvaluation]] = None
    best_decision: Optional[OptionEvaluation] = None
    iterations: List[IterationTrace] = []
    execution_time_seconds: float


class ActualPerformanceData(BaseModel):
    """Actual performance data from operations"""
    customers_served: int
    revenue: float
    avg_wait_time_seconds: int
    labor_cost: float
    reported_issues: List[str] = []

class EvaluationRequest(BaseModel):
    """Request to evaluate a completed shift"""
    planning_response: PlanningResponse
    actual_data: ActualPerformanceData

class EvaluationResponse(BaseModel):
    """Evaluation response comparing predicted vs actual"""
    request_id: str
    timestamp: datetime
    evaluation: EvaluationResult
    prediction_quality: Literal["excellent", "good", "fair", "poor"]
