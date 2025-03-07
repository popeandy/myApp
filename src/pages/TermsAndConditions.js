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

function TermsAndConditions() {
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
          Terms & Conditions
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Terms and Conditions for NeighborlyNeeds
          </Typography>
          
          <Typography variant="body1" paragraph>
            Last updated: February 17, 2024
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph>
            By accessing and using NeighborlyNeeds, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the app.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            2. User Responsibilities
          </Typography>
          <Typography variant="body1" paragraph>
            Users must:
            • Be at least 18 years old
            • Provide accurate and truthful information
            • Maintain the security of their account
            • Not engage in any illegal or unauthorized activities
            • Not harass or harm other users
            • Not post false or misleading content
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            3. Service Description
          </Typography>
          <Typography variant="body1" paragraph>
            NeighborlyNeeds is a platform that connects community members for task assistance. We do not guarantee the quality, safety, or legality of tasks posted. Users engage with each other at their own risk.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            4. User Content
          </Typography>
          <Typography variant="body1" paragraph>
            You retain ownership of content you post, but grant NeighborlyNeeds a license to use, modify, and display that content. You are solely responsible for the content you post.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            5. Liability Limitations
          </Typography>
          <Typography variant="body1" paragraph>
            NeighborlyNeeds is not liable for:
            • Disputes between users
            • Quality of services provided
            • User conduct or content
            • Any damages arising from use of the app
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            6. Account Termination
          </Typography>
          <Typography variant="body1" paragraph>
            We reserve the right to suspend or terminate accounts that violate these terms or engage in inappropriate behavior, at our sole discretion.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            7. Privacy
          </Typography>
          <Typography variant="body1" paragraph>
            Your use of NeighborlyNeeds is also governed by our Privacy Policy. Please review it to understand how we collect and use your information.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            8. Changes to Terms
          </Typography>
          <Typography variant="body1" paragraph>
            We may modify these terms at any time. Continued use of NeighborlyNeeds after changes constitutes acceptance of new terms.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            9. Governing Law
          </Typography>
          <Typography variant="body1" paragraph>
            These terms are governed by the laws of the United States. Any disputes shall be resolved in the appropriate courts of jurisdiction.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            10. Contact Information
          </Typography>
          <Typography variant="body1" paragraph>
            For questions about these Terms and Conditions, please contact:
            andrew.schell07@gmail.com
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default TermsAndConditions;
