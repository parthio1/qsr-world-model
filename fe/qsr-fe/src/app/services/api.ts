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

let currentBaseUrl = API_BASE_URL;

export function setBaseUrl(url: string) {
  currentBaseUrl = url;
}

export function getBaseUrl() {
  return currentBaseUrl;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${currentBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        typeof errorData.detail === 'string'
          ? errorData.detail
          : JSON.stringify(errorData.detail) || errorData.message || `API error: ${response.status} ${response.statusText}`,
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

export async function submitPlan(request: PlanRequest, options: RequestInit = {}): Promise<PlanResponse> {
  return fetchApi<PlanResponse>(API_ENDPOINTS.PLAN, {
    method: 'POST',
    body: JSON.stringify(request),
    ...options
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
