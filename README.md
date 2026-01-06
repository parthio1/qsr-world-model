# QSR World Model: Noob Playground

A comprehensive AI-driven platform for Quick Service Restaurant (QSR) operations, utilizing a **World Model** approach to simulate and optimize staffing decisions.

## 🌟 Overview

This project implements a multi-agent system that predicts operational outcomes (wait times, revenue, staff satisfaction) based on various scenarios and staffing levels. It allows operators to "test" decisions in a simulated environment before implementing them in the real world.

### 🆕 Key Features
- **Dynamic Backend Discovery**: Frontend automatically scans and connects to available backend instances on ports `8080-8083`.
- **Iterative Shadow Optimization**: Multi-step refinement process where a Shadow Operator agent optimizes the initial human-like plan.
- **Simulation Control**: "Cancel Run" support for gracefully aborting active AI simulations.
- **Agentic Reasoning**: Deep visibility into the Chain-of-Thought logic for all agents (Operator, World, Scorer).
- **Proactive Evaluations**: Integrated evaluation runner for testing agent performance against recorded scenarios.

## 📂 Repository Structure

```
.
├── be/qsr-be/    # Backend: Python / FastAPI / Gemini Agents
└── fe/qsr-fe/    # Frontend: React / Vite / Tailwind CSS
```

## 🚀 Getting Started

### 1. Backend Setup
1. Navigate to the backend directory: `cd be/qsr-be`
2. Configure your environment: `cp .env.example .env` (Add your `GOOGLE_API_KEY`)
3. Install dependencies: `pip install -r requirements.txt`
4. Run the API: `./qsr_run.sh api --port 8081` (Supports ports 8080-8083 for auto-discovery)

For more details, see the [Backend README](./be/qsr-be/README.md).

### 2. Frontend Setup
1. Navigate to the frontend directory: `cd fe/qsr-fe`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Use the **Backend Selection** dropdown in the header to switch between discovered instances.

For more details, see the [Frontend README](./fe/qsr-fe/README.md).

## 🤖 Core Agent System

The backend employs several specialized agents:
- **World Model Agent**: Simulates the shift and predicts metrics.
- **Restaurant Operator Agent**: Generates initial staffing strategies with typical human operational bias.
- **Shadow Operator Agent**: Iteratively refines the initial plan to find a more rational optimal.
- **Scorer Agent**: Evaluates outcomes based on explicit optimization formulas and multi-objective weights.
- **Evaluator Agent**: Compares simulations to actual results for continuous learning.
- **World Context Agent**: Analyzes environmental factors and predicts demand levels.
- **Restaurant Agent**: Analyzes restaurant-specific infrastructure and capacity bottlenecks.

## 🛠 Tech Stack
- **AI**: Google Gemini (via agentic prompts)
- **Backend**: Python, FastAPI, Pydantic
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui

---
Built with ❤️ for the future of QSR operations.
