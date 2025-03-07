import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Typography, 
  Container, 
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from '@mui/material';
import { auth, db, signInWithEmailAndPassword, sendPasswordResetEmail } from '../firebase'; // Import Firebase auth functions and Firestore
import { doc, getDoc } from 'firebase/firestore'; // Add these imports
import { collection, query, where, getDocs } from 'firebase/firestore'; // Add these imports
import designerLogo from '../assets/images/Designer.png'; // Import the logo

function Login() {
  const navigate = useNavigate();
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Combined state for email/username
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      setResetError('Please enter your email address');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSuccess(true);
      setResetError('');
      // Clear the email field after successful send
      setResetEmail('');
      // Close dialog after 3 seconds
      setTimeout(() => {
        setResetDialogOpen(false);
        setResetSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending reset email:', error);
      setResetError('Failed to send reset email. Please try again.');
      setResetSuccess(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      let userEmail = loginIdentifier;
      
      // Check if input is not an email (assume it's a username)
      if (!loginIdentifier.includes('@')) {
        // Query Firestore to find user with matching username
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('displayName', '==', loginIdentifier));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError('Invalid login credentials');
          return;
        }
        
        userEmail = querySnapshot.docs[0].data().email;
      }

      await signInWithEmailAndPassword(auth, userEmail, password);
      navigate('/main-feed');
    } catch (error) {
      console.error('Login error:', error); // Keep for debugging
      setError('Invalid login credentials');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        justifyContent: 'center', // Center the form horizontally
        alignItems: 'center', // Center the form vertically
      }}
    >
      {/* Form Container */}
      <Container
        maxWidth="sm"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 4,
          backgroundColor: 'white', // Add a white background for the form
          borderRadius: 2, // Add rounded corners
          boxShadow: 3, // Add a subtle shadow
          textAlign: 'center', // Center the content
        }}
      >
        {/* Logo */}
        <img src={designerLogo} alt="Designer Logo" style={{ width: '150px', marginBottom: '20px' }} />

        {/* Title */}
        <Typography variant="h4" gutterBottom>
          Login
        </Typography>

        {/* Error Message */}
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <TextField
            fullWidth
            label="Email or Username"
            value={loginIdentifier}
            onChange={(e) => setLoginIdentifier(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Login
          </Button>
        </form>

        {/* Forgot Password Link */}
        <Button
          color="primary"
          onClick={() => setResetDialogOpen(true)}
          sx={{ textTransform: 'none' }}
        >
          Forgot Password?
        </Button>

        {/* Sign Up Link */}
        <Typography variant="body2" sx={{ mt: 2 }}>
          Don't have an account?{' '}
          <Button
            color="primary"
            onClick={() => navigate('/create-account')} // Navigate to the create account page
            sx={{ textTransform: 'none' }}
          >
            Sign Up here
          </Button>
        </Typography>
      </Container>

      {/* Password Reset Dialog */}
      <Dialog 
        open={resetDialogOpen} 
        onClose={() => {
          setResetDialogOpen(false);
          setResetError('');
          setResetSuccess(false);
          setResetEmail('');
        }}
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {resetSuccess ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Password reset email sent! Please check your inbox.
            </Alert>
          ) : (
            <>
              <DialogContentText>
                Enter your email address and we'll send you a link to reset your password.
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label="Email Address"
                type="email"
                fullWidth
                variant="outlined"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                error={!!resetError}
                helperText={resetError}
                sx={{ mt: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          {!resetSuccess && (
            <>
              <Button 
                onClick={() => {
                  setResetDialogOpen(false);
                  setResetError('');
                  setResetEmail('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleForgotPassword} variant="contained">
                Send Reset Link
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Login;