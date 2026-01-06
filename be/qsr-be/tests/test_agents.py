"""Tests for QSR World Model agents"""

import pytest
from datetime import date
from src.models.schemas import (
    Scenario, RestaurantConfig, Staffing, Constraints,
    AlignmentWeights, ShiftType, WeatherType, RiskLevel
)

# Mock agents for testing (replace with actual when API keys available)
@pytest.fixture
def sample_scenario():
    """Sample scenario for testing"""
    return Scenario(
        shift=ShiftType.DINNER,
        date=date.today(),
        day_of_week="friday",
        weather=WeatherType.RAINY,
        special_events=["friday_rush"],
        restaurant=RestaurantConfig(
            location="Downtown Atlanta",
            has_drive_thru=True,
            drive_thru_lanes=2,
            kitchen_capacity="medium"
        )
    )

@pytest.fixture
def sample_staffing():
    """Sample staffing allocation"""
    return Staffing(
        drive_thru=3,
        kitchen=5,
        front_counter=2,
        total=10
    )

@pytest.fixture
def sample_constraints():
    """Sample operational constraints"""
    return Constraints(
        available_staff=15,
        budget_hours=60
    )

@pytest.fixture
def sample_alignment():
    """Sample alignment weights"""
    return AlignmentWeights(
        profit=0.40,
        customer_satisfaction=0.35,
        staff_wellbeing=0.25
    )

def test_scenario_validation(sample_scenario):
    """Test scenario model validation"""
    assert sample_scenario.shift == ShiftType.DINNER
    assert sample_scenario.weather == WeatherType.RAINY
    assert sample_scenario.restaurant.has_drive_thru is True

def test_staffing_total_calculation():
    """Test staffing total is calculated correctly"""
    staffing = Staffing(
        drive_thru=3,
        kitchen=5,
        front_counter=2,
        total=0  # Should be auto-calculated
    )
    assert staffing.total == 10

def test_alignment_weights_sum():
    """Test alignment weights must sum to 1.0"""
    with pytest.raises(ValueError):
        AlignmentWeights(
            profit=0.5,
            customer_satisfaction=0.5,
            staff_wellbeing=0.5  # Sum > 1.0, should fail
        )

def test_constraints_validation():
    """Test constraints validation"""
    constraints = Constraints(
        available_staff=15,
        budget_hours=60
    )
    assert constraints.available_staff >= 1
    assert constraints.budget_hours >= 0

# Integration tests (require API key)

def test_world_model_simulation(sample_scenario, sample_staffing):
    """Test world model simulation"""
    from src.agents.world_model_agent import WorldModelAgent
    
    agent = WorldModelAgent()
    result = agent.simulate(sample_scenario, sample_staffing, context="Test context")
    
    assert result.predicted_metrics.customers_served > 0
    assert result.predicted_metrics.revenue > 0
    assert 0 <= result.predicted_metrics.staff_utilization <= 1
    assert 0 <= result.confidence <= 1

def test_restaurant_operator(sample_scenario, sample_constraints):
    """Test restaurant operator agent"""
    from src.agents.restaurant_operator_agent import RestaurantOperatorAgent
    
    agent = RestaurantOperatorAgent()
    plan = agent.generate_initial_plan(
        scenario=sample_scenario,
        constraints=sample_constraints,
        operator_priority="balanced"
    )
    
    assert plan.staffing.total > 0
    assert plan.strategy != ""

def test_scorer(sample_scenario, sample_staffing, sample_alignment):
    """Test scorer agent"""
    from src.agents.scorer_agent import ScorerAgent
    from src.agents.world_model_agent import WorldModelAgent
    from src.models.schemas import StaffingPlan
    
    # Create simulation
    world_model = WorldModelAgent()
    simulation = world_model.simulate(sample_scenario, sample_staffing, context="Test context")
    
    # Create option
    option = StaffingPlan(
        id="test_option",
        strategy="Test strategy",
        estimated_total_guest=100,
        estimated_peak_guest=30,
        staffing=sample_staffing,
        estimated_labor_cost=950.0,
        risk_level=RiskLevel.LOW,
        rationale="Test rationale"
    )
    
    # Score it
    scorer = ScorerAgent()
    scores = scorer.score_option(
        scenario=sample_scenario,
        option=option,
        simulation=simulation,
        alignment_weights=sample_alignment
    )
    
    assert 0 <= scores.overall_score <= 1
    assert 0 <= scores.profit.raw_score <= 1
    assert 0 <= scores.customer_satisfaction.raw_score <= 1
    assert 0 <= scores.staff_wellbeing.raw_score <= 1

def test_shadow_operator(sample_scenario, sample_constraints, sample_staffing):
    """Test shadow operator agent"""
    from src.agents.shadow_operator_agent import ShadowOperatorAgent
    from src.models.schemas import StaffingPlan
    
    agent = ShadowOperatorAgent()
    prev_plan = StaffingPlan(
        id="initial",
        strategy="Initial",
        estimated_total_guest=100,
        estimated_peak_guest=30,
        staffing=sample_staffing,
        estimated_labor_cost=900,
        risk_level=RiskLevel.MEDIUM,
        rationale="Initial"
    )
    
    plan = agent.generate_refined_plan(
        scenario=sample_scenario,
        constraints=sample_constraints,
        feedback="Wait times are too high in drive-thru",
        previous_plan=prev_plan
    )
    
    assert plan.staffing.total > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
