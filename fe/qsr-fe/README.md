# QSR N00b Shift - Operations Dashboard

A modern React application for QSR (Quick Service Restaurant) franchise operations management, featuring AI-powered shift planning and real-time analytics.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📋 Features

- **🏪 Multi-Restaurant Management**: Manage multiple franchise locations
- **🤖 AI-Powered Planning**: Generate optimal staff schedules using AI agents
- **📊 Real-Time Analytics**: Monitor performance metrics and KPIs
- **⚖️ Multi-Objective Optimization**: Balance profit, customer satisfaction, and staff wellbeing
- **📈 Performance Evaluation**: Compare predicted vs actual results
- **🎨 Modern UI**: Built with React, TypeScript, and Tailwind CSS

## 🏗️ Project Structure

```
src/app/
├── components/          # React components
│   ├── ui/             # Reusable UI components (shadcn/ui)
│   ├── ErrorBoundary.tsx
│   ├── MainWorkspace.tsx
│   ├── SourcePanel.tsx
│   └── StudioPanel.tsx
├── hooks/              # Custom React hooks
│   ├── useApi.ts       # API call hooks
│   └── usePlanForm.ts  # Form state management
├── services/           # External services
│   └── api.ts          # API client
├── types/              # TypeScript definitions
│   └── index.ts
├── constants/          # App constants
│   └── index.ts
├── utils/              # Utility functions
│   ├── formatters.ts
│   └── validation.ts
├── data/               # Mock data
│   └── mockRestaurants.ts
└── App.tsx            # Main app component
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

## 🔌 API Integration

### Backend Requirements

The app connects to a FastAPI backend with the following endpoints:

#### Generate Plan
```typescript
POST /api/v1/plan
Content-Type: application/json

{
  "scenario": {
    "shift": "lunch",
    "date": "2026-01-04",
    "day_of_week": "Sunday",
    "weather": "sunny",
    "special_events": ["Holiday"],
    "restaurant": {
      "location": "Downtown Atlanta",
      "has_drive_thru": true,
      "drive_thru_lanes": 2,
      "kitchen_staff_capacity": "medium",
      "dine_in": true,
      "dine_in_seat_capacity": 50
    }
  },
  "constraints": {
    "available_staff": 20
  },
  "alignment_targets": {
    "target_labor_cost_percent": 30.0,
    "target_wait_time_seconds": 180,
    "target_staff_utilization": 0.82
  },
  "operator_priority": "minimize_cost"
}
```

#### Evaluate Plan
```typescript
POST /api/v1/evaluate
Content-Type: application/json

{
  "plan_id": "plan_123",
  "actual_data": {
    "actual_customers": 450,
    "actual_revenue": 5200,
    "actual_wait_time": 8,
    "customer_complaints": 2,
    "staff_overtime_hours": 3
  }
}
```

### Configuration

The application features **Dynamic Backend Discovery**. Upon startup, it automatically scans ports `8080-8083` to find active backend instances.

- **Direct Selection**: Use the **Backend Selection** dropdown in the header to switch between discovered instances.
- **Manual Rescan**: Click "Rescan Ports" in the dropdown if you've started a new backend instance.
- **Default Fallback**: If no instances are found, it defaults to the `API_BASE_URL` defined in `/src/app/constants/index.ts`.

## 🎨 Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Build Tool**: Vite

## 🧩 Key Concepts

### Custom Hooks

The app uses custom hooks for clean separation of concerns:

```typescript
// Form state management
const { shift, setShift, weather, setWeather } = useWorldParameters();
const { profitWeight, customerSatisfactionWeight } = useAlignmentWeights();

// API calls with loading/error states
const { plan, isLoading, error, generatePlan } = usePlanApi();
const { evaluation, evaluate } = useEvaluateApi();
```

### Type Safety

All data structures are strongly typed:

```typescript
import { PlanRequest, PlanResponse, Restaurant } from './types';
```

### Error Handling

- **Error Boundary**: Catches React errors
- **API Errors**: Custom `ApiError` class
- **Validation**: Pre-flight validation before API calls
- **User Feedback**: Clear error messages in UI

## 📝 Development Guidelines

### Adding a New Feature

1. **Define Types** (`/types/index.ts`)
```typescript
export interface NewFeature {
  id: string;
  name: string;
}
```

2. **Create Hook** (`/hooks/useNewFeature.ts`)
```typescript
export function useNewFeature() {
  const [state, setState] = useState();
  return { state, setState };
}
```

3. **Add to Component**
```typescript
const { state, setState } = useNewFeature();
```

### Code Style

- Use TypeScript strict mode
- Functional components only
- Custom hooks for state logic
- Utility functions for calculations
- Constants for magic values

### Performance Best Practices

- ✅ Use `useCallback` for event handlers
- ✅ Use `useMemo` for expensive calculations
- ✅ Proper dependency arrays in hooks
- ✅ Avoid inline object/array creation in props
- ✅ Component memoization where needed

## 🧪 Testing (Recommended)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 🚢 Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

The build outputs to `/dist` and can be deployed to any static hosting service.

## 📚 Documentation

- [Architecture Guide](./ARCHITECTURE.md) - Detailed architecture documentation

## 🤝 Contributing

1. Follow the existing code structure
2. Write TypeScript with strict types
3. Use custom hooks for state management
4. Add proper error handling
5. Update documentation

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues and questions:
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- Review existing code patterns
- Follow TypeScript best practices
- Use custom hooks for reusability

## 🎯 Roadmap

- [ ] Unit and E2E tests
- [ ] Storybook component documentation
- [ ] State management with Zustand/Jotai
- [ ] React Query for API caching
- [ ] Offline support
- [ ] Performance monitoring
- [ ] Analytics integration
- [ ] Multi-language support
- [ ] Dark mode theme

---

Built with ❤️ for QSR operators