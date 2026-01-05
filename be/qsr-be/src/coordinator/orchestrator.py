"""Orchestrator - Coordinates all agents in the workflow"""

import time
import uuid
from datetime import datetime
from typing import List
from src.agents.world_model_agent import WorldModelAgent
from src.agents.operator_agent import OperatorAgent
from src.agents.scorer_agent import ScorerAgent
from src.agents.evaluator_agent import EvaluatorAgent
from src.agents.world_context_agent import WorldContextAgent
from src.agents.restaurant_agent import RestaurantModelAgent
from src.models.schemas import (
    PlanningRequest, PlanningResponse, OptionEvaluation,
    EvaluationRequest, EvaluationResponse, Constraints,
    EvaluationRequest, EvaluationResponse, Constraints,
    AlignmentWeights
)
import json
from src.utils.logger import setup_logger

logger = setup_logger(__name__)

class QSROrchestrator:
    """
    Main orchestrator that coordinates the workflow:
    1. Generate staffing options (Decision Maker)
    2. Simulate each option (World Model)
    3. Score each option (Scorer)
    4. Select best option
    5. (Later) Evaluate vs actual (Evaluator)
    """
    
    def __init__(self):
        logger.info("Initializing QSR World Model Orchestrator")
        self.world_model_agent = WorldModelAgent()
        self.operator_agent = OperatorAgent()
        self.scorer_agent = ScorerAgent()
        self.evaluator_agent = EvaluatorAgent()
        self.world_context_agent = WorldContextAgent()
        self.restaurant_agent = RestaurantModelAgent()
        logger.info("All agents initialized successfully")
    
    def plan_shift(self, request: PlanningRequest) -> PlanningResponse:
        """
        Complete planning workflow
        
        Args:
            request: PlanningRequest with scenario and constraints
            
        Returns:
            PlanningResponse with all evaluated options and best decision
        """
        request_id = str(uuid.uuid4())
        start_time = time.time()
        
        logger.info(f"Starting planning session {request_id}")
        logger.info(f"**********Request Data:************")
        logger.info(f"Scenario: {request.scenario}")
        logger.info(f"Constraints: {request.constraints}")
        logger.info(f"Alignment Weights: {request.alignment_weights}") 
        logger.info(f"Operator Priority: {request.operator_priority}")
        logger.info(f"**********End Request Data**********")
        # Set defaults
        constraints = request.constraints or Constraints(
            available_staff=15,
            budget_hours=60
        )
        alignment_weights = request.alignment_weights or AlignmentWeights()
        
        # ===== STEP 0: Context & Model Analysis =====
        # Provide rich context before we start reasoning
        logger.info("Step 0: Analyzing World Context & Restaurant Model...")
        world_context_analysis = self.world_context_agent.analyze_context(request.scenario)
        restaurant_capacity_analysis = self.restaurant_agent.analyze_capacity(request.scenario.restaurant)
        
        # We'll attach this analysis to the prompt of the decision maker and world model
        # effectively injecting "World Knowledge"
        
        # Combine into a context string to pass initially
        initial_context = f"""
        CONTEXT ANALYSIS:
        {json.dumps(world_context_analysis, indent=2)}
        
        RESTAURANT CAPACITY:
        {json.dumps(restaurant_capacity_analysis, indent=2)}
        """
        
        # ===== AGENTIC REASONING LOOP WITH QSR WORLD MODE =====
        evaluations: List[OptionEvaluation] = []
        feedback = None
        attempts = 0
        MAX_ATTEMPTS = 2
        TARGET_SCORE = 0.95  # Threshold for "Good Enough"
        
        while attempts < MAX_ATTEMPTS:
            attempts += 1
            logger.info(f"--- Iteration {attempts}/{MAX_ATTEMPTS} ---")
            
            # Step 1: Generate Operator Staff Plan
            logger.info("Generating staffing options...")
            
            staffing_plan = self.operator_agent.generate_staffing_plan(
                scenario=request.scenario,
                constraints=constraints,
                operator_priority=request.operator_priority,
                context=initial_context,
                feedback=feedback
            )
            logger.info(f"Generated {len(staffing_plan)} staffing plans")
            
            # Step 2 & 3: Simulate QSR World Model & Score (Act & Evaluate)
            current_iteration_evals = []
            for option in staffing_plan:
                # Simulate World Model
                logger.info(f"Simulating option: {option.id}")
                simulation = self.world_model_agent.simulate(
                    scenario=request.scenario,
                    staffing=option.staffing
                )
                
                logger.info(f"****Simulation complete****: {simulation}")

                # Score The Operator Staff Plan against Multi Objective Alignment Weights
                logger.info(f"Scoring option: {option.id}")
                scores = self.scorer_agent.score_option(
                    scenario=request.scenario,
                    option=option,
                    simulation=simulation,
                    alignment_weights=alignment_weights
                )
                logger.info(f"****Scoring complete****: {scores}")

                # Create evaluation object
                evaluation = OptionEvaluation(
                    option=option,
                    simulation=simulation,
                    scores=scores
                )
                logger.info(f"****Evaluation complete****: {evaluation}")
                
                current_iteration_evals.append(evaluation)
                evaluations.append(evaluation)  # Keep history of all attempts
                logger.info(f"Score: {scores.overall_score:.3f}")

            # Step 4: Check Threshold & Prepare Feedback
            if not current_iteration_evals:
                logger.warning("No options generated in this iteration.")
                break
                
            best_of_run = max(current_iteration_evals, key=lambda e: e.scores.overall_score)
            logger.info(f"****Best of run****: {best_of_run}")
            
            if best_of_run.scores.overall_score >= TARGET_SCORE:
                logger.info(f"Target score {TARGET_SCORE} reached with {best_of_run.scores.overall_score:.3f}. Stopping loop.")
                break
            
            # If we haven't reached the target and still have attempts left, generate feedback
            if attempts < MAX_ATTEMPTS:
                logger.info(f"Score {best_of_run.scores.overall_score:.3f} below target. Preparing feedback for next iteration...")
                feedback = f"Attempt {attempts} result: Score {best_of_run.scores.overall_score:.3f}. "
                logger.info(f"Feedback b4: {feedback}")
                if best_of_run.simulation.bottlenecks:
                    feedback += f"Bottlenecks identified: {', '.join(best_of_run.simulation.bottlenecks)}. "
                if best_of_run.scores.weaknesses:
                    feedback += f"Weaknesses: {', '.join(best_of_run.scores.weaknesses)}. "
                feedback += "Please adjust staffing to address these specific issues."
                logger.info(f"Feedback after: {feedback}")

        # Final Selection
        if not evaluations:
            raise RuntimeError("No staffing options could be generated across all attempts.")
            
        best_overall = max(evaluations, key=lambda x: x.scores.overall_score)
        logger.info(f"Final Selection: {best_overall.option.id} with score {best_overall.scores.overall_score:.3f}")

        # Create response
        execution_time = time.time() - start_time
        response = PlanningResponse(
            request_id=request_id,
            timestamp=datetime.now(),
            scenario=request.scenario,
            options_evaluated=evaluations,
            best_decision=best_overall,
            execution_time_seconds=round(execution_time, 2)
        )
        
        logger.info(f"Planning session complete in {execution_time:.2f}s")
        return response
    
    def evaluate_shift(self, request: EvaluationRequest) -> EvaluationResponse:
        """
        Evaluate a completed shift: compare prediction vs actual
        
        Args:
            request: EvaluationRequest with planning response and actual data
            
        Returns:
            EvaluationResponse with accuracy analysis
        """
        request_id = str(uuid.uuid4())
        logger.info(f"Starting evaluation {request_id}")
        
        # Evaluate
        evaluation = self.evaluator.evaluate(
            prediction=request.planning_response.best_decision,
            actual_data=request.actual_data
        )
        
        # Determine overall quality
        quality_map = {
            "excellent": "excellent",
            "good": "good",
            "acceptable": "fair",
            "poor": "poor"
        }
        prediction_quality = quality_map.get(
            evaluation.accuracy_analysis.get("overall_prediction_quality", "fair"),
            "fair"
        )
        
        response = EvaluationResponse(
            request_id=request_id,
            timestamp=datetime.now(),
            evaluation=evaluation,
            prediction_quality=prediction_quality
        )
        
        logger.info(f"Evaluation complete: {prediction_quality} prediction quality")
        return response
