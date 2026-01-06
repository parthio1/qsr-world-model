# QSR World Model

AI-powered QSR operations planning system using Google Gemini and agentic reasoning.

## 🎯 Overview

This system uses a **world model** approach inspired by Meta's Code World Model to predict QSR operational outcomes and optimize staffing decisions. Instead of predicting what code does, we predict what staffing decisions will achieve.

### Core Concept

**Traditional Approach**: Generate options → Pick best guess
**World Model Approach**: Generate options → **Simulate outcomes** → Score results → Pick optimal

## 🏗️ Architecture

### Five Core Agents

1. **World Model Agent** (`world_model_agent.py`) - Predicts shift outcomes given scenario and staffing.
2. **Restaurant Operator Agent** (`restaurant_operator_agent.py`) - Generates the initial baseline staffing plan.
3. **Shadow Operator Agent** (`shadow_operator_agent.py`) - Iteratively refines the plan based on World Model feedback.
4. **Scorer Agent** (`scorer_agent.py`) - Evaluates options on profit, customer satisfaction, staff wellbeing.
5. **Evaluator Agent** (`evaluator_agent.py`) - Compares predictions vs actual, learns from errors.
6. **World Context Agent** (`world_context_agent.py`) - Analyzes environmental factors like weather and holidays.
7. **Restaurant Agent** (`restaurant_agent.py`) - Analyzes restaurant-specific capacity and bottlenecks.

### Workflow

```
Scenario Input → World Context Agent → Demand Prediction
               ↓
               → Restaurant Agent → Capacity Analysis
               ↓
Context & Analysis → Restaurant Operator → Initial Plan
                                             ↓
                        LOOP: Initial Plan → World Model → Predicted Outcomes
                                             ↓
                                           Scorer → Feedback
                                             ↓
                        Shadow Operator ← Feedback & Plan
                                             ↓
                        Updated Plan → World Model (Repeat)
                                             ↓
                    Final Best Option → Deploy → Compare vs Actual (Evaluator)
```
## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Google API Key (Gemini)

### Installation

```bash
# From the root directory
cd be/qsr-be

# Copy environment template
cp .env.example .env

# Edit .env and add your Google API key
nano .env

# Start API server (default port 8081)
./qsr_run.sh api --port 8081
```

### Using the API

The API will be available at `http://localhost:8081`

**Plan a shift:**
```bash
curl -X POST http://localhost:8081/api/v1/plan \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": {
      "shift": "dinner",
      "date": "2026-01-03",
      "day_of_week": "friday",
      "weather": "rainy",
      "special_events": ["friday_rush"],
      "restaurant": {
        "location": "Downtown Atlanta",
        "has_drive_thru": true,
        "drive_thru_lanes": 2,
        "kitchen_capacity": "medium"
      }
    },
    "operator_priority": "minimize_cost"
  }'
```

**API Documentation:**
- Swagger UI: `http://localhost:8081/docs`
- ReDoc: `http://localhost:8081/redoc`

### Using the CLI

**Plan a shift:**
```bash
./qsr_run.sh cli plan \
  --shift dinner \
  --weather rainy \
  --day friday \
  --location "Downtown Atlanta" \
  --events "friday_rush" \
  --available-staff 15
```

**Evaluate completed shift:**
```bash
./qsr_run.sh cli evaluate \
  --plan-file data/results/plan_<request_id>.json \
  --customers 298 \
  --revenue 4620 \
  --wait-time 267 \
  --labor-cost 950 \
  --issues "Catering order at 6PM" \
  --issues "Drive-thru sensor offline"
```

**Run Batch Evaluation Runner:**
```bash
# Run evaluations for the operator agent against predefined scenarios
./qsr_eval.sh agent=operator
```

**List recent results:**
```bash
./qsr_run.sh cli list-results --limit 10
```

## 📊 Example Output

### Planning Output

```
🏆 RECOMMENDED STAFFING

Drive-Thru: 3 staff
Kitchen: 5 staff
Front Counter: 2 staff
Total: 10 staff

Overall Score: 0.807/1.00 (very good)
Labor Cost: $950.00

📈 Predicted Performance
  • Customers: 285
  • Revenue: $4,560
  • Avg Wait: 240s
  • Staff Utilization: 78%
  • Order Accuracy: 96%

🎯 Score Breakdown
  • Profit Target Score: 1.00 (raw: 1.00)
  • Guest Satisfaction Target Score: 1.00 (raw: 1.00)
  • Staff Wellbeing Target Score: 0.40 (raw: 0.40)

✓ Strengths
  • Strong profit margin of 51%
  • Staff utilization in sweet spot

⚠ Considerations
  • Wait times approach upper limit during peak
```

