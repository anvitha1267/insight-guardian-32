import { Activity, Bell } from 'lucide-react';

const DashboardHeader = () => (
  <header className="flex items-center justify-between py-6">
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
        <Activity className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
          SpendGuard
        </h1>
        <p className="text-xs text-muted-foreground font-mono">Multi-State Federal Spending · USAspending.gov</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-muted-foreground">
        Last scan: 2 min ago
      </span>
      <div className="relative">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-anomaly animate-pulse-glow" />
      </div>
    </div>
  </header>
);

export default DashboardHeader;
