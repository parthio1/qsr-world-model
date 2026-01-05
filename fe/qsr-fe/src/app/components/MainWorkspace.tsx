import { Button } from './ui/button';
import { ThumbsUp, ThumbsDown, Copy, BookmarkPlus, Loader2, Users, DollarSign, Clock, Smile, TrendingUp, AlertCircle, BarChart3, Info } from 'lucide-react';
import { Zap, Brain, MessageSquare, ShieldCheck, Activity, Target } from 'lucide-react';
import { PlanResponse, EvaluateResponse } from '../types';
import { Badge } from './ui/badge';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';

interface MainWorkspaceProps {
  plan: PlanResponse | null;
  evaluation: EvaluateResponse | null;
  isLoadingPlan: boolean;
  isLoadingEvaluation: boolean;
  error: string | null;
  traceMode: boolean;
  reasoningMode: boolean;
}

import { useState } from 'react';

export function MainWorkspace({ plan, evaluation, isLoadingPlan, isLoadingEvaluation, error, traceMode, reasoningMode }: MainWorkspaceProps) {
  const [activeIteration, setActiveIteration] = useState(0);
  const [activeOptionId, setActiveOptionId] = useState<string | null>(null);
  const [activeAgentId, setActiveAgentId] = useState<'operator' | 'world' | 'scorer' | null>('operator');

  // Set default option when iteration changes
  const handleIterationChange = (index: number) => {
    setActiveIteration(index);
    if (plan && plan.iterations[index]) {
      setActiveOptionId(plan.iterations[index].evaluations[0]?.option.id || null);
    }
  };
  // Error State
  if (error) {
    return (
      <div className="flex-1 bg-white flex flex-col overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <h1 className="text-2xl font-semibold text-slate-900">Canvas</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Error Occurred</h3>
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingPlan) {
    return (
      <div className="flex-1 bg-white flex flex-col overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <h1 className="text-2xl font-semibold text-slate-900">Canvas</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Generating Optimal Plan...</h3>
              <p className="text-sm text-slate-500">AI agents are simulating staffing scenarios</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (plan) {
    if (reasoningMode) {
      const currentIteration = plan.iterations[activeIteration] || plan.iterations[0];
      const selectedOption = currentIteration?.evaluations.find(e => e.option.id === (activeOptionId || currentIteration.evaluations[0]?.option.id));

      return (
        <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-200 px-6 py-4 flex-shrink-0 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-slate-900">Agentic Reasoning</h1>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Reasoning Active
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Inner monologue and Chain-of-Thought logic for each agent
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar - Iterations & Options */}
            <div className="w-72 border-r border-slate-200 bg-white flex flex-col flex-shrink-0">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Process Timeline</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-6">
                {plan.iterations.map((iteration, iIdx) => (
                  <div key={iIdx} className="space-y-2">
                    <button
                      onClick={() => handleIterationChange(iIdx)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${activeIteration === iIdx ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${activeIteration === iIdx ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {iteration.iteration_number}
                      </div>
                      <span className="text-sm font-bold">Iteration {iteration.iteration_number}</span>
                    </button>

                    {activeIteration === iIdx && (
                      <div className="ml-4 space-y-1 pl-3 border-l-2 border-slate-100">
                        {iteration.evaluations.map((evalItem) => (
                          <button
                            key={evalItem.option.id}
                            onClick={() => setActiveOptionId(evalItem.option.id)}
                            className={`w-full text-left p-2 rounded-md text-xs transition-all ${activeOptionId === evalItem.option.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                          >
                            {evalItem.option.strategy.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Main Reasoning Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              {selectedOption ? (
                <div className="max-w-4xl mx-auto space-y-8">
                  {/* Agent Sequence Flow */}
                  <div className="flex items-center justify-between relative px-4">
                    <div className="absolute left-10 right-10 top-1/2 h-0.5 bg-slate-200 -z-0" />

                    {[
                      { id: 'operator', name: 'Operator Agent', icon: Target, color: 'text-blue-600', bg: 'bg-blue-100' },
                      { id: 'world', name: 'World Model', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-100' },
                      { id: 'scorer', name: 'Scorer Agent', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-100' }
                    ].map((agent, idx) => (
                      <button
                        key={agent.id}
                        onClick={() => setActiveAgentId(agent.id as any)}
                        className={`relative z-10 flex flex-col items-center gap-2 group transition-all transform ${activeAgentId === agent.id ? 'scale-110' : 'hover:scale-105'}`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${activeAgentId === agent.id ? agent.bg + ' ring-4 ring-white' : 'bg-white grayscale hover:grayscale-0'}`}>
                          <agent.icon className={`h-7 w-7 ${activeAgentId === agent.id ? agent.color : 'text-slate-400'}`} />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${activeAgentId === agent.id ? agent.color : 'text-slate-400'}`}>
                          {agent.name}
                        </span>
                        {activeAgentId === agent.id && (
                          <div className={`absolute -bottom-3 w-1.5 h-1.5 rounded-full ${agent.id === 'operator' ? 'bg-blue-500' : agent.id === 'world' ? 'bg-orange-500' : 'bg-green-500'}`} />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Monologue Box */}
                  <div className={`bg-white rounded-3xl p-8 shadow-xl border-t-8 transition-all ${activeAgentId === 'operator' ? 'border-blue-500' :
                    activeAgentId === 'world' ? 'border-orange-500' :
                      'border-green-500'
                    }`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl ${activeAgentId === 'operator' ? 'bg-blue-50 text-blue-600' :
                          activeAgentId === 'world' ? 'bg-orange-50 text-orange-600' :
                            'bg-green-50 text-green-600'
                          }`}>
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">
                            {activeAgentId === 'operator' ? 'Operator Inner Monologue' :
                              activeAgentId === 'world' ? 'World Model Logic' :
                                'Scorer Decision Matrix'}
                          </h2>
                          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
                            Chain of Thought Reasoning
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        ID: {activeAgentId?.toUpperCase()}_RUNTIME_01
                      </Badge>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative">
                      <div className="absolute top-4 right-4 opacity-10">
                        <Brain className="h-12 w-12" />
                      </div>
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 leading-relaxed font-mono text-sm whitespace-pre-wrap">
                          {activeAgentId === 'operator' ? (selectedOption.option.reasoning || selectedOption.option.rationale) :
                            activeAgentId === 'world' ? (selectedOption.simulation.reasoning || selectedOption.simulation.bottlenecks.join('\n')) :
                              (selectedOption.scores.reasoning || selectedOption.scores.recommendation)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Input Context</h4>
                        <p className="text-xs text-slate-600 font-medium truncate">
                          {activeAgentId === 'operator' ? 'Scenario + Constraints' :
                            activeAgentId === 'world' ? 'Staffing Plan + Constraints' :
                              'Simulation Results + Weights'}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Primary Objective</h4>
                        <p className="text-xs text-slate-600 font-medium truncate">
                          {activeAgentId === 'operator' ? 'Multi-Objective Strategy' :
                            activeAgentId === 'world' ? 'Operational Fidelity' :
                              'Global Optimization Alignment'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <Brain className="h-12 w-12 opacity-20" />
                  <p className="text-sm font-medium">Select an iteration and option to view reasoning</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (traceMode) {
      return (
        <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-200 px-6 py-4 flex-shrink-0 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-slate-900">Reasoning Trace</h1>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 animate-pulse">
                    Trace Active
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Full iteration history of agentic decision making
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                  {plan.iterations.length} Iterations
                </Badge>
                <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                  {plan.options_evaluated.length} Total Options
                </Badge>
              </div>
            </div>
          </div>

          {/* Trace Content */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="max-w-5xl mx-auto space-y-12">
              {plan.iterations.map((iteration, iIdx) => (
                <div key={iIdx} className="relative">
                  {/* Iteration Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-lg">
                      {iteration.iteration_number}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Iteration {iteration.iteration_number}</h3>
                      <p className="text-sm text-slate-500">
                        {iteration.feedback ? 'Refined based on previous feedback' : 'Initial generation phase'}
                      </p>
                    </div>
                  </div>

                  {/* Feedback Box */}
                  {iteration.feedback && (
                    <div className="mb-6 ml-14 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900 italic">
                      <div className="flex items-center gap-2 mb-1 not-italic font-bold text-amber-600">
                        <Info className="h-4 w-4" />
                        AGENT FEEDBACK
                      </div>
                      "{iteration.feedback}"
                    </div>
                  )}

                  {/* Options Grid */}
                  <div className="ml-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {iteration.evaluations.map((evalItem, eIdx) => (
                      <div
                        key={evalItem.option.id}
                        className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md ${plan.best_decision.option.id === evalItem.option.id
                          ? 'ring-2 ring-blue-500 border-blue-200'
                          : 'border-slate-200'
                          }`}
                      >
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Option {eIdx + 1}
                          </span>
                          <Badge className={
                            evalItem.scores.overall_score > 0.8 ? 'bg-green-100 text-green-700' :
                              evalItem.scores.overall_score > 0.6 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                          }>
                            {formatPercentage(evalItem.scores.overall_score)}
                          </Badge>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="font-semibold text-slate-900 text-sm h-10 overflow-hidden line-clamp-2">
                            {evalItem.option.strategy.replace('_', ' ')}
                          </div>

                          <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-50">
                            <div className="text-center">
                              <div className="text-[10px] text-slate-400 uppercase">DT</div>
                              <div className="text-xs font-bold">{evalItem.option.staffing.drive_thru}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[10px] text-slate-400 uppercase">KT</div>
                              <div className="text-xs font-bold">{evalItem.option.staffing.kitchen}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[10px] text-slate-400 uppercase">FC</div>
                              <div className="text-xs font-bold">{evalItem.option.staffing.front_counter}</div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-500">Wait Time</span>
                              <span className="font-medium">{evalItem.simulation.predicted_metrics.avg_wait_time_seconds}s</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-500">Revenue</span>
                              <span className="font-medium">{formatCurrency(evalItem.simulation.predicted_metrics.revenue)}</span>
                            </div>
                          </div>

                          {plan.best_decision.option.id === evalItem.option.id && (
                            <div className="pt-2">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase">
                                <Zap className="h-3 w-3 fill-blue-600" />
                                Optimal Selection
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Connector Line */}
                  {iIdx < plan.iterations.length - 1 && (
                    <div className="absolute left-[19px] top-10 bottom-[-48px] w-0.5 bg-slate-200 z-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const bestDecision = plan.best_decision;
    const metrics = bestDecision.simulation.predicted_metrics;
    const staffing = bestDecision.option.staffing;

    return (
      <div className="flex-1 bg-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Optimal Shift Plan</h1>
              <p className="text-sm text-slate-500 mt-1 capitalize">
                {plan.scenario.shift} Shift • {plan.scenario.weather} • {plan.scenario.day_of_week}, {formatDate(plan.scenario.date)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                Score: {formatPercentage(bestDecision.scores.overall_score)}
              </Badge>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                Confidence: {formatPercentage(bestDecision.simulation.confidence)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-4xl space-y-6">

            {/* Strategy Title */}
            <div className="bg-slate-900 text-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Winning Strategy</span>
              </div>
              <h2 className="text-xl font-bold mb-2 capitalize">{bestDecision.option.strategy.replace('_', ' ')}</h2>
              <p className="text-slate-300 text-sm italic">"{bestDecision.option.rationale}"</p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-medium text-slate-600">Staff Required</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{staffing.total}</div>
                <div className="text-xs text-slate-500 mt-1">employees total</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-xs font-medium text-slate-600">Expected Profit</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.revenue - metrics.labor_cost - metrics.food_cost)}</div>
                <div className="text-xs text-slate-500 mt-1">projected net</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                  <span className="text-xs font-medium text-slate-600">Revenue</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.revenue)}</div>
                <div className="text-xs text-slate-500 mt-1">gross sales</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Staffing Breakdown */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-slate-400" />
                  <h3 className="font-semibold text-slate-900">Station Allocation</h3>
                </div>
                <div className="space-y-4 flex-1">
                  {[
                    { name: 'Drive-Thru', count: staffing.drive_thru, color: 'bg-blue-500' },
                    { name: 'Kitchen', count: staffing.kitchen, color: 'bg-orange-500' },
                    { name: 'Front Counter', count: staffing.front_counter, color: 'bg-purple-500' }
                  ].map((station, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-700">{station.name}</span>
                        <span className="font-bold text-slate-900">{station.count} staff</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${station.color}`}
                          style={{ width: `${(station.count / staffing.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 italic text-[11px] text-slate-400">
                  * Allocation optimized for {bestDecision.scores.ranking} performance.
                </div>
              </div>

              {/* Performance Forecast */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-slate-400" />
                  <h3 className="font-semibold text-slate-900">Performance Forecast</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-slate-700">Avg Wait Time</span>
                    </div>
                    <span className="font-bold text-blue-900">{metrics.avg_wait_time_seconds}s</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smile className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-slate-700">Customer Satisfaction</span>
                    </div>
                    <span className="font-bold text-purple-900">{formatPercentage(metrics.order_accuracy)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-slate-700">Staff Utilization</span>
                    </div>
                    <span className="font-bold text-amber-900">{formatPercentage(metrics.staff_utilization)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Info className="h-4 w-4 text-slate-600" />
                      <span className="text-sm text-slate-700">Max Queue</span>
                    </div>
                    <span className="font-bold text-slate-900">{metrics.max_queue_length} cars</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Strengths & Weaknesses */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Agent Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-xs font-bold text-green-700 uppercase mb-2">Strengths</h4>
                  <ul className="space-y-1">
                    {bestDecision.scores.strengths.map((str, i) => (
                      <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 bg-green-500 rounded-full flex-shrink-0" />
                        {str}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="text-xs font-bold text-red-700 uppercase mb-2">Risks</h4>
                  <ul className="space-y-1">
                    {bestDecision.scores.weaknesses.map((weak, i) => (
                      <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 bg-red-500 rounded-full flex-shrink-0" />
                        {weak}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-sm text-indigo-900">
                  <span className="font-bold">Next Best Action:</span> {bestDecision.scores.recommendation}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6 justify-center">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                <Copy className="h-4 w-4 mr-2" />
                Copy JSON
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                <BookmarkPlus className="h-4 w-4 mr-2" />
                Save to Reports
              </Button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <h1 className="text-2xl font-semibold text-slate-900">Canvas</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto text-center mt-20">
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
            🧠
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Optimize?</h2>
          <p className="text-slate-600 max-w-lg mx-auto mb-8 text-lg">
            Configure your shift parameters in the <span className="font-semibold">Setting</span> panel on the left,
            then click <span className="font-semibold">Run Model</span> in the Studio to generate an AI-powered staffing plan.
          </p>
        </div>
      </div>
    </div>
  );
}