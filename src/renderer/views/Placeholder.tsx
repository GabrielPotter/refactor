import { Box, Typography } from '@mui/material';

type PlaceholderProps = {
  title: string;
  description?: string;
};

export const Placeholder = ({ title, description }: PlaceholderProps) => {
  return (
    <Box sx={{ py: 6, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>
      {description ? (
        <Typography color="text.secondary" variant="body1">
          {description}
        </Typography>
      ) : null}
    </Box>
  );
};

export default Placeholder;
