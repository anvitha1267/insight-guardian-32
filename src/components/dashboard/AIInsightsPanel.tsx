import { AlertTriangle, Info, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { useAiInsights } from '@/hooks/useSpendingData';
import { Skeleton } from '@/components/ui/skeleton';

const severityConfig = {
  critical: { icon: XCircle, border: 'border-anomaly/40', bg: 'bg-anomaly/10', text: 'text-anomaly', label: 'CRITICAL' },
  warning: { icon: AlertTriangle, border: 'border-warning/40', bg: 'bg-warning/10', text: 'text-warning', label: 'WARNING' },
  info: { icon: Info, border: 'border-primary/40', bg: 'bg-primary/10', text: 'text-primary', label: 'INFO' },
  success: { icon: CheckCircle2, border: 'border-success/40', bg: 'bg-success/10', text: 'text-success', label: 'RESOLVED' },
};

const AIInsightsPanel = () => {
  const { data: insights, isLoading } = useAiInsights();

  if (isLoading || !insights) {
    return <Skeleton className="h-[400px] rounded-lg" />;
  }

  return (
    <div className="glass-panel rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-sm uppercase tracking-wider text-muted-foreground">Analytical Insights</h2>
      </div>
      <div className="space-y-4">
        {insights.map((insight, i) => {
          const config = severityConfig[insight.severity as keyof typeof severityConfig];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <div key={i} className={`rounded-lg border ${config.border} ${config.bg} p-4`}>
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.text}`} />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono uppercase tracking-wider ${config.text}`}>{config.label}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{insight.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                  <p className="text-xs text-secondary-foreground italic">→ {insight.recommendation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AIInsightsPanel;
