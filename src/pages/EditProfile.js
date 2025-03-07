import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ArrowBack, PhotoCamera } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { 
  updateProfile, 
  updateEmail, 
  sendEmailVerification, 
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState({
    displayName: auth.currentUser?.displayName || '',
    username: '',
    email: auth.currentUser?.email || '',
    photoURL: auth.currentUser?.photoURL || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailChange, setShowEmailChange] = useState(false);

  useEffect(() => {
    // Get current user data from Firestore
    const fetchUserData = async () => {
      try {
        const userDoc = await doc(db, 'users', auth.currentUser.uid);
        const userData = (await getDoc(userDoc)).data();
        setProfileData(prev => ({
          ...prev,
          username: userData?.username || '',
        }));
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let photoURL = profileData.photoURL;

      // Upload new profile picture if selected
      if (imageFile) {
        const imageRef = ref(storage, `profile_pictures/${auth.currentUser.uid}`);
        await uploadBytes(imageRef, imageFile);
        photoURL = await getDownloadURL(imageRef);
      }

      // Update auth profile
      await updateProfile(auth.currentUser, {
        displayName: profileData.displayName,
        photoURL: photoURL,
      });

      // Update Firestore user document
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        displayName: profileData.displayName,
        username: profileData.username,
        photoURL: photoURL,
      });

      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate(-1), 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerification = async () => {
    try {
      await sendEmailVerification(auth.currentUser);
      setEmailVerificationSent(true);
      setSuccess('Verification email sent! Please check your inbox.');
    } catch (error) {
      setError('Failed to send verification email. Please try again.');
    }
  };

  const handleEmailChange = async () => {
    if (!password || !newEmail) {
      setError('Please provide both new email and current password');
      return;
    }

    try {
      setLoading(true);
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        password
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update email
      await updateEmail(auth.currentUser, newEmail);
      
      // Update Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        email: newEmail
      });

      setSuccess('Email updated successfully! Please verify your new email.');
      setShowEmailChange(false);
      setPassword('');
      setNewEmail('');
      
      // Send verification email to new address
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      console.error('Error updating email:', error);
      if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('This email is already in use by another account.');
      } else {
        setError('Failed to update email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" fontWeight="bold">
            Edit Profile
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            mb: 4 
          }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={imagePreview || profileData.photoURL}
                sx={{ 
                  width: 120, 
                  height: 120,
                  mb: 2,
                  border: '4px solid #3498DB'
                }}
              />
              <input
                accept="image/*"
                type="file"
                id="icon-button-file"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="icon-button-file">
                <IconButton 
                  component="span"
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: 0,
                    backgroundColor: '#3498DB',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#2980B9'
                    }
                  }}
                >
                  <PhotoCamera />
                </IconButton>
              </label>
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Display Name"
            value={profileData.displayName}
            onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Username"
            value={profileData.username}
            onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
            margin="normal"
            required
          />

          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Email: {profileData.email}
              {!auth.currentUser.emailVerified && (
                <Typography 
                  component="span" 
                  sx={{ 
                    color: 'warning.main',
                    ml: 1,
                    fontSize: '0.875rem'
                  }}
                >
                  (Not verified)
                </Typography>
              )}
            </Typography>

            {!auth.currentUser.emailVerified && !emailVerificationSent && (
              <Button
                variant="outlined"
                color="primary"
                onClick={handleSendVerification}
                sx={{ mt: 1 }}
              >
                Verify Email
              </Button>
            )}

            {!showEmailChange ? (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setShowEmailChange(true)}
                sx={{ mt: 1, ml: 1 }}
              >
                Change Email
              </Button>
            ) : (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="New Email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Current Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                />
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleEmailChange}
                    disabled={loading}
                    sx={{ mr: 1 }}
                  >
                    Update Email
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setShowEmailChange(false);
                      setPassword('');
                      setNewEmail('');
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ 
              mt: 4,
              mb: 2,
              height: 48,
              backgroundColor: '#3498DB',
              '&:hover': {
                backgroundColor: '#2980B9'
              }
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default EditProfile;