#!/bin/bash

# QSR World Model - Evaluation Script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 QSR World Model - Agent Evaluations${NC}\n"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo -e "${YELLOW}Please configure your .env file with GOOGLE_API_KEY${NC}"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${GREEN}✓ Activating virtual environment${NC}"
source venv/bin/activate

# Install dependencies (checking requirements.txt)
echo -e "${YELLOW}📥 Checking dependencies...${NC}"
python3 -m pip install -q --upgrade pip
python3 -m pip install -q -r requirements.txt

echo -e "${GREEN}✓ Dependencies verified${NC}\n"

# Add current directory to PYTHONPATH
export PYTHONPATH=$PYTHONPATH:.

# Parse agent argument
AGENT=${1:-operator}

case $AGENT in
    operator)
        echo -e "${BLUE}🏃 Running Operator Agent Evaluations...${NC}"
        python3 -m src.evals.operator_runner
        ;;
    # In the future, add more agents here:
    # world_model)
    #     echo -e "${BLUE}🏃 Running World Model Agent Evaluations...${NC}"
    #     python3 -m src.evals.world_model_runner
    #     ;;
    *)
        echo -e "${RED}❌ Unknown agent: $AGENT${NC}"
        echo "Usage: ./qsr_eval.sh [operator|world_model|...]"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Evaluation completed successfully!${NC}"
else
    echo -e "\n${RED}❌ Evaluation failed.${NC}"
    exit 1
fi
