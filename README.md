# QSR World Model: A "Noob Operator" Playground 
A lightweight project exploring the product development cycle from initial idea and research to system design, implementation and UX—using modern AI tools like Figma, Claude, and Antigravity.

> **Status:** Prototype  
> **Velocity:** Built in ~2-3 days over a holiday weekend

##  Objective: 
This project is a crude and simple attempt to prove and clarify my applied AI experience using AI tools, frameworks, and ecosystems in a quick and dirty way. 

##  What I'm Showcasing in this rapid and half-baked attempt: 
✅ Conceptual Thinking - Frame problems, identify novel solutions
✅ Research Capability - Understand academic concepts, apply to practice
✅ System Architecture - Design scalable, maintainable systems
✅ AI Engineering - Build with modern LLMs and agentic frameworks
✅ UX Design - Create intuitive, insight-driven interfaces
✅ Rapid Execution - Ship concept to working system in a short time

##  Ambition of this project:  
The core ambition of this project is to explore the concept of a **World Model** using LLM agents with reasoning. Though this concept is applied for robotics or video games or coding, I like to explore it for the high pressure environment of Quick Service Restaurant (QSR) operations.

"Predict what staffing decision achieves not just costs but also customer satisfaction, staff well-being".

## Problem Identification
Key assumption and simplification is that QSR managers make a important staffing decision with intuition and limited information rather than simulation

### Gap Addressed / Gap Assumed
* Existing tools predict demand but does not offer way to see the consequences before decisions are made 
* Trade-offs between customer delight, staff well-being and profit are implicit, not explicit

### Key Questions Explored:
* Can we simulate operational outcomes before execution?
* How does the concept of a world model apply to restaurant operations?
* How can AI agents coordinate to solve complex problems?
* What does multi-objective optimization look like in practice?

## Academic Inspiration:
* Ha & Schmidhuber's World Models (2018)
   → Learn compressed representations of environments
   → Simulate future states from current state + action
   → Plan by imagining consequences
* Dr Fei Fei Li's World Models: https://www.worldlabs.ai/
* Meta's Code World Models 
   → "Predict what code does, not just what it looks like"
* Agentic AI (LLM) Architectures
   → Agent specialization and coordination
   → Reasoning through chain-of-thought
   → Learning from outcomes

## Key Questions I Explored:
* Can we simulate operational outcomes before execution?
* How does the concept of a world model apply to restaurant operations?
* How can AI agents coordinate to solve complex problems?
* What does multi-objective optimization look like in practice?


## What is a world model:
By using features extracted from the world model as inputs to an AI agent, one can train a simple function or a policy that can solve the required task. One can even train agent entirely using LLMs as stop gap measure and transfer this decision back into the actual environment.

A World Model aims to simulate the future in order to predict consequences of actions before taking them. It relies on:
1.  **Representation Learning:** Understanding the current state of the environment in deeper ways
2.  **Planning & Reasoning:** Simulating "what if" scenarios to help make future actions and optimize outcomes.

This project is a **crude, agentic approximation** of that concept. Instead of deep reinforcement learning, I have leveraged **Chain-of-Thought (CoT) reasoning** and Large Language Models (LLMs) to construct a crude mental model of a restaurant shift. I want to see if a system of agents can "think" through a staffing plan, simulate a Friday dinner rush and refine its decisions.

## 🧪 The Experiment: Flaws
This is as much a learning tool for me as it is a software prototype. The domain of QSR operations is much more nuanced than my assumptions. There are inherent flaws in my own understanding of the problem space and the agents themselves are "noob operators"—subject to hallucinations, bad assumptions, and limited context.

### The central loop:**
1.  **Propose:** An operator agent proposes a staffing plan based on a specific "Operator Priority" or "Primary Goal" (e.g., minimizing costs).
2.  **Simulate:** A system of "World Model" agents plays out that shift, predicting wait times, revenue, bottlenecks and staff satisfaction.
3.  **Score:** A "Scorer" agent evaluates the outcome against multi-objective targets (Profit vs. Customer Satisfaction vs. Staff Wellbeing).
4.  **Learn:** A "Shadow Operator" (the rational planner) iterates on the plan to find a global optimum that a biased human might miss. This rational planning is indepenet of the operator proposed plan. 


### The Agentic World Model Loop

The system operates as a coordinated dance of specialized agents, mirroring the thought process of a management team:

