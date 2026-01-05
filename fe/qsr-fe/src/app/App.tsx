import { useState, useCallback } from 'react';
import { SourcePanel } from './components/SourcePanel';
import { MainWorkspace } from './components/MainWorkspace';
import { StudioPanel } from './components/StudioPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Button } from './components/ui/button';
import { Menu, Zap } from 'lucide-react';
import { usePlanApi, useEvaluateApi } from './hooks/useApi';
import { PlanFormData } from './types';
import { API_BASE_URL } from './constants';

export default function App() {
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [traceMode, setTraceMode] = useState(false);
  const [reasoningMode, setReasoningMode] = useState(false);

  // State for shared form data from SourcePanel
  const [formData, setFormData] = useState<PlanFormData | null>(null);

  const { plan, isLoading: isLoadingPlan, error: planError, generatePlan } = usePlanApi();
  const { evaluation, isLoading: isLoadingEvaluation, error: evaluationError, evaluate } = useEvaluateApi();

  // Handler for running the model from the StudioPanel
  const handleRunModel = useCallback(async () => {
    if (formData) {
      await generatePlan(formData);
    }
  }, [formData, generatePlan]);

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-slate-50">
        {/* Top Navigation */}
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg">
                <Zap className="h-4 w-4 text-blue-400 fill-blue-400" />
              </div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-bold text-slate-900 tracking-tight">QSR World Model</h1>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-blue-100">
                  Enterprise AI
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[11px] font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              Connected to: <span className="text-slate-600 font-bold">{API_BASE_URL.replace('http://', '')}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-slate-900"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content Area with Three Panels */}
        <div className="flex-1 flex overflow-hidden">
          <SourcePanel
            isCollapsed={leftPanelCollapsed}
            onToggle={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            onFormDataChange={setFormData}
          />
          <MainWorkspace
            plan={plan}
            evaluation={evaluation}
            isLoadingPlan={isLoadingPlan}
            isLoadingEvaluation={isLoadingEvaluation}
            error={planError || evaluationError}
            traceMode={traceMode}
            reasoningMode={reasoningMode}
          />
          <StudioPanel
            isCollapsed={rightPanelCollapsed}
            onToggle={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            onRunModel={handleRunModel}
            isRunning={isLoadingPlan}
            currentPlan={plan}
            onEvaluationSubmit={evaluate}
            traceMode={traceMode}
            onTraceModeChange={setTraceMode}
            reasoningMode={reasoningMode}
            onReasoningModeChange={setReasoningMode}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}