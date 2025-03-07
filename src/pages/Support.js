import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Grid,
  Paper,
  Button,
  useTheme,
  Fade,
  Slide
} from '@mui/material';
import {
  ArrowBack,
  Email,
  Search,
  ReceiptLong,
} from '@mui/icons-material';

function Support() {
  const theme = useTheme();
  const navigate = useNavigate();

  // Handle email support
  const handleEmailSupport = () => {
    window.location.href = 'mailto:andrew.schell07@gmail.com?subject=Support Request';
  };

  // Handle FAQ search - for now just a placeholder
  const handleSearchFAQs = () => {
    // You can implement FAQ search functionality later
    console.log('Search FAQs clicked');
  };

  const supportCards = [
    { 
      icon: <Email />, 
      title: 'Email Us',
      onClick: handleEmailSupport 
    },
    { 
      icon: <Search />, 
      title: 'Search FAQs',
      onClick: handleSearchFAQs 
    }
  ];

  const faqItems = [
    {
      title: 'Creating an Account',
      content: `• Step 1: Open the app and tap on "Sign Up."
• Step 2: Enter your email address, create a password, and fill out your profile details.`
    },
    {
      title: 'Logging In',
      content: `• Open the app and tap "Log In."
• Enter your email and password.
• If you forget your password, tap "Forgot Password" to reset it.`
    },
    {
      title: 'Managing Your Posts',
      content: `• View your active posts under the "My Tasks" tab.
• Edit or delete posts as needed.
• Mark a task as completed once it's done.`
    },
    {
      title: 'Browsing Tasks',
      content: `• Go to the Home Page to see all the tasks posted by others.
• Use the search tool to find tasks with keywords or filters.
• Tap on a task to view more details and contact the person who posted it.`
    }
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* AppBar */}
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
          Help and Support
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Fade in timeout={600}>
          <Box>
            <Typography color="text.secondary" gutterBottom>
              Welcome to support
            </Typography>
            <Typography variant="h4" gutterBottom>
              How can we help you?
            </Typography>

            {/* Support Cards */}
            <Grid container spacing={2} sx={{ my: 3 }}>
              {supportCards.map((card, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Slide in direction="up" timeout={600}>
                    <Paper
                      onClick={card.onClick}
                      sx={{
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <Box sx={{ color: 'primary.main', mb: 1 }}>
                        {card.icon}
                      </Box>
                      <Typography>{card.title}</Typography>
                    </Paper>
                  </Slide>
                </Grid>
              ))}
            </Grid>

            {/* FAQs */}
            <Typography color="text.secondary" gutterBottom sx={{ mt: 4 }}>
              Review FAQ's below
            </Typography>

            {faqItems.map((faq, index) => (
              <Slide in direction="up" timeout={600} key={index}>
                <Paper
                  sx={{
                    p: 2,
                    mb: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    {faq.title}
                  </Typography>
                  <Typography color="text.secondary" 
                    sx={{ whiteSpace: 'pre-line' }}>
                    {faq.content}
                  </Typography>
                </Paper>
              </Slide>
            ))}

            {/* Action Button */}
            <Box sx={{ mt: 4 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ReceiptLong />}
                sx={{ mb: 2, borderRadius: 30, py: 1.5 }}
                onClick={() => navigate('/create-ticket')}
              >
                Create Ticket
              </Button>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}

export default Support;
