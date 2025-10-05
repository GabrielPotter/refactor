import { JSX, useMemo, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  IconButton,
  Tooltip,
  Stack,
  ThemeProvider,
  CssBaseline,
  createTheme,
  Divider,
  Paper
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import StorageIcon from '@mui/icons-material/Storage';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import RefreshIcon from '@mui/icons-material/Refresh';
import BugReportIcon from '@mui/icons-material/BugReport';
import TerminalIcon from '@mui/icons-material/Terminal';
import type { SvgIconComponent } from '@mui/icons-material';
import ServiceOverview from './views/ServiceOverview';
import Placeholder from './views/Placeholder';
import TesterView from './views/TesterView';
import TerminalView from './views/TerminalView';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2'
    },
    background: {
      default: '#f5f5f5'
    }
  }
});

type ViewKey = 'home' | 'analytics' | 'storage' | 'topology' | 'tester' | 'terminal';

type ViewConfig = {
  key: ViewKey;
  label: string;
  icon: SvgIconComponent;
  description?: string;
  renderer: () => JSX.Element;
  supportsRefresh?: boolean;
};

const App = () => {
  const [activeView, setActiveView] = useState<ViewKey>('home');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const views: ViewConfig[] = useMemo(
    () => [
      {
        key: 'home',
        label: 'Home',
        icon: HomeIcon,
        renderer: () => (
          <ServiceOverview onLoadingChange={setIsRefreshing} reloadToken={refreshToken} />
        ),
        supportsRefresh: true
      },
      {
        key: 'analytics',
        label: 'Analytics',
        icon: AnalyticsIcon,
        description: 'Insights and dashboards coming soon.',
        renderer: () => (
          <Placeholder
            title="Analytics"
            description="Insights and dashboards coming soon."
          />
        )
      },
      {
        key: 'storage',
        label: 'Storage',
        icon: StorageIcon,
        description: 'Manage data stores and schemas. Under construction.',
        renderer: () => (
          <Placeholder
            title="Storage"
            description="Manage data stores and schemas. Under construction."
          />
        )
      },
      {
        key: 'topology',
        label: 'Topology',
        icon: DeviceHubIcon,
        description: 'Visualize system topology. Coming soon.',
        renderer: () => (
          <Placeholder
            title="Topology"
            description="Visualize system topology. Coming soon."
          />
        )
      },
      {
        key: 'tester',
        label: 'Tester',
        icon: BugReportIcon,
        description: 'Load local JSON files for quick inspection.',
        renderer: () => <TesterView />,
        supportsRefresh: false
      },
      {
        key: 'terminal',
        label: 'Terminal',
        icon: TerminalIcon,
        description: 'Send console commands to the server.',
        renderer: () => <TerminalView />,
        supportsRefresh: false
      }
    ],
    [refreshToken]
  );

  const active = views.find((view) => view.key === activeView) ?? views[0];

  const triggerRefresh = () => {
    if (!active.supportsRefresh) {
      return;
    }
    setIsRefreshing(true);
    setRefreshToken((token) => token + 1);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Refactor Admin GUI
            </Typography>
            {active.supportsRefresh ? (
              <Tooltip title="Refresh">
                <span>
                  <IconButton color="inherit" disabled={isRefreshing} onClick={triggerRefresh}>
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
            ) : null}
          </Toolbar>
        </AppBar>
        <Container
          maxWidth={false}
          disableGutters
          sx={{
            display: 'flex',
            flex: 1,
            py: 4,
            px: { xs: 2, md: 4 }
          }}
        >
          <Paper
            elevation={3}
            sx={{
              width: { xs: 64, sm: 72, md: 80 },
              mr: { xs: 2, md: 4 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 2,
              justifyContent: 'space-between',
              height: '100%'
            }}
          >
            <Stack alignItems="center" spacing={2} sx={{ width: '100%', flexGrow: 1 }}>
              {views.map(({ key, label, icon: Icon }) => {
                const selected = key === active.key;
                return (
                  <Tooltip key={key} title={label} placement="right">
                    <IconButton
                      size="large"
                      onClick={() => {
                        setActiveView(key);
                        setIsRefreshing(false);
                      }}
                      sx={{
                        width: '100%',
                        borderRadius: 2,
                        bgcolor: selected ? 'primary.light' : 'transparent',
                        color: selected ? 'common.white' : 'inherit',
                        transition: 'background-color 0.2s ease',
                        '&:hover': {
                          bgcolor: selected ? 'primary.main' : 'action.hover'
                        }
                      }}
                    >
                      <Icon />
                    </IconButton>
                  </Tooltip>
                );
              })}
            </Stack>
            <Divider sx={{ my: 2, width: '100%' }} />
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', px: 1 }}>
              Views
            </Typography>
          </Paper>
          <Box sx={{ flex: 1, overflow: 'auto', px: { xs: 1, md: 2 } }}>{active.renderer()}</Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
