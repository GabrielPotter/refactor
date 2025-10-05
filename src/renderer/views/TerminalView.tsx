import { useState } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';

const TerminalView = () => {
  const [command, setCommand] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    const trimmed = command.trim();
    if (!trimmed) {
      setOutput('Please enter a command before sending.');
      return;
    }

    setIsSending(true);
    setOutput('');

    try {
      const response = await fetch('http://localhost:3000/api2/console', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command: trimmed })
      });

      const payload = await response.json();
      const formatted = JSON.stringify(payload, null, 2);
      setOutput(formatted);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setOutput(JSON.stringify({ status: 'error', message }, null, 2));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Terminal
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Send commands to the backend console endpoint and inspect the response.
        </Typography>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Command
        </Typography>
        <CodeMirror
          value={command}
          height="160px"
          onChange={(value) => setCommand(value)}
          theme="light"
        />
        <Stack direction="row" spacing={1} sx={{ mt: 2 }} justifyContent="flex-end">
          <Button variant="contained" onClick={handleSend} disabled={isSending}>
            {isSending ? 'Sending…' : 'Send'}
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Response
        </Typography>
        <CodeMirror value={output} height="240px" editable={false} theme="light" />
      </Paper>
    </Stack>
  );
};

export default TerminalView;
