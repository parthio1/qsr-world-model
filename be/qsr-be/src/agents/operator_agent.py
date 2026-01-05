"""Decision Maker Agent - Generates staffing options for evaluation"""

import json
from google import genai
from typing import List, Optional
from src.models.schemas import (
    Scenario, Constraints, StaffingPlan, Staffing, RiskLevel
)
from src.config.settings import settings
from src.utils.logger import setup_logger

logger = setup_logger(__name__)

class OperatorAgent:
    """
    Agent that generates multiple potential staffing strategies 
    based on the scenario and constraints.
    """
    
    def __init__(self):
        self.client = genai.Client(api_key=settings.google_api_key)
        self.system_prompt = self._build_system_prompt()
        
    def _build_system_prompt(self) -> str:
        return """You are a QSR Operator making staffing decisions. You have varying priorities that requires trade-offs between revenue, profit, customer experience and staff wellbeing. 
        
ROLEL: Your goal is to generate either a single staffing plan option or maximum of 3 distinct staffing plan options for a restaurant shift by reasoning through scenario, restaurant specs, constraints and operator priority.

STRATEGY SPECTRUM:
1. Conservative (Lean): Minimum staffing to meet basic needs, maximizing profit but risking wait times.
2. Balanced: Standard staffing for expected demand, balancing all objectives.
3. Aggressive (Growth): Optimal staffing for peak performance and customer experience, higher labor cost.

INPUTS:
- Scenario: Shift, weather, events, location, restaurant specs.
- Constraints: Maximum available staff pool, Maximum staff budget hours.
- Priority: The operator's primary goal (balanced, minimize_cost, customer_first, staff_wellbeing, maximize_profit, maximize_revenue).

CONSTRAINTS:
- Total staff deployed cannot exceed 'available_staff'.
- Operator does't have control of the customer traffic or demand generation. They only have control of the staffing and staff allocation to drive_thru, kitchen, and front_counter. 
- Standard shift duration is 8 hours.
- Staff must be allocated to: drive_thru, kitchen, front_counter.
- Minimum (usual) staffing required per restaurant station: 1 front_counter, 2 drive_thru, 3 kitchen.
- Staffing hours cannot exceed 'max_staff_hours'.

REASONING GUIDELINES (Chain of Thought):
Before providing the JSON, perform the following reasoning steps:
- UNDERSTAND OPERATOR PRIORITY: Understand and analyze the operator's priroties (balanced, minimize_cost, customer_first, staff_wellbeing, maximize_profit, maximize_revenue). This is the primary goal of the operator that should be met while meeting other constraints.
- ANALYZE OPERATIONAL SCENARIO: Analyze the demand scenario, restraunt specification and constraints in order to decide the staff allocation to each station.
- BOTTLENECK IDENTIFICATION: Which station is the likely failure point in this scenario considering the demand scenario, restraunt specification and constraints?
- REASON TRADE-OFFS TO MEET OPERATOR PRIORITY: In addition to revenue and profit management, customer experience and staff wellbeing needs to be considered as par of trade-offs. Why are you moving staff from one station to another to mitigate those stresses while meeting operator priorities? 
- RISK ANALYSIS: What are the potential risks associated with this staffing strategy? (e.g., "High risk of staff burnout if we under-staff the kitchen" or "High risk of customer dissatisfaction if we increase the customer wait times and under-staff the drive-thru").
- STAFF ALLOCATION: Give the staff allocation plan to each station for a given shift.
- ESTIMATED LABOR COST: Calculate the estimated labor cost for the given shift.

OUTPUT FORMAT (JSON):
[
  {
    "id": "strategy_name_short",
    "strategy": "Full strategy name",
    "staffing": {
      "drive_thru": <int>,
      "kitchen": <int>,
      "front_counter": <int>
    },
    "estimated_labor_cost": <float>,
    "risk_level": "very_low" | "low" | "medium" | "high" | "very_high",
    "rationale": "Why this allocation makes sense for the strategy",
    "reasoning": "Detailed agentic reasoning explaining the trade-offs and bottleneck analysis using a Chain of Thought framework."
  },
  ...
]

Be realistic. QSR staffing usually ranges from 5 to 20 people per shift depending on size."""

    def generate_staffing_plan(
        self,
        scenario: Scenario,
        constraints: Constraints,
        operator_priority: str = "balanced",
        context: Optional[str] = None,
        feedback: Optional[str] = None
    ) -> List[StaffingPlan]:
        """
        Generate 3-5 distinct staffing options
        """
        logger.info(f"Generating staffing options for {scenario.shift.value} shift")
        
        try:
            # Build prompt
            # Build parts
            context_part = f"ADDITIONAL CONTEXT:\n{context}" if context else ""
            feedback_part = f"PREVIOUS ATTEMPT FEEDBACK (Refine plan based on this):\n{feedback}" if feedback else ""
            
            user_prompt = f"""
SCENARIO:
{scenario.model_dump_json(indent=2)}

CONTEXT & CONSTRAINTS:
{constraints.model_dump_json(indent=2)}
{context_part}

OPERATOR PRIORITY: {operator_priority}

{feedback_part}

Generate 1 distinct staffing option. In case, more than 1 staffing options are generated, order them by total staff ascending.
Return the option in the specified JSON format.
"""
            
            # Generate response
            response = self.client.models.generate_content(
                model=settings.gemini_model,
                contents=[self.system_prompt, user_prompt],
                config={
                    "temperature": settings.temperature,
                    "max_output_tokens": settings.max_output_tokens,
                }
            )
            
            # Parse response
            result_text = response.text.strip()
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            options_list = json.loads(result_text)
            
            # Convert to Pydantic models
            options = []
            for opt_data in options_list:
                # Ensure total is calculated correctly in Staffing model
                staffing = Staffing(**opt_data["staffing"])
                # We need to manually add total because our schema might expect it if not using computed fields
                # Actually our Staffing model has a validator for total
                
                option = StaffingPlan(
                    id=opt_data["id"],
                    strategy=opt_data["strategy"],
                    estimated_total_guest=opt_data.get("estimated_total_guest", 100),
                    estimated_peak_guest=opt_data.get("estimated_peak_guest", 30),
                    staffing=staffing,
                    estimated_labor_cost=opt_data["estimated_labor_cost"],
                    risk_level=RiskLevel(opt_data["risk_level"]),
                    rationale=opt_data["rationale"],
                    reasoning=opt_data.get("reasoning")
                )
                options.append(option)
            
            # Sort by total staff to ensure they are ascending as expected by tests
            options.sort(key=lambda x: x.staffing.total)
            
            logger.info(f"Generated {len(options)} staffing options")
            return options
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse decision maker result: {e}")
            logger.error(f"Raw response: {response.text}")
            raise ValueError(f"Invalid JSON response from model: {e}")
        except Exception as e:
            logger.error(f"Option generation failed: {e}")
            raise
