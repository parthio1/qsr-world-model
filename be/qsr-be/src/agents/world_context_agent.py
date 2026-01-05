"""World Context Agent - Analyzes environmental factors"""

import json
from google import genai
from typing import Dict, Any
from src.models.schemas import Scenario
from src.config.settings import settings
from src.utils.logger import setup_logger

logger = setup_logger(__name__)

class WorldContextAgent:
    """
    Agent that analyzes the environment (weather, time, events)
    to provide context modifiers for demand and operations.
    """
    
    def __init__(self):
        self.client = genai.Client(api_key=settings.google_api_key)
        self.system_prompt = self._build_system_prompt()
        
    def _build_system_prompt(self) -> str:
        return """You are a World Context Analyzer. Your job is to interpret environmental variables (Shift, Weather, Events, Location) and determine their impact on QSR demand and operations.

OUTPUT: A structured analysis of demand modifiers and operational alerts.

LOGIC:
- Shift: Lunch (speed is critical), Dinner (larger family orders).
- Weather: Rain increases drive-thru (+25%) but decreases walk-in (-10%). Storms reduce total traffic significantly.
- Events: "friday_rush" (+30%), "game_day" (+40% wings/snacks), "holiday" (depends on type).

Output Format (JSON):
{
  "demand_multiplier": <float, e.g. 1.2 for +20%>,
  "channel_preference": {
    "drive_thru": <float modifier>,
    "dine_in": <float modifier>,
    "delivery": <float modifier>
  },
  "context_factors": [
    "Heavy rain suggests shifted demand to drive-thru",
    "Friday rush implies high peak load at 6PM"
  ]
}
"""

    def analyze_context(self, scenario: Scenario) -> Dict[str, Any]:
        """
        Analyze the scenario to produce context modifiers.
        """
        logger.info(f"Analyzing context for {scenario.shift.value} on {scenario.day_of_week}")
        
        try:
            user_prompt = f"""
SCENARIO:
{scenario.model_dump_json(indent=2)}

Analyze the environmental impact on demand and operations.
"""
            response = self.client.models.generate_content(
                model=settings.gemini_model,
                contents=[self.system_prompt, user_prompt],
                config={
                    "temperature": 0.2, # Low temp for analytical consistency
                    "max_output_tokens": 1024,
                }
            )
            
            result_text = response.text.strip()
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
                
            return json.loads(result_text)
            
        except Exception as e:
            logger.error(f"Context analysis failed: {e}")
            # Fallback default
            return {
                "demand_multiplier": 1.0,
                "channel_preference": {"drive_thru": 1.0, "dine_in": 1.0},
                "context_factors": ["Analysis failed, using defaults"]
            }
