"""Scorer Agent - Evaluates and scores simulation outcomes"""

import json
from google import genai
from src.models.schemas import (
    Scenario, StaffingPlan, SimulationResult, 
    AlignmentTargets, Scores, ScoreDetails
)
from src.config.settings import settings
from src.utils.logger import setup_logger
from src.utils.llm_utils import retry_llm_call

logger = setup_logger(__name__)

class ScorerAgent:
    """
    Agent that evaluates simulation results based on target alignment.
    Scores represent proximity to operational targets (1.0 = Perfect match or Better).
    """
    
    def __init__(self):
        self.client = genai.Client(api_key=settings.google_api_key)
        self.system_prompt = self._build_system_prompt()
        
    def _build_system_prompt(self) -> str:
        return """You are a QSR Scoring Agent. Your goal is to evaluate if a staffing plan meets specific OPERATIONAL TARGETS.

ROLE: Analyze metrics and provide objective scores based on alignment with specified targets.

SCORING LOGIC (Proximity to Target):
- Score 1.0 = Perfect match or Performance is BETTER than target.
- Score < 1.0 = Performance deviates from target (worse).
- Score 0.0 = Unacceptable deviation.

1. PROFIT SCORING (Labor Cost %):
   - LOWER is Better.
   - If Actual <= Target: Score = 1.0
   - If Actual > Target: Score = Max(0, 1.0 - ((Actual - Target) / 10))  (Penalize 0.1 per 1% over)

2. CUSTOMER SATISFACTION (Avg Wait Time):
   - LOWER is Better.
   - If Actual <= Target: Score = 1.0
   - If Actual > Target: Score = Max(0, 1.0 - ((Actual - Target) / 60)) (Penalize 0.1 per 10s over)

3. STAFF WELLBEING (Utilization):
   - TARGET is Ideal Point. Deviation in EITHER direction is penalized.
   - Deviation = Abs(Actual - Target)
   - Score = Max(0, 1.0 - (Deviation / 0.15))

RANKING LOGIC:
- Consider the balance of all three scores.
- 0.95 - 1.00: "excellent" (All targets met or exceeded)
- 0.85 - 0.94: "very good" (Minor deviations)
- 0.70 - 0.84: "good" (Acceptable trade-offs)
- 0.50 - 0.69: "fair" (Significant misses)
- 0.00 - 0.49: "poor" (Critical failure)

IMPORTANT:
- Keep reasoning concise.
- Calculate 'deviation' field as the raw difference (Actual - Target).
- 'raw_score' is the calculated 0.0-1.0 score.
- DO NOT return an 'overall_score' field.
"""

    @retry_llm_call()
    def score_option(
        self,
        scenario: Scenario,
        option: StaffingPlan,
        simulation: SimulationResult,
        alignment_targets: AlignmentTargets
    ) -> Scores:
        """
        Score a single staffing option outcome against targets
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

ALIGNMENT TARGETS:
{alignment_targets.model_dump_json(indent=2)}

Evaluate the simulation outcomes against these targets.
Calculate proximity scores (1.0 = Target Met or Exceeded).
"""
            
            response = self.client.models.generate_content(
                model=settings.gemini_model,
                contents=[self.system_prompt, user_prompt],
                config={
                    "temperature": 0.4,
                    "max_output_tokens": 8192,
                    "response_mime_type": "application/json",
                    "response_json_schema": Scores.model_json_schema(),
                }
            )
            
            return Scores.model_validate_json(response.text)
        except Exception as e:
            logger.error(f"Scoring failed: {e}")
            # Attempt to parse partial JSON if possible, or return fallback
            # For now, just re-raise to trigger retry logic if available
            raise
