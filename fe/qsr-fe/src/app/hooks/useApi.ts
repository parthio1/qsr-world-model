import { useState, useCallback } from 'react';
import { submitPlan, evaluatePlan, ApiError } from '../services/api';
import { PlanRequest, PlanResponse, EvaluateRequest, EvaluateResponse } from '../types';
import { validatePlanRequest, mapFormDataToPlanRequest } from '../utils/validation';
import type { PlanFormData } from '../types';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export function usePlanApi() {
  const [state, setState] = useState<UseApiState<PlanResponse>>({
    data: null,
    isLoading: false,
    error: null
  });

  const generatePlan = useCallback(async (formData: PlanFormData) => {
    const request = mapFormDataToPlanRequest(formData);
    const validation = validatePlanRequest(request);

    if (!validation.isValid) {
      setState({
        data: null,
        isLoading: false,
        error: validation.errors.join(', ')
      });
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await submitPlan(request);
      setState({
        data: response,
        isLoading: false,
        error: null
      });
      return response;
    } catch (error) {
      const errorMessage = error instanceof ApiError
        ? error.message
        : 'Failed to generate plan';

      setState({
        data: null,
        isLoading: false,
        error: errorMessage
      });
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    plan: state.data,
    isLoading: state.isLoading,
    error: state.error,
    generatePlan,
    clearError
  };
}

export function useEvaluateApi() {
  const [state, setState] = useState<UseApiState<EvaluateResponse>>({
    data: null,
    isLoading: false,
    error: null
  });

  const evaluate = useCallback(async (request: EvaluateRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await evaluatePlan(request);
      setState({
        data: response,
        isLoading: false,
        error: null
      });
      return response;
    } catch (error) {
      const errorMessage = error instanceof ApiError
        ? error.message
        : 'Failed to evaluate plan';

      setState({
        data: null,
        isLoading: false,
        error: errorMessage
      });
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    evaluation: state.data,
    isLoading: state.isLoading,
    error: state.error,
    evaluate,
    clearError
  };
}

export function useServerStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const { checkHealth } = await import('../services/api');
      await checkHealth();
      setIsOnline(true);
    } catch (error) {
      setIsOnline(false);
    } finally {
      setIsLoading(false);
      setLastChecked(new Date());
    }
  }, []);

  // Initial check
  useState(() => {
    checkStatus();
  });

  return {
    isOnline,
    isLoading,
    lastChecked,
    checkStatus
  };
}
