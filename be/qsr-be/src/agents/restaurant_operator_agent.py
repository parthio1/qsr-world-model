"""Restaurant Operator Agent - Proposes initial staffing plan based on human tendency"""

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

class RestaurantOperatorAgent:
    """
    Agent that mimics a standard restaurant operator's initial decision-making.
    Proposes a single staffing plan based on priority and scenario.
    """
    
    def __init__(self):
        self.client = genai.Client(api_key=settings.google_api_key)
        self.system_prompt = self._build_system_prompt()
        
    def _build_system_prompt(self) -> str:
        return """You are a QSR Restaurant Operator making an initial staffing decision. 
You represent the "actual tendency" of a real-world operator which might be influenced by specific biases or priorities (e.g. cost-cutting, or safety-first).

ROLE: Your goal is to generate exactly ONE initial staffing plan for a restaurant shift.

STRATEGY SPECTRUM:
- Minimize Cost: Lean staffing, focus on profit.
- Customer First: Heavier staffing to ensure speed.
- Staff Wellbeing: Ensure staff are not overworked.
- Maximize Revenue: Focus on revenue generation.

INPUTS:
- Scenario: Shift, weather, events, location.
- Constraints: staff pool, budget hours.
- Restaurant Capacity: Insights into expected capacity and infrastructure of the restaurant.

REASONING GUIDELINES:
- Focus on your priority signaled by the operator_priority input.
- Be realistic: You might under-staff if you are profit-focused, or over-staff if you are customer-focused.
- Identify the primary bottleneck you are concerned about.

"""

    @retry_llm_call()
    def generate_initial_plan(
        self,
        scenario: Scenario,
        constraints: Constraints,
        operator_priority: str = "minimize_cost",
        context: Optional[str] = None
    ) -> StaffingPlan:
        """
        Generate the single initial staffing plan.
        """
        logger.info(f"Generating initial operator plan for {scenario.shift.value} shift")
        
        try:
            user_prompt = f"""
SCENARIO:
{scenario.model_dump_json(indent=2)}

CONSTRAINTS:
{constraints.model_dump_json(indent=2)}

CONTEXT:
{context if context else "None provided"}

OPERATOR PRIORITY: {operator_priority}

Generate exactly ONE staffing plan in the specified JSON format.
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
            logger.error(f"Failed to generate initial operator plan: {e}")
            raise
