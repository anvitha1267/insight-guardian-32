import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const ImportUSASpending = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const handleImport = async () => {
    setStatus('loading');
    setMessage('Fetching multi-state spending data from USAspending.gov...');

    try {
      const { data, error } = await supabase.functions.invoke('fetch-usaspending');

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Import failed');

      setStatus('success');
      setMessage(`Imported ${data.records} records with ${data.anomalies} anomalies detected.`);
      queryClient.invalidateQueries({ queryKey: ['spending-data'] });
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Import failed');
    }
  };

  return (
    <div className="glass-panel rounded-lg p-4 flex items-center gap-4">
      <div className="flex-1">
        <p className="text-sm font-mono text-foreground">
          {status === 'idle' && 'Import real federal spending data across 14 US states from USAspending.gov'}
          {status === 'loading' && message}
          {status === 'success' && message}
          {status === 'error' && message}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {status === 'success' && <CheckCircle2 className="h-5 w-5 text-success" />}
        {status === 'error' && <AlertCircle className="h-5 w-5 text-destructive" />}
        <Button
          onClick={handleImport}
          disabled={status === 'loading'}
          size="sm"
          variant={status === 'error' ? 'destructive' : 'default'}
        >
          {status === 'loading' ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Importing...</>
          ) : (
            <><Download className="h-4 w-4" /> {status === 'error' ? 'Retry' : 'Import State Data'}</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ImportUSASpending;