### Evaluation Output

```
🔍 EVALUATION

📈 Prediction Quality: GOOD

🎯 Accuracy Analysis
  • customers_served_error: +4.6%
  • revenue_error: +1.3%
  • wait_time_error: +11.3%

🔍 Root Causes
  • Model didn't account for large catering order
  • Equipment reliability not factored
  • Slightly underestimated Friday demand

💡 Suggested Improvements
  • [world_model_agent] Add bulk_order_probability parameter
    Impact: Reduce wait time prediction error by ~5%
  • [world_model_agent] Include equipment reliability factor
    Impact: More realistic capacity estimates

✓ Decision Quality
  • Was optimal: yes
  • Would change: false
  • Notes: Staffing level was appropriate despite prediction errors
```

## 🔧 Configuration

### Environment Variables

```bash
# Required
GOOGLE_API_KEY=your_key_here

# Optional (with defaults)
GEMINI_MODEL=gemini-2.0-flash-exp
TEMPERATURE=0.7
API_PORT=8081
```

### Alignment Targets

Customize operational targets found in real-world scenarios:

```python
{
  "target_labor_cost_percent": 30.0,   # Maximize profit by keeping labor < 30%
  "target_wait_time_seconds": 180,     # Max wait time of 3 minutes
  "target_staff_utilization": 0.82     # Target 82% utilization (avoid burnout)
}
```

Scores are calculated based on deviation from these targets.

## 🧪 Testing

```bash
./qsr_run.sh test
```

## 📁 Project Structure

```
qsr-world-model/
├── src/
│   ├── agents/              # AI agents
│   │   ├── world_model_agent.py
│   │   ├── operator_agent.py
│   │   ├── scorer_agent.py
│   │   ├── evaluator_agent.py
│   │   ├── restaurant_agent.py
│   │   └── world_context_agent.py
│   ├── coordinator/         # Orchestration
│   │   └── orchestrator.py
│   ├── models/              # Data schemas
│   │   └── schemas.py
│   └── config/              # Configuration
│       └── settings.py
├── api/                     # FastAPI application
│   └── main.py
├── cli/                     # Terminal interface
│   └── terminal.py
├── data/                    # Data storage
│   └── results/            # Planning & evaluation results
└── tests/                   # Test suite
```

## 🎓 Key Concepts

### World Model

A **world model** predicts consequences of actions before executing them. Our system:
1. Takes a staffing decision as input
2. Simulates the entire shift step-by-step
3. Predicts metrics: customers served, wait times, revenue, staff utilization
4. Enables comparison of options without real-world execution

### Multi-Objective Optimization

Real QSR operations balance competing goals:
- **Profit** (minimize costs, maximize revenue)
- **Customer Satisfaction** (minimize wait times, maximize quality)
- **Staff Wellbeing** (optimal utilization, avoid burnout)

The **Scorer** agent evaluates each option on all three, using configurable weights.

### Learning from Reality

The **Evaluator** agent compares predictions vs actual performance:
- Calculates prediction errors
- Identifies root causes (equipment failures, unexpected events)
- Suggests model improvements
- Enables continuous calibration

## 🔌 API Integration

### For Figma/Frontend Apps

```javascript
// Plan a shift
const response = await fetch('http://localhost:8000/api/v1/plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    scenario: {
      shift: 'dinner',
      date: '2026-01-03',
      day_of_week: 'friday',
      weather: 'rainy',
      special_events: ['friday_rush'],
      restaurant: {
        location: 'Downtown Atlanta',
        has_drive_thru: true,
        drive_thru_lanes: 2,
        kitchen_capacity: 'medium'
      }
    }
  })
});

const result = await response.json();
console.log('Best staffing:', result.best_decision.option.staffing);
console.log('Predicted customers:', result.best_decision.simulation.predicted_metrics.customers_served);
```

## 📈 Roadmap

- [x] Core 3-agent system
- [x] API interface
- [x] CLI interface
- [x] Post-execution evaluation
- [ ] Persistent state/database
- [ ] Historical analysis dashboard
- [ ] Multi-restaurant coordination
- [ ] Real-time POS integration
- [ ] Model auto-calibration from feedback

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional agents (inventory, competition, marketing)
- Enhanced simulation realism
- Integration with POS systems
- Web dashboard UI
- Model performance benchmarks

## 📄 License

MIT License

## 🙋 Support

For issues or questions:
- GitHub Issues: [repo-url]/issues
- Documentation: [wiki-url]
