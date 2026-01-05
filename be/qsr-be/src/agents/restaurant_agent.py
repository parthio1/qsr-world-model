"""Restaurant Model Agent - Analyzes restaurant capabilities"""

import json
from google import genai
from typing import Dict, Any
from src.models.schemas import RestaurantConfig
from src.config.settings import settings
from src.utils.logger import setup_logger

logger = setup_logger(__name__)

class RestaurantModelAgent:
    """
    Agent that acts as the 'Digital Twin' of the specific restaurant location.
    It interprets infrastructure capabilities and constraints.
    """
    
    def __init__(self):
        self.client = genai.Client(api_key=settings.google_api_key)
        self.system_prompt = self._build_system_prompt()
        
    def _build_system_prompt(self) -> str:
        return """You are the Restaurant Infrastructure Model. Your job is to calculate maximum theoretical throughput and operational constraints based on physical specs.

INPUT: Restaurant configuration (kitchen size, drive-thru lanes, seating).

OUTPUT: Operational capacity metrics.

LOGIC:
- Kitchen Capacity: 'small' (40 orders/hr), 'medium' (80 orders/hr), 'large' (120+ orders/hr).
- Drive-Thru: 30 cars/hr per lane (optimal conditions).
- Dine-In: Seating capacity * turnover rate (approx 1 hr).

Output Format (JSON):
{
  "max_throughput_per_hour": <int>,
  "station_capacities": {
    "kitchen": <int orders/hr>,
    "drive_thru": <int cars/hr>,
    "dine_in": <int guests/hr>
  },
  "infrastructure_constraints": [
    "Limited by small kitchen size",
    "High drive-thru capacity available"
  ]
}
"""

    def analyze_capacity(self, config: RestaurantConfig) -> Dict[str, Any]:
        """
        Analyze the restaurant's physical capacity limits.
        """
        logger.info(f"Analyzing capacity for {config.location}")
        
        try:
            user_prompt = f"""
RESTAURANT CONFIG:
{config.model_dump_json(indent=2)}

Calculate the operational capacity limits.
"""
            response = self.client.models.generate_content(
                model=settings.gemini_model,
                contents=[self.system_prompt, user_prompt],
                config={
                    "temperature": 0.2,
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
            logger.error(f"Capacity analysis failed: {e}")
            return {
                "max_throughput_per_hour": 100,
                "station_capacities": {"kitchen": 80, "drive_thru": 60, "dine_in": 50},
                "infrastructure_constraints": ["Default fallback capacities used"]
            }
