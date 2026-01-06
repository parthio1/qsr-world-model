"""Orchestrator - Coordinates all agents in the workflow"""

import time
import uuid
from datetime import datetime
from typing import List, Optional
from src.agents.world_model_agent import WorldModelAgent
from src.agents.restaurant_operator_agent import RestaurantOperatorAgent
from src.agents.shadow_operator_agent import ShadowOperatorAgent
from src.agents.scorer_agent import ScorerAgent
from src.agents.evaluator_agent import EvaluatorAgent
from src.agents.world_context_agent import WorldContextAgent
from src.agents.restaurant_agent import RestaurantModelAgent
from src.models.schemas import (
    PlanningRequest, PlanningResponse, OptionEvaluation,
    EvaluationRequest, EvaluationResponse, Constraints,
    AlignmentTargets, IterationTrace, DemandPrediction, CapacityAnalysis, Scores
)
import json
from src.utils.logger import setup_logger

logger = setup_logger(__name__)

class QSROrchestrator:
    """
    Main orchestrator that coordinates the workflow:
    1. Analyze World Context & Demand (Once)
    2. Analyze Restaurant Capacity (Once)
    3. Generate Initial Operator Plan (Once)
    4. Iteratively Refine with Shadow Operator (Loop)
    """
    
    def __init__(self):
        logger.info("Initializing QSR World Model Orchestrator")
        self.world_model_agent = WorldModelAgent()
        self.restaurant_operator_agent = RestaurantOperatorAgent()
        self.shadow_operator_agent = ShadowOperatorAgent()
        self.scorer_agent = ScorerAgent()
        self.evaluator_agent = EvaluatorAgent()
        self.world_context_agent = WorldContextAgent()
        self.restaurant_agent = RestaurantModelAgent()
        logger.info("All agents initialized successfully")
    
    def _calculate_overall_score(self, scores: Scores) -> float:
        """Calculate overall score locally based on the average of raw component scores"""
        components = [
            scores.profit.raw_score,
            scores.customer_satisfaction.raw_score,
            scores.staff_wellbeing.raw_score
        ]
        return sum(components) / len(components) if components else 0.0

    def plan_shift(self, request: PlanningRequest) -> PlanningResponse:
        """
        Complete planning workflow with separation of human tendency and rational optimizer.
        """
        request_id = str(uuid.uuid4())
        start_time = time.time()
        
        logger.info(f"Starting planning session {request_id}")
        
        # Set defaults
        constraints = request.constraints or Constraints(
            available_staff=15
        )
        alignment_targets = request.alignment_targets or AlignmentTargets()
        
        # ===== STEP 0 & 1: Context & Model Analysis (ONCE ONLY) =====
        logger.info("Phase 1: Analyzing World Context & Restaurant Model...")
        demand_prediction = self.world_context_agent.analyze_context(request.scenario)
        capacity_analysis = self.restaurant_agent.analyze_capacity(request.scenario.restaurant)
        
        shared_context = f"""
        DEMAND PREDICTION:
        {demand_prediction.model_dump_json(indent=2)}
        
        RESTAURANT CAPACITY:
        {capacity_analysis.model_dump_json(indent=2)}
        """
        
        # ===== STEP 2: Restaurant Operator Initial Plan (ONCE ONLY) =====
        logger.info("Phase 2: Generating initial Restaurant Operator plan...")
        operator_plan = self.restaurant_operator_agent.generate_initial_plan(
            scenario=request.scenario,
            constraints=constraints,
            operator_priority=request.operator_priority,
            context=shared_context
        )
        
        # Simulate and score operator plan
        operator_sim = self.world_model_agent.simulate(
            scenario=request.scenario,
            staffing=operator_plan.staffing,
            context=shared_context
        )
        operator_scores = self.scorer_agent.score_option(
            scenario=request.scenario,
            option=operator_plan,
            simulation=operator_sim,
            alignment_targets=alignment_targets
        )
        
        operator_evaluation = OptionEvaluation(
            option=operator_plan,
            simulation=operator_sim,
            scores=operator_scores
        )
        
        # ===== STEP 3: Shadow Operator Refinement Loop =====
        logger.info("Phase 3: Entering Shadow Operator optimization loop...")
        iterations: List[IterationTrace] = []
        current_best_evaluation = operator_evaluation
        current_best_score = self._calculate_overall_score(operator_scores)
        feedback = self._prepare_feedback(operator_evaluation, current_best_score)
        
        attempts = 0
        MAX_ATTEMPTS = 2
        TARGET_SCORE = 0.95
        
        while attempts < MAX_ATTEMPTS:
            attempts += 1
            logger.info(f"--- Shadow Iteration {attempts}/{MAX_ATTEMPTS} ---")
            
            # Shadow Operator proposes a plan
            shadow_plan = self.shadow_operator_agent.generate_refined_plan(
                scenario=request.scenario,
                constraints=constraints,
                feedback=feedback,
                previous_plan=current_best_evaluation.option,
                context=shared_context
            )
            
            # Simulate
            shadow_sim = self.world_model_agent.simulate(
                scenario=request.scenario,
                staffing=shadow_plan.staffing,
                context=shared_context
            )
            
            # Score
            shadow_scores = self.scorer_agent.score_option(
                scenario=request.scenario,
                option=shadow_plan,
                simulation=shadow_sim,
                alignment_targets=alignment_targets
            )
            
            shadow_evaluation = OptionEvaluation(
                option=shadow_plan,
                simulation=shadow_sim,
                scores=shadow_scores
            )
            
            # Capture trace
            iteration_trace = IterationTrace(
                iteration_number=attempts,
                evaluations=[shadow_evaluation],
                feedback=feedback
            )
            iterations.append(iteration_trace)
            
            # Use local calculation for comparison
            shadow_overall = self._calculate_overall_score(shadow_scores)
            
            # Update best
            if shadow_overall > current_best_score:
                current_best_evaluation = shadow_evaluation
                current_best_score = shadow_overall
                logger.info(f"New best score found: {shadow_overall:.3f}")
            
            # Check exit condition
            if current_best_score >= TARGET_SCORE:
                logger.info(f"Target score reached ({current_best_score:.3f}).")
                break
            
            # Prepare feedback for next turn
            feedback = self._prepare_feedback(shadow_evaluation, shadow_overall)

        # Final Response
        execution_time = time.time() - start_time
        response = PlanningResponse(
            request_id=request_id,
            timestamp=datetime.now(),
            scenario=request.scenario,
            demand_prediction=demand_prediction,
            capacity_analysis=capacity_analysis,
            restaurant_operator_plan=operator_evaluation,
            shadow_operator_best_plan=current_best_evaluation,
            iterations=iterations,
            execution_time_seconds=round(execution_time, 2)
        )
        logger.info(f"Planning session complete in {execution_time:.2f}s")
        return response

    def _prepare_feedback(self, evaluation: OptionEvaluation, score: float) -> str:
        """Helper to create feedback string for shadow operator"""
        feedback = f"Current Plan Score: {score:.3f}. "
        if evaluation.simulation.bottlenecks:
            feedback += f"Bottlenecks found: {', '.join(evaluation.simulation.bottlenecks)}. "
        if evaluation.scores.weaknesses:
            feedback += f"Issues: {', '.join(evaluation.scores.weaknesses)}. "
        feedback += "Address these issues to improve alignment with objectives."
        return feedback

    def evaluate_shift(self, request: EvaluationRequest) -> EvaluationResponse:
        """
        Evaluate a completed shift: compare prediction vs actual
        """
        request_id = str(uuid.uuid4())
        logger.info(f"Starting evaluation {request_id}")
        
        # Evaluate
        evaluation = self.evaluator_agent.evaluate(
            prediction=request.planning_response.shadow_operator_best_plan,
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
