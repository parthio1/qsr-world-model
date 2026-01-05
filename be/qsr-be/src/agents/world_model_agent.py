"""World Model Simulator Agent"""

import json
from google import genai
from typing import Dict
from src.models.schemas import Scenario, Staffing, SimulationResult, PredictedMetrics
from src.config.settings import settings
from src.utils.logger import setup_logger

logger = setup_logger(__name__)

class WorldModelAgent:
    """
    Agent that simulates QSR operations given scenario and staffing.
    Predicts what will happen during the shift.
    """
    
    def __init__(self):
        self.client = genai.Client(api_key=settings.google_api_key)
        self.system_prompt = self._build_system_prompt()
        
    def _build_system_prompt(self) -> str:
        return """You are a QSR Operations Simulator Agent. Given environmental conditions and staffing decisions, you predict complete shift outcomes.

ROLE: Predict what will happen during a restaurant shift based on scenario factors and staffing levels.

CAPABILITIES:
- Estimate customer demand based on time, weather, events, location
- Calculate service capacity based on staffing and infrastructure
- Model queue dynamics, wait times, and throughput
- Compute financial metrics (revenue, costs, profit)
- Identify operational bottlenecks and critical events

SIMULATION LOGIC:
1. Demand Estimation:
   - Base demand by shift: breakfast (40-80/hr), lunch (80-120/hr), dinner (70-110/hr)
   - Weather impact: rainy +25% drive-thru preference, -10% walk-in
   - Day multipliers: Friday/Saturday +20-30%, Sunday lunch +40%
   - Special events: festivals +30-50%, sports games +20-40%
   - Location: urban/downtown +20% lunch, suburban +15% dinner

2. Capacity Calculation:
   - Drive-thru: ~25-35 cars/hr per lane per staff
   - Kitchen: ~20-25 orders/hr per cook
   - Utilization sweet spot: 0.70-0.85 (below = waste, above = stress)

3. Queue Dynamics:
   - If demand > capacity: queues form, wait times increase
   - Wait time formula: queue_length / service_rate * 60 seconds
   - Customer abandonment if wait > 10 minutes

4. Financial Metrics:
   - Average order value: $16 (drive-thru), $20 (walk-in)
   - Food cost: ~28% of revenue
   - Labor: $15/hour per staff member
   - Shift duration: 4 hours standard

CONSTRAINTS:
- Be realistic: QSR typically serves 50-200 customers/hour
- Staff utilization should not exceed 1.0
- Wait times should reflect actual capacity constraints

OUTPUT FORMAT (JSON):
{
  "predicted_metrics": {
    "customers_served": <int>,
    "revenue": <float>,
    "avg_wait_time_seconds": <int>,
    "peak_wait_time_seconds": <int>,
    "max_queue_length": <int>,
    "labor_cost": <float>,
    "food_cost": <float>,
    "staff_utilization": <float 0-1>,
    "order_accuracy": <float 0-1>
  },
  "key_events": [
    "5:30 PM: Rush begins...",
    "6:45 PM: Peak subsides..."
  ],
  "bottlenecks": [
    "Kitchen slightly overwhelmed 5:30-6:15 PM"
  ],
  "confidence": <float 0-1>
}

Be precise with numbers and provide realistic predictions."""

    def simulate(self, scenario: Scenario, staffing: Staffing) -> SimulationResult:
        """
        Simulate a shift and predict outcomes
        
        Args:
            scenario: The operational scenario
            staffing: The proposed staffing allocation
            
        Returns:
            SimulationResult with predicted metrics
        """
        logger.info(f"Simulating shift: {scenario.shift.value}, staffing: {staffing.total} total")
        
        try:
            # Build prompt
            user_prompt = f"""
SCENARIO:
{scenario.model_dump_json(indent=2)}

STAFFING:
{staffing.model_dump_json(indent=2)}

Simulate this {scenario.shift.value} shift and predict outcomes. Provide detailed, realistic predictions in the specified JSON format.
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
            
            # Extract JSON from markdown code blocks if present
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            result_dict = json.loads(result_text)
            
            # Convert to Pydantic model
            simulation_result = SimulationResult(
                predicted_metrics=PredictedMetrics(**result_dict["predicted_metrics"]),
                key_events=result_dict.get("key_events", []),
                bottlenecks=result_dict.get("bottlenecks", []),
                confidence=result_dict.get("confidence", 0.8)
            )
            
            logger.info(f"Simulation complete: {simulation_result.predicted_metrics.customers_served} customers predicted")
            return simulation_result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse simulation result: {e}")
            logger.error(f"Raw response: {response.text}")
            raise ValueError(f"Invalid JSON response from model: {e}")
        except Exception as e:
            logger.error(f"Simulation failed: {e}")
            raise
