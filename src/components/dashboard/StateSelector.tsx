import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_STATES, useStateFilter } from '@/contexts/StateFilterContext';
import { MapPin } from 'lucide-react';

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

  return (
    <div className="glass-panel rounded-lg p-3 flex items-center gap-3">
      <MapPin className="h-4 w-4 text-primary" />
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">State</span>
      <Select value={selectedState} onValueChange={setSelectedState}>
        <SelectTrigger className="w-[200px] h-8 font-mono text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="font-mono">
          <SelectItem value={ALL_STATES}>All States</SelectItem>
          {states.map(s => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StateSelector;
