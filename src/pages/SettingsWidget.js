import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Button,
  Switch,
  Divider,
  Alert
} from '@mui/material';
import { useNavigate, Navigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import NavBar from '../components/NavBar';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

function SettingsWidget() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    showPostsOnMainFeed: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Check if the user is authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch user settings when authenticated
        await fetchUserSettings(user.uid);
      } else {
        navigate('/', { replace: true });
      }
      setLoading(false);
    }, (error) => {
      setError(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchUserSettings = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSettings({
          showPostsOnMainFeed: userData.showPostsOnMainFeed ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
      setError('Failed to load settings');
    }
  };

  const handleToggleMainFeed = async () => {
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        showPostsOnMainFeed: !settings.showPostsOnMainFeed
      });
      
      setSettings(prev => ({
        ...prev,
        showPostsOnMainFeed: !prev.showPostsOnMainFeed
      }));
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      // The onAuthStateChanged listener will handle the navigation
    } catch (error) {
      console.error('Error logging out:', error);
      setError(error);
      setLoading(false);
    }
  };

  // Handle loading state
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  // If user is not authenticated, redirect to root (login page)
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Handle error state
  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography color="error">
            An error occurred: {error.message}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/')} 
            sx={{ mt: 2 }}
          >
            Return to Login
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={handleBack}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold" sx={{ ml: 2 }}>
            Settings
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
          Privacy Settings
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="Show Posts on Main Feed"
              secondary="When enabled, your posts will appear in the public community feed"
            />
            <Switch
              edge="end"
              checked={settings.showPostsOnMainFeed}
              onChange={handleToggleMainFeed}
              disabled={isSaving}
            />
          </ListItem>
          <ListItem>
            <Box sx={{ 
              width: '100%',
              p: 2, 
              bgcolor: 'action.hover',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              {settings.showPostsOnMainFeed ? (
                <PublicIcon color="action" />
              ) : (
                <LockIcon color="action" />
              )}
              <Typography variant="body2" color="text.secondary">
                {settings.showPostsOnMainFeed
                  ? "Your posts are visible in the main community feed"
                  : "Your posts are only visible in neighborhood feeds"}
              </Typography>
            </Box>
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
          Account Settings
        </Typography>
        <List>
          <ListItem button onClick={() => navigate('/edit-profile')}>
            <ListItemText primary="Edit Profile" />
            <ChevronRightIcon />
          </ListItem>
          <ListItem button onClick={() => navigate('/about-us')}>
            <ListItemText primary="About Us" />
            <ChevronRightIcon />
          </ListItem>
          <ListItem button onClick={() => navigate('/support')}>
            <ListItemText primary="Help" />
            <ChevronRightIcon />
          </ListItem>
          <ListItem button onClick={() => navigate('/privacy-policy')}>
            <ListItemText primary="Privacy Policy" />
            <ChevronRightIcon />
          </ListItem>
          <ListItem button onClick={() => navigate('/terms-and-conditions')}>
            <ListItemText primary="Terms & Conditions" />
            <ChevronRightIcon />
          </ListItem>
        </List>

        <Typography variant="body1" sx={{ mt: 4, mb: 2 }}>
          App Version
        </Typography>
        <Typography variant="body1">v0.0.1</Typography>
        <Box sx={{ mt: 4 }}>
          <Button 
            variant="outlined" 
            onClick={handleLogout}
            disabled={loading}
          >
            {loading ? 'Logging out...' : 'Log Out'}
          </Button>
        </Box>
      </Box>
      <NavBar />
    </Container>
  );
}

export default SettingsWidget;