import {
  ChevronRight,
  MoreVertical,
  Play,
  Grid3x3,
  FileText,
  Car,
  Package,
  TrendingUp,
  GitCompare,
  BarChart3,
  Radar,
  UserCheck,
  Zap,
  Brain,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { PlanResponse, EvaluateResponse } from '../types';

interface StudioPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onRunModel: () => Promise<void>;
  onCancelRun: () => void;
  isRunning: boolean;
  isOnline: boolean;
  currentPlan: PlanResponse | null;
  onEvaluationSubmit: (request: any) => Promise<any>;
  traceMode: boolean;
  onTraceModeChange: (value: boolean) => void;
  reasoningMode: boolean;
  onReasoningModeChange: (value: boolean) => void;
}

interface Tool {
  id: string;
  name: string;
  icon: any;
  color: string;
  group?: 'focus' | 'performance' | 'tools';
}

const focusTools: Tool[] = [
  { id: 'drive-thru', name: 'Drive-Thru', icon: Car, color: 'bg-blue-50 text-blue-600', group: 'focus' },
];

const systemModeTools: Tool[] = [
  { id: 'trace', name: 'Trace Mode', icon: Zap, color: 'bg-blue-50 text-blue-600', group: 'performance' },
  { id: 'reasoning', name: 'Reasoning Mode', icon: Brain, color: 'bg-purple-50 text-purple-600', group: 'performance' },
];

const performanceTools: Tool[] = [
  { id: 'compare', name: 'Compare', icon: GitCompare, color: 'bg-orange-50 text-orange-600', group: 'performance' },
  { id: 'benchmark', name: 'Benchmark', icon: BarChart3, color: 'bg-indigo-50 text-indigo-600', group: 'performance' },
];


// No imports needed for server status here anymore

export function StudioPanel({ isCollapsed, onToggle, onRunModel, onCancelRun, isRunning, isOnline, traceMode, onTraceModeChange, reasoningMode, onReasoningModeChange }: StudioPanelProps) {

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <div className="w-14 bg-white border-l border-slate-200 flex flex-col items-center py-4 gap-2 shadow-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button variant="ghost" size="icon" onClick={onToggle} className="w-10 h-10">
                  <ChevronRight className="h-5 w-5 rotate-180" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left"><p>Expand Studio</p></TooltipContent>
          </Tooltip>
          <div className="w-full h-px bg-slate-100 my-1" />
          <Button variant="ghost" size="icon" className="w-10 h-10"><Grid3x3 className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="w-10 h-10"><FileText className="h-5 w-5" /></Button>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shadow-sm">
      <div className="p-4 border-b border-slate-200 flex-shrink-0 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900 tracking-tight">Studio</h2>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Main Action Call */}
          <div className="flex flex-col items-center gap-4 py-2">
            {!isRunning ? (
              <Button
                onClick={onRunModel}
                disabled={!isOnline}
                className={`group relative px-6 py-5 h-auto rounded-full transition-all duration-300 ${!isOnline
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-full transition-colors ${isOnline ? 'bg-white/20 group-hover:bg-white/30' : 'bg-slate-200'}`}>
                    <Play className={`h-3.5 w-3.5 ${isOnline ? 'fill-white' : 'text-slate-400'}`} />
                  </div>
                  <span className="text-sm font-bold tracking-tight">Run World Model</span>
                </div>
              </Button>
            ) : (
              <div className="w-full px-2">
                <div className="relative bg-blue-50 border border-blue-100 rounded-2xl p-5 overflow-hidden flex flex-col items-center gap-3 shadow-inner">
                  {/* Pulse Animation Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-blue-400/10 to-blue-400/5 animate-pulse" />

                  <div className="relative flex items-center justify-center">
                    <div className="absolute h-12 w-12 bg-blue-400/20 rounded-full animate-ping" />
                    <div className="relative h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    </div>
                  </div>

                  <div className="relative text-center">
                    <div className="text-sm font-bold text-blue-900 flex items-center gap-1.5 justify-center">
                      Simulating
                      <span className="flex gap-0.5">
                        <span className="animate-bounce delay-0">.</span>
                        <span className="animate-bounce delay-150">.</span>
                        <span className="animate-bounce delay-300">.</span>
                      </span>
                    </div>
                  </div>

                  {/* Discrete Progress Indicator */}
                  <div className="relative w-full h-1 bg-blue-200/50 rounded-full mt-1 overflow-hidden">
                    <div className="absolute inset-0 bg-blue-600 w-1/3 rounded-full animate-[progress_2s_ease-in-out_infinite]" />
                  </div>

                  {/* Cancel Run Button */}
                  <button
                    onClick={onCancelRun}
                    className="relative mt-2 px-4 py-1.5 rounded-full bg-white/50 hover:bg-white text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200/50 transition-all flex items-center gap-2 group/cancel"
                  >
                    <RotateCcw className="h-3 w-3 group-hover:rotate-[-180deg] transition-transform duration-500" />
                    Cancel Run
                  </button>
                </div>
              </div>
            )}

          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] pl-1">System Modes</h3>
            <div className="bg-slate-50/80 rounded-2xl p-2 border border-slate-100/50">
              <div className="grid grid-cols-2 gap-2">
                {systemModeTools.map(tool => {
                  const isActive = (tool.id === 'trace' && traceMode) || (tool.id === 'reasoning' && reasoningMode);
                  const activeColor = tool.id === 'trace' ? 'bg-blue-600 border-blue-700 shadow-blue-500/20' : 'bg-purple-600 border-purple-700 shadow-purple-500/20';

                  return (
                    <div
                      key={tool.id}
                      onClick={() => {
                        if (isRunning) return;
                        if (tool.id === 'trace') {
                          onTraceModeChange(!traceMode);
                          if (!traceMode) onReasoningModeChange(false);
                        }
                        if (tool.id === 'reasoning') {
                          onReasoningModeChange(!reasoningMode);
                          if (!reasoningMode) onTraceModeChange(false);
                        }
                      }}
                      className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${isActive
                        ? `${activeColor} shadow-lg text-white`
                        : 'border-transparent bg-white hover:bg-white/50 text-slate-700 shadow-sm'
                        } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer text-center'}`}
                    >
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20 text-white' : tool.color} mb-1`}>
                        <tool.icon className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-bold">
                        {tool.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Focus Group */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] pl-1">Focus</h3>
            <div className="bg-slate-50/80 rounded-2xl p-2 border border-slate-100/50">
              <div className="grid grid-cols-1 gap-2">
                {focusTools.map(tool => (
                  <div key={tool.id} className={`p-3 rounded-xl border border-transparent bg-white hover:bg-white/50 transition-colors cursor-pointer group flex items-center gap-3 shadow-sm ${tool.id === 'drive-thru' ? 'ring-2 ring-blue-500/10' : ''}`}>
                    <div className={`p-2 rounded-lg ${tool.color}`}><tool.icon className="h-4 w-4" /></div>
                    <span className="text-sm font-bold text-slate-700">{tool.name}</span>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4 text-slate-400" /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] pl-1">Performance</h3>
            <div className="bg-slate-50/80 rounded-2xl p-2 border border-slate-100/50">
              <div className="grid grid-cols-2 gap-2">
                {performanceTools.map(tool => (
                  <div
                    key={tool.id}
                    className="p-3 rounded-xl border border-transparent bg-white hover:bg-white/50 transition-all cursor-pointer text-center flex flex-col items-center gap-1 text-slate-700 shadow-sm"
                  >
                    <div className={`p-2 rounded-lg ${tool.color} mb-1`}>
                      <tool.icon className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-bold">
                      {tool.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}