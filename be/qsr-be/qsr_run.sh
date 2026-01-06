#!/bin/bash

# QSR World Model - Startup Script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 QSR World Model - Startup${NC}\n"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo -e "${YELLOW}Please copy .env.example to .env and configure your API keys${NC}"
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

# Install dependencies
echo -e "${YELLOW}📥 Installing dependencies...${NC}"
python3 -m pip install -q --upgrade pip
python3 -m pip install -q -r requirements.txt

echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Parse command line arguments
MODE=${1:-api}

case $MODE in
    api)
        echo -e "${GREEN}🌐 Starting API server...${NC}"
        python3 -m api.main "${@:2}"
        ;;
    cli)
        echo -e "${GREEN}💻 Starting CLI mode...${NC}"
        python3 -m cli.terminal "${@:2}"
        ;;
    test)
        echo -e "${GREEN}🧪 Running tests...${NC}"
        python3 -m pytest tests/ -v
        ;;
    *)
        echo -e "${RED}❌ Unknown mode: $MODE${NC}"
        echo "Usage: ./run.sh [api|cli|test]"
        echo ""
        echo "Examples:"
        echo "  ./run.sh api                    # Start API server"
        echo "  ./run.sh cli plan --help        # CLI help"
        echo "  ./run.sh test                   # Run tests"
        exit 1
        ;;
esac