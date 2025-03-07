import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Grid,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  CardMedia,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import NavBar from '../components/NavBar';
import { Search as SearchIcon, Info, ExitToApp, Add } from '@mui/icons-material';
import { People, LocationOn } from '@mui/icons-material';

const formatLocation = (location) => {
  if (!location) return '';
  if (typeof location === 'string') return location;
  // If it's a GeoPoint, format it
  if (location._lat && location._long) {
    return `${location._lat.toFixed(6)}, ${location._long.toFixed(6)}`;
  }
  return '';
};

function Neighborhoods() {
  const navigate = useNavigate();
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [newNeighborhood, setNewNeighborhood] = useState({
    name: '',
    description: '',
    location: '',
  });
  const [openLeaveDialog, setOpenLeaveDialog] = useState(false);
  const [neighborhoodToLeave, setNeighborhoodToLeave] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState([]);

  useEffect(() => {
    fetchNeighborhoods();
  }, []);

  useEffect(() => {
    if (!neighborhoods) return;
    
    const filtered = neighborhoods.filter(neighborhood => {
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = neighborhood.name?.toLowerCase().includes(searchLower);
      const locationMatch = typeof neighborhood.location === 'string' && 
        neighborhood.location.toLowerCase().includes(searchLower);
      const descriptionMatch = typeof neighborhood.description === 'string' && 
        neighborhood.description.toLowerCase().includes(searchLower);
      
      return nameMatch || locationMatch || descriptionMatch;
    });
    
    setFilteredNeighborhoods(filtered);
  }, [searchQuery, neighborhoods]);

  const fetchNeighborhoods = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'neighborhoods'));
      const snapshot = await getDocs(q);
      
      // Fetch additional data for each neighborhood
      const neighborhoodsData = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          
          // Get member count
          const memberCount = data.members?.length || 0;
          
          // Get creator info if createdBy exists
          let creatorData = null;
          if (data.createdBy) {
            const creatorDoc = await getDoc(doc(db, 'users', data.createdBy));
            creatorData = creatorDoc.exists() ? creatorDoc.data() : null;
          }
          
          return {
            id: docSnapshot.id,
            ...data,
            memberCount,
            creator: creatorData,
            isMember: data.members?.includes(auth.currentUser?.uid),
          };
        })
      );
      
      setNeighborhoods(neighborhoodsData);
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
      setError('Failed to load neighborhoods');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNeighborhood = async () => {
    try {
      const newNeighborhoodRef = await addDoc(collection(db, 'neighborhoods'), {
        ...newNeighborhood,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid,
        members: [auth.currentUser.uid],
        admins: [auth.currentUser.uid],
        events: [],
      });

      // Update user's neighborhoods array
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        neighborhoods: arrayUnion(newNeighborhoodRef.id)
      });

      setOpenCreate(false);
      setNewNeighborhood({ name: '', description: '', location: '' });
      fetchNeighborhoods();
    } catch (error) {
      console.error('Error creating neighborhood:', error);
      setError('Failed to create neighborhood');
    }
  };

  const handleJoinNeighborhood = async (neighborhoodId) => {
    try {
      const neighborhoodRef = doc(db, 'neighborhoods', neighborhoodId);
      const userRef = doc(db, 'users', auth.currentUser.uid);

      // Update neighborhood members
      await updateDoc(neighborhoodRef, {
        members: arrayUnion(auth.currentUser.uid)
      });

      // Update user's neighborhoods
      await updateDoc(userRef, {
        neighborhoods: arrayUnion(neighborhoodId)
      });

      fetchNeighborhoods();
    } catch (error) {
      console.error('Error joining neighborhood:', error);
      setError('Failed to join neighborhood');
    }
  };

  const handleLeaveNeighborhood = async (neighborhoodId) => {
    setNeighborhoodToLeave(neighborhoodId);
    setOpenLeaveDialog(true);
  };

  const confirmLeaveNeighborhood = async () => {
    try {
      const neighborhoodRef = doc(db, 'neighborhoods', neighborhoodToLeave);
      const userRef = doc(db, 'users', auth.currentUser.uid);

      // Update neighborhood members
      await updateDoc(neighborhoodRef, {
        members: arrayRemove(auth.currentUser.uid)
      });

      // Update user's neighborhoods
      await updateDoc(userRef, {
        neighborhoods: arrayRemove(neighborhoodToLeave)
      });

      setOpenLeaveDialog(false);
      setNeighborhoodToLeave(null);
      fetchNeighborhoods();
    } catch (error) {
      console.error('Error leaving neighborhood:', error);
      setError('Failed to leave neighborhood');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, pb: 7 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: 2,
          mb: 3 
        }}>
          <Typography variant="h5" sx={{ fontWeight: 'medium' }}>
            Neighborhoods
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              size="small"
              placeholder="Search neighborhoods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: '100%', sm: '300px' } }}
            />
            <Button 
              variant="contained" 
              size="small"
              onClick={() => setOpenCreate(true)}
            >
              Create
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredNeighborhoods.map((neighborhood) => (
              <Grid item xs={12} md={6} key={neighborhood.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar 
                        src={neighborhood.coverImage} 
                        sx={{ 
                          mr: 2,
                          width: 64,
                          height: 64,
                          border: '2px solid',
                          borderColor: 'primary.main'
                        }} 
                      />
                      <Box>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 'bold',
                          display: '-webkit-box',
                          overflow: 'hidden',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 1,
                        }}>
                          {neighborhood.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Created by {neighborhood.creator?.displayName || 'Unknown'}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography 
                      color="text.secondary" 
                      sx={{
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                        mb: 2,
                        height: '42px' // Approximately 2 lines
                      }}
                    >
                      {neighborhood.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        icon={<People sx={{ fontSize: 16 }} />}
                        label={`${neighborhood.memberCount} members`}
                        size="small"
                        sx={{ bgcolor: 'primary.light', color: 'white' }}
                      />
                      {neighborhood.location && (
                        <Chip 
                          icon={<LocationOn sx={{ fontSize: 16 }} />}
                          label={formatLocation(neighborhood.location)}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Button 
                      size="small" 
                      onClick={() => navigate(`/neighborhoods/${neighborhood.id}`)}
                      startIcon={<Info />}
                    >
                      Details
                    </Button>
                    {neighborhood.isMember ? (
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => handleLeaveNeighborhood(neighborhood.id)}
                        startIcon={<ExitToApp />}
                      >
                        Leave
                      </Button>
                    ) : (
                      <Button 
                        size="small" 
                        color="primary"
                        onClick={() => handleJoinNeighborhood(neighborhood.id)}
                        startIcon={<Add />}
                      >
                        Join
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Dialog 
          open={openCreate} 
          onClose={() => setOpenCreate(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Neighborhood</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Neighborhood Name"
              value={newNeighborhood.name}
              onChange={(e) => setNewNeighborhood({
                ...newNeighborhood,
                name: e.target.value
              })}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={newNeighborhood.description}
              onChange={(e) => setNewNeighborhood({
                ...newNeighborhood,
                description: e.target.value
              })}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              label="Location"
              value={newNeighborhood.location}
              onChange={(e) => setNewNeighborhood({
                ...newNeighborhood,
                location: e.target.value
              })}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateNeighborhood} 
              variant="contained"
              disabled={!newNeighborhood.name || !newNeighborhood.description || !newNeighborhood.location}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Leave Neighborhood Confirmation Dialog */}
        <Dialog
          open={openLeaveDialog}
          onClose={() => setOpenLeaveDialog(false)}
        >
          <DialogTitle>Leave Neighborhood?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to leave this neighborhood? You'll need to be invited back to rejoin.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setOpenLeaveDialog(false);
                setNeighborhoodToLeave(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmLeaveNeighborhood}
              color="error"
              variant="contained"
            >
              Leave Neighborhood
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <NavBar />
    </Container>
  );
}

export default Neighborhoods;