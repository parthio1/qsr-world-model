import { Button } from './ui/button';
import { ThumbsUp, ThumbsDown, Copy, BookmarkPlus, Loader2, Users, DollarSign, Clock, Smile, TrendingUp, AlertCircle, BarChart3, Info, Globe, ShieldAlert, CheckCircle2, FlaskConical, LayoutDashboard, History } from 'lucide-react';
import { Zap, Brain, MessageSquare, ShieldCheck, Activity, Target, ArrowRight } from 'lucide-react';
import { PlanResponse, EvaluateResponse, OptionEvaluation } from '../types';
import { Badge } from './ui/badge';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Radar as RadarArea } from 'recharts';
import { useState } from 'react';

interface MainWorkspaceProps {
  plan: PlanResponse | null;
  evaluation: EvaluateResponse | null;
  isLoadingPlan: boolean;
  isLoadingEvaluation: boolean;
  error: string | null;
  traceMode: boolean;
  reasoningMode: boolean;
}

function OptionCard({ evalItem, isBest, isProposed }: { evalItem: OptionEvaluation, isBest: boolean, isProposed?: boolean }) {
  return (
    <div
      className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md ${isBest
        ? 'ring-2 ring-blue-500 border-blue-200'
        : 'border-slate-200'
        }`}
    >
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {isProposed ? 'PROPOSED' : 'REFINED OPTION'}
        </span>
        <div className="flex gap-1.5 focus:outline-none">
          <div className="flex gap-1">
            <div className={`w-8 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${evalItem.scores.profit.raw_score > 0.8 ? 'bg-emerald-100 text-emerald-700' : evalItem.scores.profit.raw_score > 0.5 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`} title={`Profit: ${formatPercentage(evalItem.scores.profit.raw_score)}`}>
              P
            </div>
            <div className={`w-8 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${evalItem.scores.customer_satisfaction.raw_score > 0.8 ? 'bg-emerald-100 text-emerald-700' : evalItem.scores.customer_satisfaction.raw_score > 0.5 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`} title={`Guest: ${formatPercentage(evalItem.scores.customer_satisfaction.raw_score)}`}>
              G
            </div>
            <div className={`w-8 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${evalItem.scores.staff_wellbeing.raw_score > 0.8 ? 'bg-emerald-100 text-emerald-700' : evalItem.scores.staff_wellbeing.raw_score > 0.5 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`} title={`Staff: ${formatPercentage(evalItem.scores.staff_wellbeing.raw_score)}`}>
              S
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="font-semibold text-slate-900 text-sm h-10 overflow-hidden line-clamp-2">
          {evalItem.option.strategy.replace(/_/g, ' ')}
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

        {isBest && (
          <div className="pt-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase">
              <Zap className="h-3 w-3 fill-blue-600" />
              Optimal Selection
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MainWorkspace({ plan, evaluation, isLoadingPlan, isLoadingEvaluation, error, traceMode, reasoningMode }: MainWorkspaceProps) {
  const [activeIteration, setActiveIteration] = useState(0);
  const [activeOptionId, setActiveOptionId] = useState<string | null>(null);
  const [activeAgentId, setActiveAgentId] = useState<'context' | 'capacity' | 'operator' | 'world' | 'scorer' | null>('operator');

  // Set default option when iteration changes
  const handleIterationChange = (index: number) => {
    setActiveIteration(index);
    if (plan && plan.iterations[index]) {
      setActiveOptionId(plan.iterations[index].evaluations[0]?.option.id || null);
    }
  };

  // Helper for Qualitative States
  const getQualitativeState = (metric: string, value: number) => {
    switch (metric) {
      case 'wait':
        if (value < 120) return { label: 'PEAK VELOCITY', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Zap };
        if (value < 300) return { label: 'MODERATE DELAY', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock };
        return { label: 'SYSTEM CLOG', color: 'text-rose-600', bg: 'bg-rose-50', icon: ShieldAlert };
      case 'csat':
        if (value > 0.90) return { label: 'GUEST DELIGHT', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Smile };
        if (value > 0.75) return { label: 'SATISFIED', color: 'text-blue-600', bg: 'bg-blue-50', icon: Smile };
        return { label: 'DISSATISFIED', color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertCircle };
      case 'utilization':
        if (value > 0.90) return { label: 'BURNOUT RISK', color: 'text-rose-600', bg: 'bg-rose-50', icon: ShieldAlert };
        if (value > 0.70) return { label: 'OPTIMAL LOAD', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Activity };
        return { label: 'UNDER-UTILIZED', color: 'text-slate-500', bg: 'bg-slate-50', icon: Users };
      default:
        return { label: 'NORMAL', color: 'text-slate-600', bg: 'bg-slate-50', icon: Info };
    }
  };

  if (error) {
    return (
      <div className="flex-1 bg-white flex flex-col overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex-shrink-0 flex justify-center">
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
        <div className="border-b border-slate-200 px-6 py-4 flex-shrink-0 flex justify-center">
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
      const isInitial = activeIteration === -1;
      const currentIteration = isInitial ? null : (plan.iterations[activeIteration] || plan.iterations[0]);
      const selectedOption = isInitial
        ? plan.restaurant_operator_plan
        : (currentIteration?.evaluations.find(e => e.option.id === (activeOptionId || currentIteration.evaluations[0]?.option.id)) || currentIteration?.evaluations[0]);

      return (
        <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 flex-shrink-0 bg-white shadow-sm">
            <div className="flex items-center justify-center relative">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-slate-900">Canvas</h1>
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
            <div className="w-72 border-r border-slate-200 bg-white flex flex-col flex-shrink-0">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Process Timeline</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-6">
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setActiveIteration(-1);
                      setActiveOptionId(plan.restaurant_operator_plan.option.id);
                    }}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${activeIteration === -1 ? 'bg-slate-600 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'}`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${activeIteration === -1 ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      0
                    </div>
                    <span className="text-sm font-bold">Restaurant Operator</span>
                  </button>
                  {activeIteration === -1 && (
                    <div className="ml-4 space-y-1 pl-3 border-l-2 border-slate-100">
                      <div className="w-full text-left p-2 rounded-md text-xs bg-blue-50 text-blue-700 font-bold">
                        {plan.restaurant_operator_plan.option.strategy.replace(/_/g, ' ')}
                      </div>
                    </div>
                  )}
                </div>

                {plan.iterations.map((iteration, iIdx) => (
                  <div key={iIdx} className="space-y-2">
                    <button
                      onClick={() => handleIterationChange(iIdx)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${activeIteration === iIdx ? 'bg-slate-600 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${activeIteration === iIdx ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {iteration.iteration_number}
                      </div>
                      <span className="text-sm font-bold">Shadow Iteration {iteration.iteration_number}</span>
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

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              {selectedOption || activeAgentId === 'context' || activeAgentId === 'capacity' ? (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="flex items-center justify-between relative px-4">
                    <div className="absolute left-10 right-10 top-1/2 h-0.5 bg-slate-200 -z-0" />
                    {[
                      { id: 'context', name: 'World Context', icon: Globe, color: 'text-purple-600', bg: 'bg-purple-100' },
                      { id: 'capacity', name: 'Capacity Model', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-100' },
                      { id: 'operator', name: 'Operator Agent', icon: Target, color: 'text-blue-600', bg: 'bg-blue-100' },
                      { id: 'world', name: 'World Model', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-100' },
                      { id: 'scorer', name: 'Scorer Agent', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-100' }
                    ].map((agent) => (
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

                  <div className={`bg-white rounded-3xl p-8 shadow-xl border-t-8 transition-all ${activeAgentId === 'context' ? 'border-purple-500' :
                    activeAgentId === 'capacity' ? 'border-indigo-500' :
                      activeAgentId === 'operator' ? 'border-blue-500' :
                        activeAgentId === 'world' ? 'border-orange-500' :
                          'border-green-500'
                    }`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl ${activeAgentId === 'context' ? 'bg-purple-50 text-purple-600' :
                          activeAgentId === 'capacity' ? 'bg-indigo-50 text-indigo-600' :
                            activeAgentId === 'operator' ? 'bg-blue-50 text-blue-600' :
                              activeAgentId === 'world' ? 'bg-orange-50 text-orange-600' :
                                'bg-green-50 text-green-600'
                          }`}>
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">
                            {activeAgentId === 'context' ? 'World Context Logic' :
                              activeAgentId === 'capacity' ? 'Capacity Analysis Logic' :
                                activeAgentId === 'operator' ? (activeIteration === -1 ? 'Restaurant Operator Monologue' : 'Shadow Operator Monologue') :
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
                          {activeAgentId === 'context' ? (plan.demand_prediction.reasoning || "Contextual demand analysis based on environment.") :
                            activeAgentId === 'capacity' ? (plan.capacity_analysis.reasoning || "Infrastructure bottleneck & throughput analysis.") :
                              activeAgentId === 'operator' ? (selectedOption?.option.reasoning || selectedOption?.option.rationale) :
                                activeAgentId === 'world' ? (selectedOption?.simulation.reasoning || selectedOption?.simulation.bottlenecks.join('\n')) :
                                  (selectedOption?.scores.reasoning || selectedOption?.scores.recommendation)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <Brain className="h-12 w-12 opacity-20" />
                  <p className="text-sm font-medium">Select an agent or iteration to view reasoning</p>
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
          <div className="border-b border-slate-200 px-6 py-4 flex-shrink-0 bg-white shadow-sm">
            <div className="flex items-center justify-center relative">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-slate-900">Canvas</h1>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 animate-pulse">
                    Trace Active
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Full iteration history of agentic decision making
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="max-w-5xl mx-auto space-y-12">
              <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold shadow-lg">
                    0
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Initial Decision</h3>
                    <p className="text-sm text-slate-500">
                      Restaurant Operator proposed staffing strategy
                    </p>
                  </div>
                </div>
                <div className="ml-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                  <OptionCard evalItem={plan.restaurant_operator_plan} isBest={false} isProposed={true} />
                </div>
                <div className="absolute left-[19px] top-10 bottom-[-48px] w-0.5 bg-slate-200 z-0" />
              </div>

              {plan.iterations.map((iteration, iIdx) => (
                <div key={iIdx} className="relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold shadow-lg">
                      {iteration.iteration_number}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Shadow Refinement {iteration.iteration_number}</h3>
                      <p className="text-sm text-slate-500">
                        Shadow Operator optimizing based on previous feedback
                      </p>
                    </div>
                  </div>

                  {iteration.feedback && (
                    <div className="mb-6 ml-14 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900 italic">
                      <div className="flex items-center gap-2 mb-1 not-italic font-bold text-amber-600">
                        <Info className="h-4 w-4" />
                        AGENT FEEDBACK
                      </div>
                      "{iteration.feedback}"
                    </div>
                  )}

                  <div className="ml-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {iteration.evaluations.map((evalItem) => (
                      <OptionCard
                        key={evalItem.option.id}
                        evalItem={evalItem}
                        isBest={plan.shadow_operator_best_plan.option.id === evalItem.option.id}
                      />
                    ))}
                  </div>
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

    const bestDecision = plan.shadow_operator_best_plan;
    const proposedDecision = plan.restaurant_operator_plan;
    const metrics = bestDecision.simulation.predicted_metrics;
    const proposedMetrics = proposedDecision.simulation.predicted_metrics;

    const bestIteration = plan.iterations.find(it => it.evaluations.some(e => e.option.id === bestDecision.option.id));
    const iterationRef = bestIteration ? `Iteration ${bestIteration.iteration_number}` : 'Initial Plan';

    const waitState = getQualitativeState('wait', metrics.avg_wait_time_seconds);
    const csatState = getQualitativeState('csat', metrics.order_accuracy);
    const utilState = getQualitativeState('utilization', metrics.staff_utilization);
    const averageScore = (bestDecision.scores.profit.raw_score + bestDecision.scores.customer_satisfaction.raw_score + bestDecision.scores.staff_wellbeing.raw_score) / 3;
    const verdict = averageScore > 0.85 ? 'VIABLE' : averageScore > 0.65 ? 'STRESS_DETECTION' : 'SYSTEM_FAILURE';

    return (
      <div className="flex-1 bg-white flex flex-col overflow-hidden">
        <div className="border-b border-slate-100 px-8 py-6 flex-shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-200">
                <FlaskConical className="h-6 w-6 text-blue-400" />
              </div>
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 text-center">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Canvas</h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  {formatDate(plan.scenario.date)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full text-[10px] font-bold uppercase tracking-widest border-slate-200">
                <Copy className="h-3 w-3 mr-2 text-slate-400" /> Export
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto p-8 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-12 space-y-8">
                <div className="space-y-6">

                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Labor Target Score', key: 'profit', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Wait Time Score', key: 'customer_satisfaction', icon: Smile, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Utilization Score', key: 'staff_wellbeing', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' }
                  ].map((obj) => {
                    const bestScore = bestDecision.scores[obj.key as keyof typeof bestDecision.scores] as any;
                    const proposedScore = proposedDecision.scores[obj.key as keyof typeof proposedDecision.scores] as any;
                    const delta = Math.round((bestScore.raw_score - proposedScore.raw_score) * 100);

                    return (
                      <div key={obj.key} className="p-6 bg-white border border-slate-200 rounded-[24px] space-y-4 shadow-sm relative overflow-hidden group">
                        <div className="flex items-center justify-between relative z-10">
                          <div className={`p-2 rounded-xl ${obj.bg} ${obj.color}`}>
                            <obj.icon className="h-4 w-4" />
                          </div>
                          <Badge variant="outline" className={`${delta >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'} text-[10px] font-black`}>
                            {delta >= 0 ? '+' : ''}{delta}%
                          </Badge>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 block mb-1">{obj.label}</span>
                          <div className="text-3xl font-black text-slate-900 tracking-tighter">
                            {formatPercentage(bestScore.raw_score)}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Baseline</span>
                          <span className="text-xs font-bold text-slate-400 line-through decoration-rose-500/20">{formatPercentage(proposedScore.raw_score)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                    <div className="flex gap-4 items-center">
                      <div className="p-3 bg-white rounded-xl shadow-sm"><TrendingUp className="h-5 w-5 text-emerald-500" /></div>
                      <div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenue Impact</div>
                        <div className="text-xl font-bold text-slate-900">{formatCurrency(metrics.revenue)}</div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                      +{formatCurrency(metrics.revenue - proposedMetrics.revenue)}
                    </Badge>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                    <div className="flex gap-4 items-center">
                      <div className="p-3 bg-white rounded-xl shadow-sm"><Clock className="h-5 w-5 text-blue-500" /></div>
                      <div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Wait Time Reduction</div>
                        <div className="text-xl font-bold text-slate-900">{metrics.avg_wait_time_seconds}s</div>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
                      -{proposedMetrics.avg_wait_time_seconds - metrics.avg_wait_time_seconds}s
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-1 bg-slate-900 rounded-full" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Optimization Delta</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'System Clog', proposed: `${proposedMetrics.avg_wait_time_seconds}s`, optimized: `${metrics.avg_wait_time_seconds}s`, improved: metrics.avg_wait_time_seconds < proposedMetrics.avg_wait_time_seconds, state: waitState, sub: 'Avg Service Time' },
                { label: 'Guest Delight', proposed: formatPercentage(proposedMetrics.order_accuracy), optimized: formatPercentage(metrics.order_accuracy), improved: metrics.order_accuracy > proposedMetrics.order_accuracy, state: csatState, sub: 'Guest Accuracy' },
                { label: 'Staff Load', proposed: formatPercentage(proposedMetrics.staff_utilization), optimized: formatPercentage(metrics.staff_utilization), improved: Math.abs(0.75 - metrics.staff_utilization) < Math.abs(0.75 - proposedMetrics.staff_utilization), state: utilState, sub: 'Operational Load' }
              ].map((item, idx) => (
                <div key={idx} className={`p-8 rounded-[32px] border transition-all hover:shadow-xl hover:translate-y--1 group ${item.state.bg} ${item.state.color.replace('text-', 'border-').replace('600', '100')}`}>
                  <div className="flex items-center justify-between mb-8">
                    <div className={`p-3 rounded-2xl bg-white shadow-md ${item.state.color}`}><item.state.icon className="h-6 w-6" /></div>
                    <Badge variant="outline" className={`font-black tracking-widest uppercase text-[8px] border-none opacity-60`}>{item.label}</Badge>
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <div className="text-[10px] font-black opacity-30 uppercase tracking-widest">Proposed</div>
                        <div className="text-3xl font-black opacity-20 tracking-tighter decoration-rose-500/50 decoration-2 line-through">{item.proposed}</div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-[10px] font-black opacity-30 uppercase tracking-widest">Optimized</div>
                        <div className="text-5xl font-black tracking-tighter group-hover:scale-110 transition-transform origin-right">{item.optimized}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
                        <span>{item.sub}</span>
                        <span className={item.improved ? 'text-emerald-600' : 'text-rose-600'}>{item.improved ? 'Improvement' : 'Observation'}</span>
                      </div>
                      <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ease-out ${item.improved ? 'bg-emerald-500/60' : 'bg-rose-500/60'}`} style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2"> </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden">
      <div className="border-b border-slate-200 px-6 py-4 flex-shrink-0 flex justify-center">
        <h1 className="text-2xl font-semibold text-slate-900">Canvas</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto text-center mt-20">
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">🧠</div>
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