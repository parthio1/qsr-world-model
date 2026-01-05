# QSR World Model: Agentic Operations Planning

A comprehensive AI-driven platform for Quick Service Restaurant (QSR) operations, utilizing a **World Model** approach to simulate and optimize staffing decisions.

## 🌟 Overview

This project implements a multi-agent system that predicts operational outcomes (wait times, revenue, staff satisfaction) based on various scenarios and staffing levels. It allows operators to "test" decisions in a simulated environment before implementing them in the real world.

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
4. Run the API: `./qsr_run.sh api --port 8081`

For more details, see the [Backend README](./be/qsr-be/README.md).

### 2. Frontend Setup
1. Navigate to the frontend directory: `cd fe/qsr-fe`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`

For more details, see the [Frontend README](./fe/qsr-fe/README.md).

## 🤖 Core Agent System

The backend employs several specialized agents:
- **World Model Agent**: Simulates the shift and predicts metrics.
- **Operator Agent**: Generates staffing strategies.
- **Scorer Agent**: Evaluates outcomes based on profit, customer, and staff objectives.
- **Evaluator Agent**: Compares simulations to actual results for continuous learning.
- **World Context Agent**: Provides environmental context (weather, events).
- **Restaurant Agent**: Manages restaurant-specific configuration.

## 🛠 Tech Stack
- **AI**: Google Gemini Pro (via agentic prompts)
- **Backend**: Python, FastAPI, Pydantic
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **VCS**: Git/GitHub (parthio1/qsr-world-model)

---
Built with ❤️ for the future of QSR operations.
