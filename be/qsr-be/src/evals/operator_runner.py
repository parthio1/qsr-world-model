import json
import asyncio
import os
from datetime import datetime
from google import genai
from typing import List, Dict
from src.agents.operator_agent import OperatorAgent
from src.models.schemas import Scenario, Constraints
from src.models.eval_schemas import (
    OperatorEvalCase, OperatorEvalResult, OperatorEvalSummary, StaffingPlan
)
from src.config.settings import settings
from src.utils.logger import setup_logger

logger = setup_logger("OperatorRunner")

class OperatorRunner:
    def __init__(self, model_name: str = "gemini-2.0-flash-lite-preview"):
        self.agent = OperatorAgent()
        self.client = genai.Client(api_key=settings.google_api_key)
        self.eval_model = model_name
        self.scenarios_path = "data/evals/operator_scenarios.json"
        self.output_dir = "data/eval_results"
        os.makedirs(self.output_dir, exist_ok=True)

    def load_cases(self) -> List[OperatorEvalCase]:
        with open(self.scenarios_path, 'r') as f:
            data = json.load(f)
        return [OperatorEvalCase(**case) for case in data]

    async def evaluate_case(self, case: OperatorEvalCase) -> OperatorEvalResult:
        logger.info(f"Evaluating case: {case.id}")
        try:
            # 1. Generate plan
            plans = self.agent.generate_staffing_plan(
                scenario=case.scenario,
                constraints=case.constraints,
                operator_priority=case.operator_priority
            )
            
            if not plans:
                return OperatorEvalResult(
                    case_id=case.id,
                    passed=False,
                    judge_feedback="Agent failed to generate any plans.",
                    priority_score=0,
                    reasoning_quality_score=0
                )
            
            plan = plans[0]  # Take the first/best plan
            
            # 2. Hard Constraint Validation
            violations = []
            if plan.staffing.total > case.constraints.available_staff:
                violations.append(f"Total staff ({plan.staffing.total}) exceeds available ({case.constraints.available_staff})")
            
            for station, min_val in case.constraints.min_staff_per_station.items():
                actual = getattr(plan.staffing, station, 0)
                if actual < min_val:
                    violations.append(f"{station} staffed at {actual}, minimum required is {min_val}")
            
            # 3. Judge LLM Scoring
            judge_score = await self.get_judge_scoring(case, plan)
            
            passed = len(violations) == 0 and judge_score["priority_score"] >= 4 and judge_score["reasoning_score"] >= 3

            return OperatorEvalResult(
                case_id=case.id,
                passed=passed,
                plan_generated=plan,
                constraint_violations=violations,
                priority_score=judge_score["priority_score"],
                reasoning_quality_score=judge_score["reasoning_score"],
                judge_feedback=judge_score["feedback"]
            )
            
        except Exception as e:
            logger.error(f"Error evaluating {case.id}: {e}")
            return OperatorEvalResult(
                case_id=case.id,
                passed=False,
                error=str(e),
                judge_feedback="Internal Error during evaluation",
                priority_score=0,
                reasoning_quality_score=0
            )

    async def get_judge_scoring(self, case: OperatorEvalCase, plan: StaffingPlan) -> Dict:
        prompt = f"""
        You are an expert QSR operations judge. Evaluate the following Operator Agent decision.
        
        SCENARIO: {case.scenario.model_dump_json()}
        OPERATOR PRIORITY: {case.operator_priority}
        EXPECTED FOCUS: {case.expected_focus}
        
        AGENT'S PLAN:
        Strategy: {plan.strategy}
        Staffing: {plan.staffing.model_dump_json()}
        Rationale: {plan.rationale}
        Reasoning: {plan.reasoning}
        
        TASKS:
        1. Score Priority Alignment (0-5): How well does the plan meet the operator's priority ({case.operator_priority})?
        2. Score Reasoning Quality (0-5): Is the reasoning logical, CoT-based, and considers the context (weather, events)?
        3. Provide critical feedback.
        
        Return ONLY a JSON object:
        {{
            "priority_score": int,
            "reasoning_score": int,
            "feedback": "string"
        }}
        """
        
        response = self.client.models.generate_content(
            model=self.eval_model,
            contents=prompt,
            config={
                "response_mime_type": "application/json"
            }
        )
        
        return json.loads(response.text)

    async def run(self):
        cases = self.load_cases()
        results = []
        for case in cases:
            result = await self.evaluate_case(case)
            results.append(result)
            
        passed_count = sum(1 for r in results if r.passed)
        summary = OperatorEvalSummary(
            timestamp=datetime.now().isoformat(),
            model_name=self.eval_model,
            total_cases=len(cases),
            passed_cases=passed_count,
            pass_rate=passed_count / len(cases),
            avg_priority_score=sum(r.priority_score for r in results) / len(cases),
            avg_reasoning_score=sum(r.reasoning_quality_score for r in results) / len(cases),
            results=results
        )
        
        output_file = f"{self.output_dir}/operator_eval_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, 'w') as f:
            f.write(summary.model_dump_json(indent=2))
        
        print("\n" + "="*50)
        print(f"EVALUATION COMPLETE: {self.eval_model}")
        print(f"Pass Rate: {summary.pass_rate*100:.1f}% ({summary.passed_cases}/{summary.total_cases})")
        print(f"Avg Priority Alignment: {summary.avg_priority_score:.2f}/5")
        print(f"Avg Reasoning Quality: {summary.avg_reasoning_score:.2f}/5")
        print(f"Results saved to: {output_file}")
        print("="*50 + "\n")

if __name__ == "__main__":
    runner = OperatorRunner()
    asyncio.run(runner.run())
