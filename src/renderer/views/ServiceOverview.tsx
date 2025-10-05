import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import { ReactNode, useCallback, useEffect, useState } from 'react';

const readJson = async <T,>(path: string): Promise<T> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
};

type ServiceOverviewProps = {
  onLoadingChange?: (loading: boolean) => void;
  reloadToken?: number;
};

type MemoryUsageSnapshot = {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
};

type CpuSummary = {
  model: string;
  speedMhz: number;
  times: {
    user: number;
    nice: number;
    sys: number;
    idle: number;
    irq: number;
  };
};

type NetworkInterfaceSummary = {
  name: string;
  address: string;
  family: string;
  mac: string;
  internal: boolean;
  netmask: string;
  cidr: string | null;
};

type EnvSnapshot = {
  timestamp: string;
  hostname: string;
  arch: string;
  platform: string;
  release: string;
  type: string;
  systemUptimeSeconds: number;
  loadAverages: number[];
  totalMemoryBytes: number;
  freeMemoryBytes: number;
  usedMemoryBytes: number;
  memoryUsage: MemoryUsageSnapshot;
  cpuCount: number;
  cpus: CpuSummary[];
  processInfo: {
    pid: number;
    nodeVersion: string;
    uptimeSeconds: number;
    cwd: string;
    argv: string[];
    execPath: string;
    versions: Record<string, string | undefined>;
  };
  userInfo: {
    username: string;
    homedir: string;
    shell: string;
  };
  networkInterfaces: NetworkInterfaceSummary[];
  envSummary: {
    totalVariables: number;
    keysSample: string[];
  };
};

const formatBytes = (value: number): string => {
  if (!Number.isFinite(value) || value < 0) {
    return 'N/A';
  }
  if (value === 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const convertedValue = value / 1024 ** exponent;
  return `${convertedValue.toFixed(convertedValue >= 10 ? 1 : 2)} ${units[exponent]}`;
};

const formatSeconds = (value: number): string => {
  if (!Number.isFinite(value) || value < 0) {
    return 'N/A';
  }
  const seconds = Math.floor(value % 60);
  const minutes = Math.floor((value / 60) % 60);
  const hours = Math.floor((value / 3600) % 24);
  const days = Math.floor(value / 86400);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
};

const KeyValueRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
    <Typography variant="body2" color="text.secondary" sx={{ pr: 2 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ textAlign: 'right' }}>
      {value}
    </Typography>
  </Stack>
);

const formatLoadAverage = (values: number[]) => values.map((value) => value.toFixed(2)).join(' / ');

export const ServiceOverview = ({ onLoadingChange, reloadToken = 0 }: ServiceOverviewProps) => {
  const [envData, setEnvData] = useState<EnvSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEnvInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    onLoadingChange?.(true);
    try {
      const data = await readJson<EnvSnapshot>('/api1/env');
      setEnvData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setEnvData(null);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  }, [onLoadingChange]);

  useEffect(() => {
    void loadEnvInfo();
  }, [loadEnvInfo, reloadToken]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Service Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This view displays detailed environment information gathered by the backend via <code>/api1/env</code>. Use
            the refresh action to collect an updated snapshot from the server.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => {
            void loadEnvInfo();
          }}
          disabled={loading}
          sx={{ mt: { xs: 2, md: 0 }, alignSelf: { xs: 'flex-start', md: 'center' } }}
        >
          Refresh
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {envData ? (
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
          <Stack spacing={2} sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System
                </Typography>
                <KeyValueRow label="Timestamp" value={new Date(envData.timestamp).toLocaleString()} />
                <KeyValueRow label="Hostname" value={envData.hostname} />
                <KeyValueRow label="Platform" value={`${envData.platform} (${envData.type})`} />
                <KeyValueRow label="Release" value={envData.release} />
                <KeyValueRow label="Architecture" value={envData.arch} />
                <KeyValueRow label="System Uptime" value={formatSeconds(envData.systemUptimeSeconds)} />
                <KeyValueRow label="Load Average (1/5/15m)" value={formatLoadAverage(envData.loadAverages)} />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Memory
                </Typography>
                <KeyValueRow label="Total" value={formatBytes(envData.totalMemoryBytes)} />
                <KeyValueRow label="Used" value={formatBytes(envData.usedMemoryBytes)} />
                <KeyValueRow label="Free" value={formatBytes(envData.freeMemoryBytes)} />
                <KeyValueRow label="Process RSS" value={formatBytes(envData.memoryUsage.rss)} />
                <KeyValueRow label="Heap Used" value={formatBytes(envData.memoryUsage.heapUsed)} />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Process
                </Typography>
                <KeyValueRow label="PID" value={envData.processInfo.pid} />
                <KeyValueRow label="Node Version" value={envData.processInfo.nodeVersion} />
                <KeyValueRow label="Process Uptime" value={formatSeconds(envData.processInfo.uptimeSeconds)} />
                <KeyValueRow label="Working Directory" value={envData.processInfo.cwd} />
                <KeyValueRow label="Exec Path" value={envData.processInfo.execPath} />
                <KeyValueRow label="Arguments" value={envData.processInfo.argv.join(' ')} />
              </CardContent>
            </Card>
          </Stack>

          <Stack spacing={2} sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  CPU
                </Typography>
                <KeyValueRow label="Logical Cores" value={envData.cpuCount} />
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {envData.cpus.slice(0, 8).map((core, index) => (
                    <Box
                      key={`${core.model}-${index}`}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1,
                      }}
                    >
                      <Typography variant="subtitle2">
                        Core #{index + 1}: {core.model}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {core.speedMhz} MHz — user {core.times.user} | sys {core.times.sys} | idle {core.times.idle}
                      </Typography>
                    </Box>
                  ))}
                  {envData.cpus.length > 8 ? (
                    <Typography variant="body2" color="text.secondary">
                      Showing {Math.min(8, envData.cpus.length)} of {envData.cpus.length} cores.
                    </Typography>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  User & Environment
                </Typography>
                <KeyValueRow label="Username" value={envData.userInfo.username || 'Unknown'} />
                <KeyValueRow label="Home Directory" value={envData.userInfo.homedir || 'Unknown'} />
                <KeyValueRow label="Shell" value={envData.userInfo.shell || 'Unknown'} />
                <KeyValueRow label="Env Variables" value={envData.envSummary.totalVariables} />
                <KeyValueRow label="Env Keys Sample" value={envData.envSummary.keysSample.join(', ') || 'N/A'} />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Network Interfaces
                </Typography>
                <Stack spacing={1}>
                  {envData.networkInterfaces.map((net) => (
                    <Box
                      key={`${net.name}-${net.address}`}
                      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}
                    >
                      <Typography variant="subtitle2">{net.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {net.address} ({net.family}) — MAC {net.mac}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Internal: {net.internal ? 'Yes' : 'No'} | Netmask: {net.netmask} | CIDR: {net.cidr ?? 'N/A'}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Stack>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary">
              No environment information available yet. Use the refresh button to request a snapshot.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Typography variant="caption" color="text.secondary">
        Data collected at: {envData ? new Date(envData.timestamp).toLocaleString() : 'N/A'}
      </Typography>
    </Stack>
  );
};

export default ServiceOverview;
