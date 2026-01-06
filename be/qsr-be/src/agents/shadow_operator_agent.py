"""Shadow Operator Agent - Refines staffing plans based on feedback"""

import json
from google import genai
from typing import Optional
from src.models.schemas import (
    Scenario, Constraints, StaffingPlan, Staffing, RiskLevel
)
from src.config.settings import settings
from src.utils.logger import setup_logger
from src.utils.llm_utils import retry_llm_call

logger = setup_logger(__name__)

class ShadowOperatorAgent:
    """
    Agent that acts as a Rational Optimizer (Shadow Operator).
    It takes feedback from the Scorer and World Model to refine the staffing plan.
    """
    
    def __init__(self):
        self.client = genai.Client(api_key=settings.google_api_key)
        self.system_prompt = self._build_system_prompt()
        
    def _build_system_prompt(self) -> str:
        return """You are the Shadow Operator Agent, a "Rational Optimizer". 
Your goal is to optimize the restaurant staffing plan to achieve perfect alignment with business objectives (Profit, Customer Satisfaction, Staff Wellbeing).

ROLE: Refine the provided staffing plan based on simulation feedback and scoring results.

CAPABILITIES:
- Address operational bottlenecks identified by the World Model.
- Mitigate weaknesses flagged by the Scorer Agent.
- Propose a single, highly-optimized staffing plan that outperforms the previous attempt.

INPUTS:
- Scenario & Constraints.
- Context: Demand and Capacity analysis.
- Previous Plan: The plan from the last iteration.
- Feedback: Critical analysis of why the previous plan failed or underperformed.

REASONING GUIDELINES:
- Use internal logic to re-allocate staff where they are needed most (e.g. if Drive-thru is the bottleneck, move staff from front counter).
- Balance labor cost against revenue loss from abandonment.
- Ensure staff wellbeing is maintained to prevent burnout.

"""

    @retry_llm_call()
    def generate_refined_plan(
        self,
        scenario: Scenario,
        constraints: Constraints,
        feedback: str,
        previous_plan: StaffingPlan,
        context: Optional[str] = None
    ) -> StaffingPlan:
        """
        Produce a single refined plan based on feedback.
        """
        logger.info(f"Shadow Operator refining plan for {scenario.shift.value}")
        
        try:
            user_prompt = f"""
SCENARIO:
{scenario.model_dump_json(indent=2)}

CONSTRAINTS:
{constraints.model_dump_json(indent=2)}

CONTEXT:
{context if context else "None provided"}

PREVIOUS PLAN:
{previous_plan.model_dump_json(indent=2)}

FEEDBACK FOR IMPROVEMENT:
{feedback}

Generate ONE refined staffing plan that addresses the feedback.
"""
            response = self.client.models.generate_content(
                model=settings.gemini_model,
                contents=[self.system_prompt, user_prompt],
                config={
                    "temperature": settings.temperature,
                    "max_output_tokens": 8192,
                    "response_mime_type": "application/json",
                    "response_json_schema": StaffingPlan.model_json_schema(),
                }
            )
            
            return StaffingPlan.model_validate_json(response.text)
            
        except Exception as e:
            logger.error(f"Shadow Operator refinement failed: {e}")
            raise
