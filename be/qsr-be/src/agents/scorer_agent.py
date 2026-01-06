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
   - Target: < 22% for 1.0 score.
   - Calculation: Max(0.01, 1.0 - (Labor Cost / Revenue - 0.15) * 3)
   - Logic: Efficiency above 22% starts degrading profit score quickly.

2. CUSTOMER SATISFACTION SCORING (Benchmark based on Avg Wait Time):
   - Target: < 120s for 1.0 score.
   - Calculation: Max(0.01, 1.0 - (Wait Time - 120) / 480)
   - Logic: Wait times above 10 mins (600s) drop to nearly 0.

3. STAFF WELLBEING (Benchmark based on Utilization):
   - Target: 0.75 is perfect (1.0).
   - Calculation: Max(0.01, 1.0 - Abs(Utilization - 0.75) * 4)
   - Logic: Below 0.5 (Idleness) or above 0.95 (Burnout) results in low scores.

SCORING FORMULA (Weighted Arithmetic Mean):
Rationale: We use a weighted arithmetic mean so that improvements in one area are directly visible in the overall score, while still respecting the importance of each objective via weights.

Formula:
Final Combined Score = (Profit_raw * Profit_weight) + (Customer_raw * Customer_weight) + (Staff_raw * Staff_weight)

Steps:
1. Determine raw scores (0.01 to 1.0) for each objective based on the benchmarks above.
2. Multiply each raw score by its respective alignment weight.
3. Sum the weighted scores to get the overall score.

RANKING LOGIC (Must follow strictly):
- 0.90 - 1.00: "excellent"
- 0.80 - 0.89: "very good"
- 0.70 - 0.79: "good"
- 0.60 - 0.69: "fair"
- 0.00 - 0.59: "poor"

Be analytical and data-driven. If a plan has better service metrics but higher costs, the CSAT score should rise while Profit may fall. Ensure the "recommendation" explains these trade-offs clearly.
"""

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
            
            response = self.client.models.generate_content(
                model=settings.gemini_model,
                contents=[self.system_prompt, user_prompt],
                config={
                    "temperature": settings.temperature * 0.5,  # Slightly lower for consistency
                    "max_output_tokens": settings.max_output_tokens,
                    "response_mime_type": "application/json",
                    "response_json_schema": Scores.model_json_schema(),
                }
            )
            
            return Scores.model_validate_json(response.text)
        except Exception as e:
            logger.error(f"Scoring failed: {e}")
            raise
