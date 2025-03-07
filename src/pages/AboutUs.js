import React from 'react';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Paper,
  Avatar
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function AboutUs() {
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
          About Us
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper 
          elevation={3}
          sx={{ 
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{ 
              mb: 4,
              fontWeight: 'bold',
              color: 'primary.main'
            }}
          >
            Our Story
          </Typography>

          <Typography 
            variant="body1" 
            paragraph 
            sx={{ 
              mb: 3,
              lineHeight: 1.8,
              textAlign: 'left'
            }}
          >
            I originally started this app as a way to sharpen my programming skills and learn new development concepts. It was meant to be a learning exercise, a way to push myself technically and explore the intricacies of app creation. However, as I progressed, the project began to evolve beyond its initial purpose. I found myself increasingly drawn to the idea of building something that could genuinely benefit the community around me.
          </Typography>

          <Typography 
            variant="body1" 
            paragraph
            sx={{ 
              mb: 4,
              lineHeight: 1.8,
              textAlign: 'left'
            }}
          >
            The more I worked on the app, the more I realized how valuable it could be in fostering connections within my neighborhood. I wanted to create a platform where people could easily seek and offer help for everyday tasks—whether it's dog sitting, house sitting, or simply collecting mail while someone is away. It became about more than just coding; it became about creating a space where people could support each other, strengthen community ties, and make life a little easier for everyone involved.
          </Typography>

          <Typography 
            variant="body1"
            sx={{ 
              mb: 4,
              lineHeight: 1.8
            }}
          >
            I give thanks to everyone who has used my app,
          </Typography>

          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mt: 2 
          }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80,
                mb: 2,
                bgcolor: 'primary.main'
              }}
            >
              AS
            </Avatar>
            <Typography 
              variant="h6"
              sx={{ 
                fontStyle: 'italic',
                fontWeight: 'medium'
              }}
            >
              Andrew Schell
            </Typography>
            <Typography 
              variant="subtitle1" 
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              Founder & Developer
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default AboutUs;
