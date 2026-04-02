
-- Spending data points table
CREATE TABLE public.spending_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL,
  amount INTEGER NOT NULL,
  category TEXT NOT NULL,
  is_anomaly BOOLEAN NOT NULL DEFAULT false,
  expected INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI insights table
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info', 'success')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spending_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Public read access (this is dashboard data, not user-specific)
CREATE POLICY "Anyone can view spending data" ON public.spending_data FOR SELECT USING (true);
CREATE POLICY "Anyone can view AI insights" ON public.ai_insights FOR SELECT USING (true);
