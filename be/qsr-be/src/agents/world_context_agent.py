"""World Context Agent - Analyzes environmental factors"""

import json
from google import genai
from typing import Dict, Any
from src.models.schemas import Scenario, DemandPrediction
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

CAPABILITIES:
- Estimate customer demand based on time, weather, events, location

LOGIC:
- Shift: Lunch (speed is critical), Dinner (larger family orders).
- Weather: Rain increases drive-thru (+25%) but decreases walk-in (-10%). Storms reduce total traffic significantly.
- Events: "friday_rush" (+30%), "game_day" (+40% wings/snacks), "holiday" (depends on type).
- Demand Estimation:
   - Base demand by shift: breakfast (40-80/hr), lunch (80-120/hr), dinner (70-110/hr)
   - Weather impact: rainy +25% drive-thru preference, -10% walk-in
   - Day multipliers: Friday/Saturday +20-30%, Sunday lunch +40%
   - Special events: festivals +30-50%, sports games +20-40%
   - Location: urban/downtown +20% lunch, suburban +15% dinner

"""

    def analyze_context(self, scenario: Scenario) -> DemandPrediction:
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
                    "response_mime_type": "application/json",
                    "response_json_schema": DemandPrediction.model_json_schema(),
                }
            )
            
            return DemandPrediction.model_validate_json(response.text)
            
        except Exception as e:
            logger.error(f"Context analysis failed: {e}")
            # Fallback default
            return DemandPrediction(
                estimated_total_demand=400,
                peak_demand_per_hour=100,
                demand_multiplier=1.0,
                channel_preference={"drive_thru": 1.0, "dine_in": 1.0, "delivery": 1.0},
                context_factors=["Analysis failed, using defaults"],
                reasoning="Fallback due to error"
            )
