// Core domain types - Aligning with Backend Schemas

export interface Restaurant {
  id: string;
  name: string;
  location: string;
  lastUsed: string;
  // Configuration (editable)
  has_drive_thru: boolean;
  drive_thru_lanes: number;
  kitchen_capacity: number;
  pos_count: number;
  dine_in: boolean;
  seating_capacity: number;
  // Constraints (read-only)
  max_staff: number;
  max_labor_cost: number;
}

export type ShiftType = 'breakfast' | 'lunch' | 'dinner';
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'stormy';
export type OperatorPriority = 'balanced' | 'minimize_cost' | 'customer_first' | 'staff_wellbeing' | 'maximize_revenue';

export interface AlignmentWeights {
  profit: number;
  customer_satisfaction: number;
  staff_wellbeing: number;
}

export interface PlanFormData {
  shift: ShiftType;
  date: string;
  day_of_week: string;
  weather: WeatherType;
  special_events: string[];
  restaurant: Restaurant;
  operator_priority: OperatorPriority;
  alignment_weights: AlignmentWeights;
}

// API Request Model (Matches Backend PlanningRequest)
export interface PlanRequest {
  scenario: {
    shift: ShiftType;
    date: string;
    day_of_week: string;
    weather: WeatherType;
    special_events: string[];
    restaurant: {
      location: string;
      has_drive_thru: boolean;
      drive_thru_lanes?: number;
      kitchen_staff_capacity: 'small' | 'medium' | 'large';
      dine_in: boolean;
      dine_in_seat_capacity?: number;
    };
  };
  constraints?: {
    available_staff: number;
    budget_hours: number;
  };
  alignment_weights?: {
    profit: number;
    customer_satisfaction: number;
    staff_wellbeing: number;
  };
  operator_priority: string;
}

// API Response Model (Matches Backend PlanningResponse)
export interface Staffing {
  drive_thru: number;
  kitchen: number;
  front_counter: number;
  total: number;
}

export interface PredictedMetrics {
  customers_served: number;
  revenue: number;
  avg_wait_time_seconds: number;
  peak_wait_time_seconds?: number;
  max_queue_length: number;
  labor_cost: number;
  food_cost: number;
  staff_utilization: number;
  order_accuracy: number;
}

export interface SimulationResult {
  predicted_metrics: PredictedMetrics;
  key_events: string[];
  bottlenecks: string[];
  confidence: number;
  reasoning?: string;
}

export interface ScoreItem {
  raw_score: number;
  weighted: number;
  details: Record<string, any>;
}

export interface Scores {
  profit: ScoreItem;
  customer_satisfaction: ScoreItem;
  staff_wellbeing: ScoreItem;
  overall_score: number;
  ranking: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  reasoning?: string;
}

export interface OptionEvaluation {
  option: {
    id: string;
    strategy: string;
    estimated_total_guest: number;
    estimated_peak_guest: number;
    staffing: Staffing;
    estimated_labor_cost: number;
    risk_level: string;
    rationale: string;
    reasoning?: string;
  };
  simulation: SimulationResult;
  scores: Scores;
}

export interface IterationTrace {
  iteration_number: number;
  evaluations: OptionEvaluation[];
  feedback?: string;
}

export interface DemandPrediction {
  estimated_total_demand: number;
  peak_demand_per_hour: number;
  demand_multiplier: number;
  channel_preference: Record<string, number>;
  context_factors: string[];
  reasoning?: string;
}

export interface CapacityAnalysis {
  max_throughput_per_hour: number;
  station_capacities: Record<string, number>;
  bottleneck_risk_areas: string[];
  reasoning?: string;
}

export interface PlanResponse {
  request_id: string;
  timestamp: string;
  scenario: {
    shift: ShiftType;
    date: string;
    day_of_week: string;
    weather: WeatherType;
    special_events: string[];
    restaurant: {
      location: string;
      has_drive_thru: boolean;
      drive_thru_lanes?: number;
      kitchen_staff_capacity: 'small' | 'medium' | 'large';
      dine_in: boolean;
      dine_in_seat_capacity?: number;
    };
  };
  demand_prediction: DemandPrediction;
  capacity_analysis: CapacityAnalysis;
  restaurant_operator_plan: OptionEvaluation;
  shadow_operator_best_plan: OptionEvaluation;
  iterations: IterationTrace[];
  execution_time_seconds: number;
}

// Evaluation Types
export interface EvaluateRequest {
  planning_response: PlanResponse;
  actual_data: {
    customers_served: number;
    revenue: number;
    avg_wait_time_seconds: number;
    labor_cost: number;
    reported_issues: string[];
  };
}

export interface EvaluateResponse {
  request_id: string;
  timestamp: string;
  evaluation: {
    accuracy_analysis: Record<string, any>;
    error_analysis: any[];
    learning_summary: string;
  };
  prediction_quality: string;
}