```mermaid
graph TD
    User[User Input / Scenario] --> Context[World Context Agent]
    User --> Rest[Restaurant Agent]
    
    Context --> |Demand Prediction| Orchestrator
    Rest --> |Capacity Analysis| Orchestrator
    
    Orchestrator --> |Constraints| Operator[Restaurant Operator Agent]
    Operator --> |Initial Biased Plan| WM[World Model Agent]
    
    subgraph "Reasoning Loop"
        WM --> |Predicted Metrics| Scorer[Scorer Agent]
        Scorer --> |Feedback & Score| Shadow[Shadow Operator Agent]
        Shadow --> |Refined Plan| WM
    end
    
    Shadow --> |Optimal Plan| Final[Final Output]
```

### Core Agents
1.  **Restaurant Operator Agent (The Manager):** "What are my staffing options?" Generates strategic plans based on priorities.
2.  **World Model Agent (The Simulator):** "What will happen if we do this?" Simulates the shift and predicts metrics.
3.  **Scorer Agent (The Critic):** "How good is this option?" Scores outcomes against targets.
4.  **Shadow Operator Agent (The Optimizer):** "Can we do better?" Iteratively refines the plan based on feedback.
5.  **Evaluator Agent (The Teacher):** "What did we learn?" Compares predictions vs actuals (post-execution).
6.  **World Context Agent:** Analyzes external factors (weather, events).
7.  **Restaurant Agent:** Analyzes internal constraints (kitchen capacity).

## 🧠 Approach & Architecture

### Multi-Objective Optimization
The tension between three competing goals is modeled using configurable weights to balance them:
1.  **Profit Target Score:** Efficiency and labor cost management (Lower is better).
2.  **Guest Satisfaction Target Score:** Speed of service and order accuracy (Lower wait time is better).
3.  **Staff Wellbeing Target Score:** Preventing burnout and under-utilization (Target is a specific range, e.g., 70-85%).

## 🔑 Key Features

### Functional
*   **Multi-Agent Orchestra:** 6+ specialized agents working in concert.
*   **Iterative Refinement:** The system doesn't just give an answer; it "thinks" and improves its answer over multiple steps.
*   **Bias Modeling:** Simulate shifts from different perspectives (e.g., "Customer First" vs. "Minimize Cost").
*   **Different Scenarios:** Take into consideration weather, special events (post-game rush), and day-part variations.
*   **Transparency:** Full visibility into the "Inner Reasoning Monologue" of every agent via the UI.

## 🧪 Evaluations

This project includes a dedicated evaluation harness in the backend to "grade" the agents against known scenarios.

**Ground Truth Validation:**
The `Evaluator Agent` and `qsr_eval.sh` script compare agent outputs against expected baselines to ensure:
1.  **Reasoning Quality:** Does the agent's logic make sense?
2.  **Priority Alignment:** Did the agent actually follow the "Minimize Cost" or "Customer First" instruction?
3.  **Simulation Accuracy:** Are the predicted metrics (wait times, revenue) within realistic bounds?

**Running Evals:**
```bash
cd be/qsr-be
./qsr_eval.sh agent=operator
```
*Outputs a detailed JSON report with Pass/Fail rates and alignment scores.*


## 🚧 Known Issues & Learning Gaps

**Conceptual Limitations:**
-   **Not a true world model:** Uses LLM reasoning as an approximation, not learned neural dynamics.
-   **Limited causality:** Relies on correlational patterns in the LLM's training data, not deep causal understanding of physics or logistics.

**Implementation Gaps:**
-   **No persistent state:** Learning doesn't persist between sessions yet.
-   **Manual data entry:** No automated integrations with POS systems.
-   **Simplified simulation:** Does not yet account for equipment failures, shift overlaps, or individual staff skill levels.

**Domain Knowledge Gaps:**
-   Admittedly, I'm not a QSR expert. The model likely oversimplifies staffing complexity (breaks, training) and non-linear demand patterns.
-   **But that's the point**—this is a learning exercise to see how far agentic reasoning can go.


## 📂 Project Structure

This playground consists of two main components. Please refer to their respective READMEs for setup instructions:

*   **[Backend (Python/FastAPI)](./be/qsr-be/README.md):** The brain of the operation. Hosts the agents, the orchestration logic, and the simulation engine.
*   **[Frontend (React/Vite)](./fe/qsr-fe/README.md):** The visual workspace. Provides a "canvas" for users to tweak scenarios, run the model, and visualize the iterative reasoning process.

---
*Built with curiosity over a weekend. Learning in progress. 