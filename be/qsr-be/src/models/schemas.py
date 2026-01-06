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
    min_staff_per_station: Dict[str, int] = {
        "drive_thru": 2,
        "kitchen": 3,
        "front_counter": 1
    }

class AlignmentTargets(BaseModel):
    """Operational targets for the shift"""
    target_labor_cost_percent: float = Field(default=30.0, description="Ideal labor cost percentage (e.g., 30.0)")
    target_wait_time_seconds: int = Field(default=180, description="Ideal average wait time in seconds (e.g., 180)")
    target_staff_utilization: float = Field(default=0.82, description="Ideal staff utilization rate (0.0-1.0)")

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
    """A staffing plan option produced by an operator agent"""
    id: str = Field(description="Unique identifier for the plan, e.g. 'initial_plan' or 'optimized_v1'")
    strategy: str = Field(description="Short title describing the operational strategy, e.g. 'Lean Lunch'")
    estimated_total_guest: int = Field(description="Total number of guests expected to be served")
    estimated_peak_guest: int = Field(description="Maximum guests per hour during peak")
    staffing: Staffing = Field(description="Allocation of staff to different stations")
    estimated_labor_cost: float = Field(description="Total labor cost for the shift duration")
    risk_level: RiskLevel = Field(description="Operational risk level of this staffing arrangement")
    rationale: str = Field(description="A concise summary of why this plan was chosen")
    reasoning: Optional[str] = Field(None, description="Detailed Chain-of-Thought (CoT) reasoning for the decision")

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
    """Output from the World Model simulator predicting shift outcome"""
    predicted_metrics: PredictedMetrics = Field(description="Key-value metrics predicted for the shift")
    key_events: List[str] = Field(default_factory=list, description="Timeline of significant simulated events")
    bottlenecks: List[str] = Field(default_factory=list, description="Specific operational bottlenecks found during simulation")
    confidence: float = Field(ge=0, le=1, description="Confidence score in the simulation accuracy (0.0 to 1.0)")
    reasoning: Optional[str] = Field(None, description="Detailed explanation of the simulation logic and assumptions")

class ScoreDetails(BaseModel):
    """Detailed score breakdown"""
    raw_score: float = Field(ge=0, le=1, description="Proximity to target (1.0 = exact hit, 0.0 = far off)")
    deviation: float = Field(description="Absolute deviation from target")
    weighted: float = Field(description="Visual score (redundant but kept for FE compatibility)")
    details: Dict

class Scores(BaseModel):
    """Multi-objective evaluation scores for a staffing option"""
    profit: ScoreDetails = Field(description="Financial target alignment")
    customer_satisfaction: ScoreDetails = Field(description="Guest experience target alignment")
    staff_wellbeing: ScoreDetails = Field(description="Operational load target alignment")
    ranking: str = Field(description="Qualitative rank: excellent, very good, good, fair, poor")
    strengths: List[str] = Field(default_factory=list, description="Successes identified in the plan")
    weaknesses: List[str] = Field(default_factory=list, description="Pain points or imbalances identified")
    recommendation: str = Field(description="Actionable advice for refining the plan")
    reasoning: Optional[str] = Field(None, description="Explanation of the scoring mathematics and trade-offs")

class EvaluationResult(BaseModel):
    """Post-execution evaluation"""
    model_config = {'protected_namespaces': ()}
    accuracy_analysis: Dict[str, str]
    error_analysis: List[Dict]
    root_causes: List[str]
    model_improvements: List[Dict]
    decision_quality: Dict
    learning_summary: str

class DemandPrediction(BaseModel):
    """Estimated customer demand from World Context Agent"""
    estimated_total_demand: int = Field(description="Sum of all guests expected over the entire shift")
    peak_demand_per_hour: int = Field(description="Maximum guests per hour during the busiest window")
    demand_multiplier: float = Field(description="Contextual multiplier (e.g. 1.2 for +20% demand)")
    channel_preference: Dict[str, float] = Field(description="Modifier for channel preference (drive_thru, dine_in, delivery)")
    context_factors: List[str] = Field(description="List of environmental factors impacting demand")
    reasoning: Optional[str] = Field(None, description="Detailed explanation for why this demand profile was chosen")

class CapacityAnalysis(BaseModel):
    """Restaurant infrastructure capacity breakdown from Restaurant Agent"""
    max_throughput_per_hour: int = Field(description="Maximum theoretically possible orders per hour")
    station_capacities: Dict[str, int] = Field(description="Max throughput per hour per station (kitchen, drive_thru, front_counter)")
    bottleneck_risk_areas: List[str] = Field(description="Physical areas most likely to fail under high demand")
    reasoning: Optional[str] = Field(None, description="Detailed explanation of capacity calculation logic")

# ===== COMPLETE WORKFLOW MODELS =====

class PlanningRequest(BaseModel):
    """Complete planning request"""
    scenario: Scenario
    constraints: Optional[Constraints] = None
    alignment_targets: Optional[AlignmentTargets] = None
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
    demand_prediction: Optional[DemandPrediction] = None
    capacity_analysis: Optional[CapacityAnalysis] = None
    restaurant_operator_plan: Optional[OptionEvaluation] = None
    shadow_operator_best_plan: Optional[OptionEvaluation] = None
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
