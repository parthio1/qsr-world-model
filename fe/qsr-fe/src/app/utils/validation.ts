import { PlanFormData, PlanRequest } from '../types';

/**
 * Maps frontend form data to the nested structure expected by the FastAPI backend
 */
export function mapFormDataToPlanRequest(formData: PlanFormData): PlanRequest {
  // Convert numerical kitchen capacity to backend enum
  let kitchenCapacity: 'small' | 'medium' | 'large' = 'medium';
  if (formData.restaurant.kitchen_capacity < 8) kitchenCapacity = 'small';
  if (formData.restaurant.kitchen_capacity > 12) kitchenCapacity = 'large';

  return {
    scenario: {
      shift: formData.shift,
      date: formData.date || new Date().toISOString().split('T')[0],
      day_of_week: formData.day_of_week.toLowerCase(),
      weather: formData.weather,
      special_events: formData.special_events,
      restaurant: {
        location: formData.restaurant.location,
        has_drive_thru: formData.restaurant.has_drive_thru,
        drive_thru_lanes: formData.restaurant.has_drive_thru ? formData.restaurant.drive_thru_lanes : undefined,
        kitchen_staff_capacity: kitchenCapacity,
        dine_in: formData.restaurant.dine_in,
        dine_in_seat_capacity: formData.restaurant.seating_capacity,
      },
    },
    constraints: {
      available_staff: formData.restaurant.max_staff,
      budget_hours: formData.restaurant.max_staff * 4, // Assuming 4hr shift
    },
    alignment_weights: {
      profit: formData.alignment_weights.profit / 100,
      customer_satisfaction: formData.alignment_weights.customer_satisfaction / 100,
      staff_wellbeing: formData.alignment_weights.staff_wellbeing / 100,
    },
    operator_priority: formData.operator_priority === 'maximize_revenue' ? 'service_focus' :
      formData.operator_priority === 'minimize_cost' ? 'profit_focus' : 'balanced'
  };
}

export function validateAlignmentWeights(
  profit: number,
  customerSatisfaction: number,
  staffWellbeing: number
): { isValid: boolean; error?: string } {
  const total = profit + customerSatisfaction + staffWellbeing;

  if (Math.abs(total - 100) > 0.01) {
    return {
      isValid: false,
      error: `Weights must total 100%. Current total: ${total}%`
    };
  }

  return { isValid: true };
}

export function validatePlanRequest(request: PlanRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!request.scenario.shift) errors.push('Shift is required');
  if (!request.scenario.day_of_week) errors.push('Day of week is required');
  if (!request.scenario.weather) errors.push('Weather is required');
  if (!request.scenario.restaurant.location) errors.push('Restaurant location is required');

  if (request.alignment_weights) {
    const alignmentValidation = validateAlignmentWeights(
      request.alignment_weights.profit * 100,
      request.alignment_weights.customer_satisfaction * 100,
      request.alignment_weights.staff_wellbeing * 100
    );

    if (!alignmentValidation.isValid) {
      errors.push(alignmentValidation.error!);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}