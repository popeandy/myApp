import React from 'react';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Paper,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 2 }}>
          Privacy Policy
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Privacy Policy
          </Typography>
          
          <Typography variant="body1" paragraph>
            Last updated: February 17, 2024
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            1. Information We Collect
          </Typography>
          <Typography variant="body1" paragraph>
            We collect information that you provide directly to us, including:
            • Name and email address when you create an account
            • Profile information
            • Messages and communication data
            • Task-related information you post
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            2. How We Use Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            We use the information we collect to:
            • Provide and maintain our services
            • Process your tasks and facilitate communication
            • Send you important updates and notifications
            • Improve our services and develop new features
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            3. Information Sharing
          </Typography>
          <Typography variant="body1" paragraph>
            We do not sell your personal information. We may share your information only:
            • With other users as necessary for task completion
            • With service providers who assist in our operations
            • When required by law or to protect rights
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            4. Data Security
          </Typography>
          <Typography variant="body1" paragraph>
            We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            5. Your Rights
          </Typography>
          <Typography variant="body1" paragraph>
            You have the right to:
            • Access your personal information
            • Correct inaccurate data
            • Request deletion of your data
            • Opt out of marketing communications
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            6. Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            If you have questions about this Privacy Policy, please contact us at:
            andrew.schell07@gmail.com
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default PrivacyPolicy;
