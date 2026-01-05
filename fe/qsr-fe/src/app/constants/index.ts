// Application constants

export const SHIFTS = ['breakfast', 'lunch', 'dinner'] as const;

export const WEATHER_TYPES = ['sunny', 'cloudy', 'rainy', 'stormy'] as const;

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
] as const;

export const OPERATOR_PRIORITIES = [
  'balanced',
  'minimize_cost',
  'customer_first',
  'staff_wellbeing',
  'maximize_revenue'
] as const;

export const SPECIAL_EVENTS = [
  'Holiday',
  'Sports Event',
  'Concert',
  'Local Festival',
  'Promotion Day',
  'School Break'
] as const;

export const OPERATOR_PRIORITY_CONFIG = {
  balanced: {
    icon: 'Scale',
    label: 'Balanced',
    description: 'Balance cost, service, and staff',
    color: 'purple'
  },
  minimize_cost: {
    icon: 'DollarSign',
    label: 'Minimize Cost',
    description: 'Prioritize lowest labor cost',
    color: 'green'
  },
  customer_first: {
    icon: 'Smile',
    label: 'Customer First',
    description: 'Fast service & low wait times',
    color: 'blue'
  },
  staff_wellbeing: {
    icon: 'Heart',
    label: 'Staff Wellbeing',
    description: 'Avoid overwork',
    color: 'rose'
  },
  maximize_revenue: {
    icon: 'BarChart3',
    label: 'Maximize Revenue',
    description: 'Serve maximum customers',
    color: 'amber'
  }
} as const;

export const DEFAULT_ALIGNMENT_WEIGHTS = {
  profit: 40,
  customer_satisfaction: 35,
  staff_wellbeing: 25
} as const;

export const API_ENDPOINTS = {
  PLAN: '/api/v1/plan',
  EVALUATE: '/api/v1/evaluate',
  HEALTH: '/health'
} as const;

export const API_BASE_URL = 'http://localhost:8081';
