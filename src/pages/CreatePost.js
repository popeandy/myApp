import React, { useState } from 'react';
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  CalendarToday,
  CloudUpload,
  Image as ImageIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { styled } from '@mui/material/styles';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth } from '../firebase';
import NavBar from '../components/NavBar';

// Styled components
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const ImageUploadBox = styled(Box)(({ theme }) => ({
  height: '128px',
  border: `2px dashed ${theme.palette.grey[300]}`,
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background-color 0.3s',
  '&:hover': {
    backgroundColor: theme.palette.grey[50],
  },
}));

const PreviewImage = styled('img')({
  width: '100%',
  height: '128px',
  objectFit: 'cover',
  borderRadius: '4px',
});

const CreatePost = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [postType, setPostType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card elevation={3}>
        <CardHeader
          title={
            <Box sx={{ mb: 1 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 1
                }}
              >
                Create a New Post
              </Typography>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: 'text.secondary',
                  fontWeight: 'normal'
                }}
              >
                Share updates and connect with your community
              </Typography>
            </Box>
          }
          sx={{ 
            pt: 4, 
            pb: 3,
            px: 3,
            background: (theme) => `linear-gradient(to right, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        />
        <form onSubmit={handleSubmit}>
          <CardContent sx={{ pt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Post Type</InputLabel>
                  <Select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                    label="Post Type"
                  >
                    <MenuItem value="petSitting">Pet Sitting</MenuItem>
                    <MenuItem value="babySitting">Baby Sitting</MenuItem>
                    <MenuItem value="houseSitting">House Sitting</MenuItem>
                    <MenuItem value="mailCollection">Mail Collection</MenuItem>
                    <MenuItem value="packageCollection">Package Collection</MenuItem>
                    <MenuItem value="yardWork">Yard Work</MenuItem>
                    <MenuItem value="tutoring">Tutoring/Homework Help</MenuItem>
                    <MenuItem value="maintenance">General Maintenance</MenuItem>
                    <MenuItem value="groceryPickup">Grocery Pickup</MenuItem>
                    <MenuItem value="binHelp">Trash/Recycling Bin Help</MenuItem>
                    <MenuItem value="techSupport">Tech Assistance</MenuItem>
                    <MenuItem value="generalHelp">General Help</MenuItem>
                    <MenuItem value="communityEvent">Community Event</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your post a clear title"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your post in detail..."
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={setStartDate}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={setEndDate}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Add Image
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <ImageUploadBox component="label">
                      <CloudUpload sx={{ fontSize: 40, color: 'text.secondary' }} />
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Click to upload an image
                      </Typography>
                      <VisuallyHiddenInput
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </ImageUploadBox>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        height: '128px',
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {imagePreview ? (
                        <PreviewImage src={imagePreview} alt="Preview" />
                      ) : (
                        <ImageIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>

          <CardActions sx={{ 
            justifyContent: 'flex-end', 
            p: 3, 
            borderTop: 1, 
            borderColor: 'divider',
            gap: 1 
          }}>
            <Button 
              variant="outlined" 
              color="inherit"
              sx={{ 
                px: 3,
                '&:hover': {
                  backgroundColor: 'grey.100'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{ px: 3 }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Submitting...
                </>
              ) : (
                'Create Post'
              )}
            </Button>
          </CardActions>
        </form>
      </Card>
      <NavBar />
    </Container>
  );
};

export default CreatePost;