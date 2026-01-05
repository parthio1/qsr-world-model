import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../constants';
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
  const [abortController, setAbortController] = useState<AbortController | null>(null);

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

    const controller = new AbortController();
    setAbortController(controller);
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { submitPlan } = await import('../services/api');
      const response = await submitPlan(request, { signal: controller.signal });
      setState({
        data: response,
        isLoading: false,
        error: null
      });
      return response;
    } catch (error) {
      if ((error as any).name === 'AbortError' || (error as any).message?.includes('aborted')) {
        setState({
          data: null,
          isLoading: false,
          error: null
        });
        return null;
      }

      const errorMessage = error instanceof ApiError
        ? error.message
        : 'Failed to generate plan';

      setState({
        data: null,
        isLoading: false,
        error: errorMessage
      });
      return null;
    } finally {
      setAbortController(null);
    }
  }, []);

  const cancelPlan = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setState(prev => ({ ...prev, error: null }));
    }
  }, [abortController]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    plan: state.data,
    isLoading: state.isLoading,
    error: state.error,
    generatePlan,
    cancelPlan,
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
  const [availableBackends, setAvailableBackends] = useState<string[]>([]);
  const [currentBaseUrl, setCurrentBaseUrl] = useState<string>(API_BASE_URL);

  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const { discoverBackends } = await import('../services/discovery');
      const { setBaseUrl, checkHealth } = await import('../services/api');

      const discovered = await discoverBackends();
      setAvailableBackends(discovered);

      if (discovered.length > 0) {
        // If current URL is not in discovered list, pick the first one
        if (!discovered.includes(currentBaseUrl)) {
          setBaseUrl(discovered[0]);
          setCurrentBaseUrl(discovered[0]);
        }
        await checkHealth();
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
    } catch (error) {
      setIsOnline(false);
    } finally {
      setIsLoading(false);
      setLastChecked(new Date());
    }
  }, [currentBaseUrl]);

  const selectBackend = useCallback(async (url: string) => {
    const { setBaseUrl, checkHealth } = await import('../services/api');
    setBaseUrl(url);
    setCurrentBaseUrl(url);
    setIsLoading(true);
    try {
      await checkHealth();
      setIsOnline(true);
    } catch (e) {
      setIsOnline(false);
    } finally {
      setIsLoading(false);
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
    checkStatus,
    currentBaseUrl,
    availableBackends,
    selectBackend
  };
}
