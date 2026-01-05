import { API_BASE_URL, API_ENDPOINTS } from '../constants';
import { PlanRequest, PlanResponse, EvaluateRequest, EvaluateResponse } from '../types';

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `API error: ${response.status} ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
}

export async function submitPlan(request: PlanRequest): Promise<PlanResponse> {
  return fetchApi<PlanResponse>(API_ENDPOINTS.PLAN, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function evaluatePlan(request: EvaluateRequest): Promise<EvaluateResponse> {
  return fetchApi<EvaluateResponse>(API_ENDPOINTS.EVALUATE, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function checkHealth(): Promise<{ status: string }> {
  return fetchApi<{ status: string }>(API_ENDPOINTS.HEALTH, {
    method: 'GET',
  });
}

export { ApiError };
