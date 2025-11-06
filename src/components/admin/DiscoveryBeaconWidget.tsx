import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface BeaconLog {
  id: string;
  indexer_name: string;
  status: 'success' | 'failed' | 'pending';
  response_code: number | null;
  response_body: any;
  created_at: string;
}

export function DiscoveryBeaconWidget() {
  const [logs, setLogs] = useState<BeaconLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({
    last_run: null as string | null,
    success_count: 0,
    failed_count: 0,
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('discovery_beacon_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setLogs((data as BeaconLog[]) || []);

      // Calculate stats from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentLogs = (data || []).filter(
        (log) => new Date(log.created_at) > sevenDaysAgo
      );

      setStats({
        last_run: data?.[0]?.created_at || null,
        success_count: recentLogs.filter((log) => log.status === 'success').length,
        failed_count: recentLogs.filter((log) => log.status === 'failed').length,
      });
    } catch (error) {
      console.error('Error fetching beacon logs:', error);
      toast.error('Failed to load beacon logs');
    } finally {
      setLoading(false);
    }
  };

  const runBeacon = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('discovery-beacon');

      if (error) throw error;

      toast.success(
        `Submission packages generated: ${data.successful}/${data.total} ready for manual submission`
      );

      // Refresh logs
      await fetchLogs();
    } catch (error: any) {
      console.error('Error running beacon:', error);
      toast.error(error.message || 'Failed to run Discovery Beacon');
    } finally {
      setRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'success' ? 'default' : status === 'failed' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Discovery Beacon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Discovery Beacon
            </CardTitle>
            <CardDescription>
              Generate submission packages for API directories and indexers
            </CardDescription>
          </div>
          <Button onClick={runBeacon} disabled={running} size="sm" className="bg-primary hover:bg-primary/90">
            <RefreshCw className={`w-4 h-4 mr-2 ${running ? 'animate-spin' : ''}`} />
            Generate Packages
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Last Run</p>
            <p className="text-lg font-semibold">
              {stats.last_run
                ? formatDistanceToNow(new Date(stats.last_run), { addSuffix: true })
                : 'Never'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Successful (7d)</p>
            <p className="text-lg font-semibold text-green-600">{stats.success_count}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Failed (7d)</p>
            <p className="text-lg font-semibold text-red-600">{stats.failed_count}</p>
          </div>
        </div>

        {/* Recent Logs */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Recent Submissions</h4>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No packages generated yet. Click "Generate Packages" to create submission packages.
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Directory</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.indexer_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          {getStatusBadge(log.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.response_body?.method ? (
                          <Badge variant="outline" className="text-xs">
                            {log.response_body.method}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
