# QSR N00b Shift - Architecture Documentation

## 📁 Project Structure

```
src/app/
├── components/          # React components
│   ├── ui/             # Reusable UI components (shadcn/ui)
│   ├── ErrorBoundary.tsx
│   ├── MainWorkspace.tsx
│   ├── SourcePanel.tsx
│   └── StudioPanel.tsx
├── hooks/              # Custom React hooks
│   ├── useApi.ts       # API call hooks with error handling
│   └── usePlanForm.ts  # Form state management hooks
├── services/           # External service integrations
│   └── api.ts          # API client with error handling
├── types/              # TypeScript type definitions
│   └── index.ts        # All application types
├── constants/          # Application constants
│   └── index.ts        # Centralized constants
├── utils/              # Utility functions
│   ├── formatters.ts   # Data formatting utilities
│   └── validation.ts   # Validation logic
├── data/               # Mock/seed data
│   └── mockRestaurants.ts
└── App.tsx             # Main application component
```

## 🏗️ Architecture Principles

### 1. **Separation of Concerns**
- **Components**: UI rendering only, minimal business logic
- **Hooks**: State management and side effects
- **Services**: API communication
- **Utils**: Pure functions for data transformation

### 2. **Type Safety**
- All types defined in `/types/index.ts`
- No `any` types allowed
- API responses fully typed

### 3. **Custom Hooks Pattern**
```typescript
// State management hooks
useWorldParameters()     // World form state
useAlignmentWeights()    // Alignment weights state
useRestaurantManagement() // Restaurant CRUD
useOperatorPriority()    // Operator decision state

// API hooks
usePlanApi()            // Plan generation with loading/error
useEvaluateApi()        // Evaluation with loading/error
```

### 4. **Error Handling**
- Custom `ApiError` class for API errors
- Error boundary for React errors
- User-friendly error messages
- Validation before API calls

### 5. **Performance Optimizations**
- `useCallback` for event handlers
- `useMemo` for expensive computations
- Proper component memoization where needed
- Minimal re-renders

## 🔄 Data Flow

```
User Input (SourcePanel)
    ↓
Form State (Custom Hooks)
    ↓
Validation (utils/validation.ts)
    ↓
API Request (services/api.ts)
    ↓
Response Processing
    ↓
State Update (App.tsx)
    ↓
UI Update (MainWorkspace)
```

## 📝 Key Design Patterns

### 1. **Custom Hook Pattern**
Encapsulate related state and logic:
```typescript
function useWorldParameters() {
  const [shift, setShift] = useState('lunch');
  const [weather, setWeather] = useState('sunny');
  // ... more state and logic
  return { shift, setShift, weather, setWeather };
}
```

### 2. **Facade Pattern** (API Service)
Single interface for all API calls:
```typescript
const plan = await submitPlan(request);
const evaluation = await evaluatePlan(request);
```

### 3. **Factory Pattern** (Data Mapping)
Transform form data to API requests:
```typescript
mapFormDataToPlanRequest(formData) → PlanRequest
```

## 🎯 Best Practices Implemented

### Code Organization
✅ One component per file
✅ Consistent file naming (camelCase for utils, PascalCase for components)
✅ Logical folder structure
✅ Clear import organization

### TypeScript
✅ Strict type checking
✅ No implicit any
✅ Proper interface definitions
✅ Type-safe constants

### React
✅ Functional components only
✅ Custom hooks for reusability
✅ Proper dependency arrays
✅ Error boundaries
✅ Memoization where appropriate

### Performance
✅ Lazy evaluation
✅ Optimistic updates possible
✅ Minimal prop drilling
✅ Efficient re-renders

### Maintainability
✅ Self-documenting code
✅ Consistent naming conventions
✅ DRY principle
✅ Single responsibility

## 🔌 API Integration

### Plan API
```typescript
POST /api/v1/plan
Request: PlanRequest
Response: PlanResponse
```

### Evaluate API
```typescript
POST /api/v1/evaluate
Request: EvaluateRequest
Response: EvaluateResponse
```

### Error Handling
- Network errors caught and displayed
- Validation errors prevented before API calls
- User-friendly error messages
- Retry capabilities

## 🚀 Future Enhancements

### Recommended Additions
1. **State Management**: Consider Zustand/Jotai for complex state
2. **Caching**: React Query for API caching and synchronization
3. **Testing**: Jest + React Testing Library
4. **E2E Tests**: Playwright or Cypress
5. **Logging**: Structured logging service
6. **Analytics**: User interaction tracking
7. **Offline Support**: Service worker for offline mode

### Scalability Considerations
- **Component Library**: Extract UI components to separate package
- **Micro-frontends**: Split panels into separate apps if needed
- **API Versioning**: Support multiple API versions
- **Feature Flags**: Runtime feature toggles

## 📚 Adding New Features

### Example: Adding a New Parameter Group

1. **Update Types** (`types/index.ts`)
```typescript
export interface NewParameter {
  field: string;
}
```

2. **Create Hook** (`hooks/usePlanForm.ts`)
```typescript
export function useNewParameter() {
  const [field, setField] = useState('');
  return { field, setField };
}
```

3. **Update Component** (SourcePanel.tsx)
```typescript
const { field, setField } = useNewParameter();
```

4. **Update Validation** (`utils/validation.ts`)
```typescript
if (!request.field) errors.push('Field is required');
```

## 🛠️ Development Guidelines

### Code Style
- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Write self-documenting code

### Git Workflow
- Feature branches
- Descriptive commit messages
- PR reviews required
- Squash and merge

### Testing Strategy
- Unit tests for utils and hooks
- Integration tests for API calls
- E2E tests for critical flows
- 80%+ code coverage target

## 📊 Performance Metrics

### Target Metrics
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: > 90
- Bundle Size: < 500KB

### Monitoring
- Error tracking (Sentry recommended)
- Performance monitoring
- User analytics
- API latency tracking