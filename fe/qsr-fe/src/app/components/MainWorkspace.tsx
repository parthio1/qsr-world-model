import { Button } from './ui/button';
import { ThumbsUp, ThumbsDown, Copy, BookmarkPlus, Loader2, Users, DollarSign, Clock, Smile, TrendingUp, AlertCircle, BarChart3, Info } from 'lucide-react';
import { Zap } from 'lucide-react';
import { PlanResponse, EvaluateResponse } from '../types';
import { Badge } from './ui/badge';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';

interface MainWorkspaceProps {
  plan: PlanResponse | null;
  evaluation: EvaluateResponse | null;
  isLoadingPlan: boolean;
  isLoadingEvaluation: boolean;
  error: string | null;
}

export function MainWorkspace({ plan, evaluation, isLoadingPlan, isLoadingEvaluation, error }: MainWorkspaceProps) {
  // Error State
  if (error) {
    return (
      <div className="flex-1 bg-white flex flex-col overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <h1 className="text-2xl font-semibold text-slate-900">Modeling Canvas</h1>
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
          <h1 className="text-2xl font-semibold text-slate-900">Modeling Canvas</h1>
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
        <h1 className="text-2xl font-semibold text-slate-900">Modeling Canvas</h1>
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