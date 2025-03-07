import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Container, Box, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import designerLogo from '../assets/images/Designer.png';

function CreateAccount() {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if username is already taken
  const checkUsername = async (username) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    // Username validation
    if (username.length < 6) {
      setError('Username must be at least 6 characters long');
      return;
    }

    // Check for special characters
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    try {
      // Check if username is taken
      const usernameTaken = await checkUsername(username);
      if (usernameTaken) {
        setError('Username is already taken');
        return;
      }

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user) {
        throw new Error('User creation failed. User object is null.');
      }

      // Update the user's profile with the display name
      await updateProfile(user, {
        displayName: displayName,
      });

      // Store the user data in the 'users' collection
      await setDoc(doc(db, 'users', user.uid), {
        displayName: displayName,
        username: username,
        email: email,
        photoURL: user.photoURL || '',
        createdAt: new Date(),
      });

      navigate('/main-feed'); // Changed from '/login' to '/main-feed'
    } catch (error) {
      console.error('Error during account creation:', error);
      setError(error.message);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 4,
          backgroundColor: 'white',
          borderRadius: 2,
          boxShadow: 3,
          textAlign: 'center',
        }}
      >
        <img src={designerLogo} alt="Designer Logo" style={{ width: '150px', marginBottom: '20px' }} />
        
        <Typography variant="h4" gutterBottom>
          Create Account
        </Typography>

        {error && (
          <Typography color="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Typography>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <TextField
            fullWidth
            label="Display Name"
            variant="outlined"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            sx={{ mb: 3 }}
            required
          />
          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            sx={{ mb: 3 }}
            required
            helperText="Username must be at least 6 characters long and can only contain letters, numbers, and underscores"
          />
          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 3 }}
            required
          />
          <TextField
            fullWidth
            label="Password"
            variant="outlined"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Confirm Password"
            variant="outlined"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            sx={{ mb: 3 }}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Create Account
          </Button>
        </form>
        <Button 
          onClick={() => navigate('/')} 
          variant="text" 
          color="primary" 
          sx={{ mt: 2 }}
        >
          Login
        </Button>
      </Container>
    </Box>
  );
}

export default CreateAccount;