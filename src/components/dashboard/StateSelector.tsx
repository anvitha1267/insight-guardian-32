import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_STATES, useStateFilter } from '@/contexts/StateFilterContext';
import { MapPin } from 'lucide-react';
import { useEffect } from 'react';

const StateSelector = () => {
  const { selectedState, setSelectedState } = useStateFilter();

  const { data: states = [] } = useQuery({
    queryKey: ['available-states'],
    queryFn: async () => {
      const { data, error } = await supabase.from('spending_data').select('category');
      if (error) throw error;
      return [...new Set((data ?? []).map(d => d.category as string))].sort();
    },
  });

  // Default to the first available state so the user always sees individual-state data.
  useEffect(() => {
    if (selectedState === ALL_STATES && states.length > 0) {
      setSelectedState(states[0]);
    }
  }, [states, selectedState, setSelectedState]);

  return (
    <div className="glass-panel rounded-lg p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground leading-none">Viewing State</p>
          <p className="text-sm font-heading text-foreground mt-1 leading-none">Select a state to drill into</p>
        </div>
      </div>
      <div className="flex-1" />
      <Select value={selectedState} onValueChange={setSelectedState}>
        <SelectTrigger className="w-full sm:w-[260px] h-10 font-mono text-sm">
          <SelectValue placeholder="Choose a state…" />
        </SelectTrigger>
        <SelectContent className="font-mono max-h-[320px]">
          <SelectItem value={ALL_STATES}>All States (combined)</SelectItem>
          {states.map(s => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StateSelector;
