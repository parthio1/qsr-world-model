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
} from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { PlanResponse, EvaluateResponse } from '../types';

interface StudioPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onRunModel: () => Promise<void>;
  isRunning: boolean;
  currentPlan: PlanResponse | null;
  onEvaluationSubmit: (request: any) => Promise<any>;
}

interface Tool {
  id: string;
  name: string;
  icon: any;
  color: string;
  group?: 'focus' | 'performance' | 'tools';
}

const focusTools: Tool[] = [
  { id: 'drive-thru', name: 'Standard Plan', icon: Car, color: 'bg-blue-50 text-blue-600', group: 'focus' },
  { id: 'order-pickup', name: 'Quick Picks', icon: Package, color: 'bg-purple-50 text-purple-600', group: 'focus' },
  { id: 'demand', name: 'Demand Forecaster', icon: TrendingUp, color: 'bg-green-50 text-green-600', group: 'focus' },
];

const performanceTools: Tool[] = [
  { id: 'compare', name: 'Compare', icon: GitCompare, color: 'bg-orange-50 text-orange-600', group: 'performance' },
  { id: 'benchmark', name: 'Benchmark', icon: BarChart3, color: 'bg-indigo-50 text-indigo-600', group: 'performance' },
];

const additionalTools: Tool[] = [
  { id: 'guest-sensor', name: 'Sentiment Radar', icon: Radar, color: 'bg-pink-50 text-pink-600', group: 'tools' },
  { id: 'staff-satisfaction', name: 'Retention Tool', icon: UserCheck, color: 'bg-teal-50 text-teal-600', group: 'tools' },
];

import { useServerStatus } from '../hooks/useApi';

export function StudioPanel({ isCollapsed, onToggle, onRunModel, isRunning }: StudioPanelProps) {
  const { isOnline, isLoading: isCheckingStatus, checkStatus } = useServerStatus();

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
          <h2 className="font-bold text-slate-900 tracking-tight">Model Studio</h2>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Main Action Call */}
          <div className="bg-slate-900 rounded-2xl p-4 shadow-xl border-t border-slate-800">
            <Button
              className={`w-full py-6 text-base font-bold transition-all ${isRunning
                ? 'bg-blue-500'
                : !isOnline
                  ? 'bg-slate-700 cursor-not-allowed opacity-50'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                }`}
              onClick={onRunModel}
              disabled={isRunning || !isOnline}
            >
              {isRunning ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Simulating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2 fill-white" />
                  Run World Model
                </>
              )}
            </Button>
            <div
              className="mt-3 flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={checkStatus}
              title="Click to check connection status"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isCheckingStatus ? 'bg-yellow-500' : (isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500')}`}></span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.1em]">
                {isCheckingStatus ? 'Connecting...' : (isOnline ? 'Engine Online' : 'Engine Offline')}
              </span>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Operational Focus</h3>
            <div className="grid grid-cols-1 gap-2">
              {focusTools.map(tool => (
                <div key={tool.id} className={`p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors cursor-pointer group flex items-center gap-3 ${tool.id === 'drive-thru' ? 'ring-2 ring-blue-500/10 border-blue-500/20' : ''}`}>
                  <div className={`p-2 rounded-lg ${tool.color}`}><tool.icon className="h-4 w-4" /></div>
                  <span className="text-sm font-semibold text-slate-700">{tool.name}</span>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4 text-slate-400" /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Performance Bench</h3>
            <div className="grid grid-cols-2 gap-2">
              {performanceTools.map(tool => (
                <div key={tool.id} className="p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors cursor-pointer text-center flex flex-col items-center gap-1">
                  <div className={`p-2 rounded-lg ${tool.color} mb-1`}><tool.icon className="h-4 w-4" /></div>
                  <span className="text-[11px] font-bold text-slate-700">{tool.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Utility Agents</h3>
            <div className="space-y-2">
              {additionalTools.map(tool => (
                <div key={tool.id} className="p-3 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tool.color}`}><tool.icon className="h-4 w-4" /></div>
                  <span className="text-xs font-medium text-slate-600">{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}