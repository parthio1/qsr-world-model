"""Scorer Agent - Evaluates and scores simulation outcomes"""

import json
from google import genai
from src.models.schemas import (
    Scenario, StaffingPlan, SimulationResult, 
    AlignmentWeights, Scores, ScoreDetails
)
from src.config.settings import settings
from src.utils.logger import setup_logger

logger = setup_logger(__name__)

class ScorerAgent:
    """
    Agent that evaluates simulation results based on multi-objective 
    criteria: profit, customer satisfaction, and staff wellbeing.
    """
    
    def __init__(self):
        self.client = genai.Client(api_key=settings.google_api_key)
        self.system_prompt = self._build_system_prompt()
        
    def _build_system_prompt(self) -> str:
        return """You are a QSR Scoring Agent. Your goal is to evaluate a staffing option's simulation results and provide detailed scores (0.0 to 1.0).

ROLE: Analyze metrics and provide objective scores based on multi-objective alignment weights.

SCORING CRITERIA:

1. PROFIT SCORING (Benchmark based on Labor Cost %):
   - Formula: Labor Cost / Revenue
   - < 20%: Raw Score 0.9 - 1.0 (Excellent Efficiency)
   - 20% - 25%: Raw Score 0.7 - 0.8 (Healthy)
   - 25% - 30%: Raw Score 0.5 - 0.6 (Acceptable)
   - > 30%: Raw Score 0.0 - 0.4 (Unprofitable/High Risk)

2. CUSTOMER SATISFACTION SCORING (Benchmark based on Avg Wait Time):
   - < 180s (3 min): Raw Score 0.9 - 1.0 (Excellent)
   - 180s - 300s (5 min): Raw Score 0.6 - 0.8 (Tolerable)
   - 300s - 400s: Raw Score 0.3 - 0.5 (Frustrating)
   - > 400s: Raw Score 0.0 - 0.2 (Unacceptable churn risk)

3. STAFF WELLBEING (Benchmark based on Utilization):
   - 0.70 - 0.85: Raw Score 0.9 - 1.0 (Optimal "Flow" State)
   - 0.60 - 0.69 or 0.86 - 0.90: Raw Score 0.6 - 0.8 (Sub-optimal)
   - < 0.60 (Idle) or > 0.90 (Burnout): Raw Score 0.0 - 0.4 (High Risk)

SCORING FORMULA (Weighted Geometric Mean):
Rationale: We use a geometric mean to penalize imbalance. A low score in any single dimension will drastically reduce the overall score, ensuring a "balanced" plan is selected over one that maximizes only one variable at the cost of others.

Formula:
Final Combined Score = (Profit_raw ^ Profit_weight) * (Customer_raw ^ Customer_weight) * (Staff_raw ^ Staff_weight)

Steps:
1. Determine raw scores (0.01 to 1.0) for each objective. (Use 0.01 as floor to avoid math errors).
2. Raise each raw score to the power of its respective weight (e.g., 0.8 ^ 0.4).
3. Multiply the results together.

Example: 
P=0.9 (w=0.4), C=0.4 (w=0.4), S=0.9 (w=0.2)
- Linear Average: 0.70 (Seems "Good")
- Geometric Mean: ~0.63 (Reflects the "Failure" in Customer Satisfaction)

RANKING LOGIC (Must follow strictly):
- 0.90 - 1.00: "excellent"
- 0.80 - 0.89: "very good"
- 0.70 - 0.79: "good"
- 0.60 - 0.69: "fair"
- 0.00 - 0.59: "poor"

OUTPUT FORMAT (JSON):
{
  "profit": {
    "raw_score": <float 0-1>,
    "weighted": <float>,
    "details": { "margin": <float>, "labor_ratio": <float> }
  },
  "customer_satisfaction": {
    "raw_score": <float 0-1>,
    "weighted": <float>,
    "details": { "avg_wait_s": <int>, "service_rate": <float> }
  },
  "staff_wellbeing": {
    "raw_score": <float 0-1>,
    "weighted": <float>,
    "details": { "avg_utilization": <float>, "burnout_risk": <str> }
  },
  "combined_score": <float 0-1>,
  "ranking": "excellent" | "very good" | "good" | "fair" | "poor",
  "strengths": [<str>, ...],
  "weaknesses": [<str>, ...],
  "recommendation": <str>,
  "reasoning": "Detailed agentic reasoning explaining the mathematical breakdown, trade-off analysis, and alignment justification using a Chain of Thought framework."
}

Be analytical and data-driven in your evaluation."""

    def score_option(
        self,
        scenario: Scenario,
        option: StaffingPlan,
        simulation: SimulationResult,
        alignment_weights: AlignmentWeights
    ) -> Scores:
        """
        Score a single staffing option outcome
        """
        logger.info(f"Scoring option: {option.id}")
        
        try:
            # Build prompt
            user_prompt = f"""
SCENARIO:
{scenario.model_dump_json(indent=2)}

STAFFING OPTION:
{option.model_dump_json(indent=2)}

SIMULATION RESULTS:
{simulation.model_dump_json(indent=2)}

ALIGNMENT WEIGHTS:
{alignment_weights.model_dump_json(indent=2)}

Evaluate the simulation outcomes against the criteria and alignment weights.
Return the scores in the specified JSON format.
"""
            
            # Generate response
            response = self.client.models.generate_content(
                model=settings.gemini_model,
                contents=[self.system_prompt, user_prompt],
                config={
                    "temperature": settings.temperature * 0.5,  # Slightly lower for consistency
                    "max_output_tokens": settings.max_output_tokens,
                }
            )
            
            # Parse response
            result_text = response.text.strip()
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            result_dict = json.loads(result_text)
            
            # Convert to Pydantic model
            scores = Scores(
                profit=ScoreDetails(**result_dict["profit"]),
                customer_satisfaction=ScoreDetails(**result_dict["customer_satisfaction"]),
                staff_wellbeing=ScoreDetails(**result_dict["staff_wellbeing"]),
                overall_score=result_dict.get("combined_score", 0.0),
                ranking=result_dict["ranking"],
                strengths=result_dict.get("strengths", []),
                weaknesses=result_dict.get("weaknesses", []),
                recommendation=result_dict.get("recommendation", ""),
                reasoning=result_dict.get("reasoning")
            )
            
            logger.info(f"Scoring complete for {option.id}: {scores.overall_score:.3f}")
            logger.info(f"Scores: {scores}")
            return scores
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse scorer result: {e}")
            logger.error(f"Raw response: {response.text}")
            raise ValueError(f"Invalid JSON response from model: {e}")
        except Exception as e:
            logger.error(f"Scoring failed: {e}")
            raise
