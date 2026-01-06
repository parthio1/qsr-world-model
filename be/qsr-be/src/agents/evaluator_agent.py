"""Evaluator Agent - Compares predictions vs actual performance"""

import json
from google import genai
from src.models.schemas import (
    OptionEvaluation, ActualPerformanceData, EvaluationResult
)
from src.config.settings import settings
from src.utils.logger import setup_logger

logger = setup_logger(__name__)

class EvaluatorAgent:
    """
    Agent that compares AI predictions against actual operational results
    and identifies what the model got wrong
    """
    
    def __init__(self):
        self.client = genai.Client(api_key=settings.google_api_key)
        self.system_prompt = self._build_system_prompt()
        
    def _build_system_prompt(self) -> str:
        return """You are a QSR Performance Evaluator Agent. You compare AI predictions against actual operational results to identify model errors and suggest improvements.

ROLE: Analyze prediction accuracy and extract learning insights.

EVALUATION PROCESS:

1. ACCURACY ANALYSIS:
   Calculate % error for each metric:
   error_pct = ((actual - predicted) / predicted) * 100
   
   Quality ratings:
   - |error| < 5%: excellent
   - |error| 5-10%: good
   - |error| 10-20%: acceptable
   - |error| 20-30%: poor
   - |error| > 30%: very poor

2. ROOT CAUSE IDENTIFICATION:
   Common causes of prediction errors:
   - Unexpected events (large orders, equipment failures)
   - Weather changes mid-shift
   - Model parameter misestimation (demand, capacity)
   - Staffing experience not accounted for
   - Menu complexity variations
   - Competition impacts
   - Special promotions

3. MODEL IMPROVEMENTS:
   Suggest specific, actionable improvements:
   - Parameter adjustments (with values)
   - New features to add
   - Edge cases to handle
   - Calibration needs

4. DECISION QUALITY:
   Assess if decision was optimal:
   - Would different staffing have been better?
   - What was the opportunity cost?
   - Did the decision achieve objectives?

Be specific, data-driven, and actionable."""

    def evaluate(
        self,
        prediction: OptionEvaluation,
        actual_data: ActualPerformanceData
    ) -> EvaluationResult:
        """
        Evaluate prediction accuracy
        
        Args:
            prediction: The AI's predicted outcome
            actual_data: The actual performance data
            
        Returns:
            EvaluationResult with analysis and improvements
        """
        logger.info("Evaluating prediction vs actual performance")
        
        try:
            # Build prompt
            user_prompt = f"""
AI PREDICTION:
Staffing: {prediction.option.staffing.model_dump_json(indent=2)}
Predicted Metrics: {prediction.simulation.predicted_metrics.model_dump_json(indent=2)}
Predicted Score: {prediction.scores.overall_score}

ACTUAL RESULTS:
{actual_data.model_dump_json(indent=2)}

Analyze the prediction accuracy. Calculate errors, identify root causes, and suggest model improvements.

Return response in the specified JSON format."""
            
            response = self.client.models.generate_content(
                model=settings.gemini_model,
                contents=[self.system_prompt, user_prompt],
                config={
                    "temperature": settings.temperature * 0.7,  # Lower temp for analysis
                    "max_output_tokens": settings.max_output_tokens,
                    "response_mime_type": "application/json",
                    "response_json_schema": EvaluationResult.model_json_schema(),
                }
            )
            
            return EvaluationResult.model_validate_json(response.text)
        except Exception as e:
            logger.error(f"Evaluation failed: {e}")
            raise
