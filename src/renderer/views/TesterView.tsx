import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { ChangeEvent, useState } from 'react';
import { CommandInterpreter, executeScripts } from '../../services/CommandInterpreter';
import { createExecutors } from '../services/ExecutorFns';

const TesterView = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [executorContent, setExecutorContent] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState<number>(12);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName(null);
      setRawContent('');
      setLoadError(null);
      setExecutorContent('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result;
        if (typeof text !== 'string') {
          throw new Error('Unable to read file content as text.');
        }
        setRawContent(text);
        setFileName(file.name);
        setLoadError(null);
        setExecutorContent('');
      } catch (parseError) {
        setRawContent('');
        setFileName(file.name);
        setLoadError(parseError instanceof Error ? parseError.message : 'Unknown parsing error.');
        setExecutorContent('');
      }
    };
    reader.onerror = () => {
      setRawContent('');
      setFileName(file.name);
      setLoadError(reader.error?.message ?? 'Failed to read file.');
      setExecutorContent('');
    };

    reader.readAsText(file);
  };

  const handleSaveInput = () => {
    const textContent = rawContent.trim();
    if (!textContent) return;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName ? fileName : 'data.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const appendLog = (entry: string) => {
    setExecutorContent((prev) => (prev ? `${prev}\n${entry}` : entry));
  };
  const handleClearOutput = () => {
    setExecutorContent('');
  };

  const handleSaveOutput = () => {
    const textContent = executorContent.trim();
    if (!textContent) return;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'tester-output.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExecute = async () => {
    const content = rawContent.trim();
    if (!content) {
      appendLog('Cannot execute: no content loaded.');
      return;
    }

    CommandInterpreter.initialize(createExecutors(appendLog));
    setExecutorContent('');
    setIsExecuting(true);
    try {
      await executeScripts(content, appendLog);
    } catch (error) {
      if (error instanceof Error) {
        appendLog(`Execution failed: ${error.message}`);
      } else {
        appendLog(`Execution failed: ${String(error)}`);
      }
      // Errors are already logged inside the generator.
    } finally {
      setIsExecuting(false);
    }
  };

  const handleFontSizeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number.parseInt(event.target.value, 10);
    if (Number.isNaN(nextValue)) {
      return;
    }
    const clampedValue = Math.min(Math.max(nextValue, 8), 48);
    setEditorFontSize(clampedValue);
  };

  const isSaveInputDisabled = !rawContent.trim();
  const isSaveOutputDisabled = !executorContent.trim();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Tester
        </Typography>
        <TextField
          label="Editor font size"
          type="number"
          size="small"
          value={editorFontSize}
          onChange={handleFontSizeChange}
          inputProps={{ min: 8, max: 48, step: 1 }}
          sx={{ width: { xs: '100%', sm: 200 } }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 3
        }}
      >
        <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
          <Box>
            <Button variant="contained" size="medium" component="label">
              Choose file
              <input hidden type="file" onChange={handleFileChange} />
            </Button>
            {fileName ? (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Selected file: {fileName}
              </Typography>
            ) : null}
          </Box>

          {loadError ? <Alert severity="error">{loadError}</Alert> : null}

          <Paper sx={{ p: 0, overflow: 'hidden' }}>
            <CodeMirror
              value={rawContent}
              height="320px"
              onChange={(value) => setRawContent(value)}
              theme="light"
              style={{ fontSize: `${editorFontSize}px` }}
            />
          </Paper>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="contained" size="medium" onClick={handleSaveInput} disabled={isSaveInputDisabled}>
              Save file
            </Button>
          </Stack>
        </Stack>

        <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" size="medium" onClick={handleExecute} disabled={isExecuting}>
              {isExecuting ? 'Executing...' : 'Execute'}
            </Button>
            <Button variant="outlined" size="medium" onClick={handleClearOutput} disabled={!executorContent}>
              Clear
            </Button>
            <Button variant="outlined" size="medium" onClick={handleSaveOutput} disabled={isSaveOutputDisabled}>
              Save output
            </Button>
          </Stack>
          <Paper sx={{ p: 0, overflow: 'hidden' }}>
            <CodeMirror
              value={executorContent}
              height="320px"
              editable={false}
              theme="light"
              style={{ fontSize: `${editorFontSize}px` }}
            />
          </Paper>
        </Stack>
      </Box>

    </Stack>
  );
};

export default TesterView;
