import { useState, useCallback } from 'react';
import { SourcePanel } from './components/SourcePanel';
import { MainWorkspace } from './components/MainWorkspace';
import { StudioPanel } from './components/StudioPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Button } from './components/ui/button';
import { Menu, Box, ChevronDown, Check, RotateCcw } from 'lucide-react';
import { usePlanApi, useEvaluateApi, useServerStatus } from './hooks/useApi';
import { PlanFormData } from './types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";

export default function App() {
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [traceMode, setTraceMode] = useState(false);
  const [reasoningMode, setReasoningMode] = useState(false);

  // State for shared form data from SourcePanel
  const [formData, setFormData] = useState<PlanFormData | null>(null);

  const { plan, isLoading: isLoadingPlan, error: planError, generatePlan, cancelPlan } = usePlanApi();
  const { evaluation, isLoading: isLoadingEvaluation, error: evaluationError, evaluate } = useEvaluateApi();

  // Handler for running the model from the StudioPanel
  const handleRunModel = useCallback(async () => {
    if (formData) {
      await generatePlan(formData);
    }
  }, [formData, generatePlan]);

  const { currentBaseUrl, availableBackends, selectBackend, checkStatus, isLoading: isConnecting, isOnline } = useServerStatus();

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-slate-50">
        {/* Top Navigation */}
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between z-10 shadow-sm">
          <div className={`flex items-center gap-3 px-4 transition-all duration-300 ${leftPanelCollapsed ? 'w-14' : 'w-72'}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg">
                <Box className="h-4 w-4 text-blue-400" />
              </div>
              {!leftPanelCollapsed && (
                <div className="flex items-center gap-2.5 whitespace-nowrap">
                  <h1 className="font-bold text-slate-900 tracking-tight">QSR World Model</h1>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 h-full border-x border-slate-100/50 flex items-center justify-center px-8">
            <div className="flex items-center gap-2.5">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Noob Operator Playground</div>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold uppercase tracking-wider rounded-full border border-blue-100 shadow-sm">
                Beta v1.0
              </span>
            </div>
          </div>

          <div className={`flex items-center px-4 transition-all duration-300 border-l border-slate-100/50 ${rightPanelCollapsed ? 'w-14 justify-center' : 'w-80 justify-end gap-3'}`}>
            {!rightPanelCollapsed && (
              <div className="flex gap-2 items-center overflow-hidden">
                <div
                  className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer shadow-sm flex-shrink-0 ${isOnline
                    ? 'bg-emerald-500 border-emerald-600 text-white'
                    : 'bg-rose-500 border-rose-600 text-white'
                    }`}
                  onClick={() => checkStatus()}
                >
                  <div className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnecting ? 'bg-yellow-200' : 'bg-white'}`}></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.12em] whitespace-nowrap">
                    {isConnecting ? 'Heartbeat...' : (isOnline ? 'Engine: Ready' : 'Engine: Offline')}
                  </span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-[9px] font-black text-blue-700 bg-blue-100/80 px-3 py-1.5 rounded-full border border-blue-200 shadow-sm flex items-center gap-2 hover:bg-blue-200/80 transition-colors flex-shrink min-w-0">
                      <span className="font-bold truncate">{currentBaseUrl.replace('http://', '')}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Available Backends</div>
                    {availableBackends.map((url) => (
                      <DropdownMenuItem
                        key={url}
                        onClick={() => selectBackend(url)}
                        className="flex items-center justify-between text-xs cursor-pointer focus:bg-blue-50 focus:text-blue-700"
                      >
                        <span className="font-medium">{url.replace('http://', '')}</span>
                        {url === currentBaseUrl && <Check className="h-3 w-3 text-blue-600" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-slate-900 flex-shrink-0"
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
            onCancelRun={cancelPlan}
            isRunning={isLoadingPlan}
            isOnline={isOnline}
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