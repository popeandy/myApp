import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Avatar,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  CardMedia,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Divider,
  AvatarGroup,
  Menu,
  MenuItem,
  Stack
} from '@mui/material';
import {
  ArrowBack,
  Settings as SettingsIcon,
  Event as EventIcon,
  Group as GroupIcon,
  Add as AddIcon,
  Chat as ChatIcon,
  Send as SendIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  LocationOn as LocationIcon,
  Share,
  MoreHoriz,
  CalendarToday,
  People,
  PhotoCamera
} from '@mui/icons-material';
import {
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  MapPin as MapPinIcon,
  Users as UsersIcon
} from 'lucide-react';
import { db, auth } from '../firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  arrayRemove,
  arrayUnion,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import NavBar from '../components/NavBar';
import { styled } from '@mui/material/styles';

const Input = styled('input')({
  display: 'none',
});

function NeighborhoodDetail() {
  const { neighborhoodId } = useParams();
  const navigate = useNavigate();
  const [neighborhood, setNeighborhood] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date().toISOString().slice(0, 16),
    location: '',
    maxParticipants: '',
  });
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const storage = getStorage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchNeighborhoodDetails();
  }, [neighborhoodId]);

  useEffect(() => {
    if (neighborhood) {
      const currentUserId = auth.currentUser?.uid;
      setIsAdmin(
        neighborhood.admins?.includes(currentUserId) || 
        neighborhood.creator?.id === currentUserId
      );
      console.log('Is admin:', isAdmin); // Debug log
    }
  }, [neighborhood]);

  const fetchNeighborhoodDetails = async () => {
    try {
      setLoading(true);
      const neighborhoodDoc = await getDoc(doc(db, 'neighborhoods', neighborhoodId));
      
      if (!neighborhoodDoc.exists()) {
        setError('Neighborhood not found');
        return;
      }

      const neighborhoodData = neighborhoodDoc.data();
      const currentUserId = auth.currentUser?.uid;

      // Update admin check to match your Firestore structure
      const isUserAdmin = neighborhoodData.admins?.includes(currentUserId) || 
                         neighborhoodData.createdBy === currentUserId;
      
      console.log('Current user:', currentUserId); // Debug
      console.log('Neighborhood data:', neighborhoodData); // Debug
      console.log('Is admin:', isUserAdmin); // Debug
      
      setIsAdmin(isUserAdmin);
      setNeighborhood({
        id: neighborhoodDoc.id,
        ...neighborhoodData
      });

      // Check if current user is a member
      setIsMember(neighborhoodData.members?.includes(currentUserId));

      if (neighborhoodData.members?.includes(currentUserId)) {
        fetchMembers(neighborhoodData.members);
        fetchPosts();
        fetchEvents();
      }
    } catch (error) {
      console.error('Error fetching neighborhood details:', error);
      setError('Failed to load neighborhood details');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const eventsQuery = query(
        collection(db, 'events'),
        where('neighborhoodId', '==', neighborhoodId)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      
      // Fetch organizer data for each event
      const eventsData = await Promise.all(
        eventsSnapshot.docs.map(async (eventDoc) => {
          const eventData = eventDoc.data();
          // Get the organizer's user document
          const organizerRef = doc(db, 'users', eventData.createdBy);
          const organizerDoc = await getDoc(organizerRef);
          
          return {
            id: eventDoc.id,
            ...eventData,
            organizer: organizerDoc.exists() ? organizerDoc.data() : null
          };
        })
      );
      
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events');
    }
  };

  const fetchMembers = async (memberIds) => {
    try {
      const memberPromises = memberIds.map(id => getDoc(doc(db, 'users', id)));
      const memberDocs = await Promise.all(memberPromises);
      const memberData = memberDocs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(memberData);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      console.log('Fetching posts for neighborhood:', neighborhoodId); // Debug log
      const postsQuery = query(
        collection(db, 'neighborhoodPosts'),
        where('neighborhoodId', '==', neighborhoodId),
        orderBy('createdAt', 'desc')
      );
      const postsSnapshot = await getDocs(postsQuery);
      
      // Fetch user data for each post
      const postsWithUserData = await Promise.all(
        postsSnapshot.docs.map(async (doc) => {
          const postData = doc.data();
          const userDoc = await getDoc(doc(db, 'users', postData.userId));
          return {
            id: doc.id,
            ...postData,
            user: userDoc.data()
          };
        })
      );
      
      console.log('Fetched posts:', postsWithUserData); // Debug log
      setPosts(postsWithUserData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts');
    }
  };

  // Admin functions
  const handleApproveEvent = async (eventId) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        status: 'approved'
      });
      fetchEvents();
    } catch (error) {
      console.error('Error approving event:', error);
      setError('Failed to approve event');
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const neighborhoodRef = doc(db, 'neighborhoods', neighborhoodId);
      const userRef = doc(db, 'users', memberId);
      
      await updateDoc(neighborhoodRef, {
        members: arrayRemove(memberId)
      });
      await updateDoc(userRef, {
        neighborhoods: arrayRemove(neighborhoodId)
      });
      
      fetchMembers(neighborhood.members.filter(id => id !== memberId));
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member');
    }
  };

  const handleAddAdmin = async (memberId) => {
    try {
      const neighborhoodRef = doc(db, 'neighborhoods', neighborhoodId);
      await updateDoc(neighborhoodRef, {
        admins: arrayUnion(memberId)
      });
      fetchMembers(neighborhood.members);
    } catch (error) {
      console.error('Error adding admin:', error);
      setError('Failed to add admin');
    }
  };

  const handleJoinEvent = async (eventId) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      const eventData = eventDoc.data();

      // Check if event has max participants
      if (eventData.maxParticipants && 
          eventData.participants?.length >= parseInt(eventData.maxParticipants)) {
        setError('Event has reached maximum participants');
        return;
      }

      await updateDoc(eventRef, {
        participants: arrayUnion(auth.currentUser.uid)
      });

      fetchEvents();
    } catch (error) {
      console.error('Error joining event:', error);
      setError('Failed to join event');
    }
  };

  const handleLeaveEvent = async (eventId) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        participants: arrayRemove(auth.currentUser.uid)
      });
      fetchEvents();
    } catch (error) {
      console.error('Error leaving event:', error);
      setError('Failed to leave event');
    }
  };

  const handleCreateEventClick = () => {
    setOpenEventDialog(true);
  };

  const handleCreateEvent = async () => {
    try {
      setIsSubmitting(true);
      
      if (!newEvent.title || !newEvent.startDate) {
        setError('Title and start date are required');
        setIsSubmitting(false);
        return;
      }

      // Check if end date is after start date
      if (new Date(newEvent.endDate) <= new Date(newEvent.startDate)) {
        setError('End date must be after start date');
        setIsSubmitting(false);
        return;
      }

      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        startDate: new Date(newEvent.startDate),
        endDate: new Date(newEvent.endDate),
        location: newEvent.location,
        maxParticipants: parseInt(newEvent.maxParticipants) || null,
        neighborhoodId,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        participants: [auth.currentUser.uid],
        status: isAdmin ? 'approved' : 'pending'
      };

      await addDoc(collection(db, 'events'), eventData);
      
      // Reset form and close dialog
      setNewEvent({
        title: '',
        description: '',
        startDate: new Date().toISOString().slice(0, 16),
        endDate: new Date().toISOString().slice(0, 16),
        location: '',
        maxParticipants: ''
      });
      setOpenEventDialog(false);
      
      fetchEvents();
      setError('');
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinNeighborhood = async () => {
    try {
      const neighborhoodRef = doc(db, 'neighborhoods', neighborhoodId);
      const userRef = doc(db, 'users', auth.currentUser.uid);

      await updateDoc(neighborhoodRef, {
        members: arrayUnion(auth.currentUser.uid)
      });

      await updateDoc(userRef, {
        neighborhoods: arrayUnion(neighborhoodId)
      });

      setIsMember(true);
      fetchNeighborhoodDetails();
    } catch (error) {
      console.error('Error joining neighborhood:', error);
      setError('Failed to join neighborhood');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      await addDoc(collection(db, 'neighborhoodPosts'), {
        neighborhoodId,
        userId: auth.currentUser.uid,
        content: newPost,
        createdAt: serverTimestamp(),
        likes: [],
        comments: []
      });

      setNewPost('');
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post');
    }
  };

  const handleCoverPhotoChange = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const storageRef = ref(storage, `neighborhoods/${neighborhoodId}/cover`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'neighborhoods', neighborhoodId), {
        coverImage: downloadURL
      });

      // Update local state
      setNeighborhood(prev => ({
        ...prev,
        coverImage: downloadURL
      }));
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      setError('Failed to upload cover photo');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ 
        py: 4,
        pb: { xs: 10, sm: 12 } // Add extra padding at bottom to account for navbar
      }}>
        {/* Back Button */}
        <Box sx={{ mb: 3 }}>
          <IconButton 
            onClick={() => navigate('/neighborhoods')}
            sx={{ 
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            <ArrowBack />
          </IconButton>
        </Box>

        {/* Hero Section */}
        <Box sx={{
          position: 'relative',
          height: { xs: '200px', md: '300px' },
          mb: 4,
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'white',
        }}>
          {neighborhood?.coverImage ? (
            <Box
              component="img"
              src={neighborhood.coverImage}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              alt="Neighborhood cover"
            />
          ) : (
            <Box sx={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'white',
              color: 'text.secondary'
            }}>
              <Typography variant="body1">No cover photo</Typography>
            </Box>
          )}
          
          {/* Admin photo upload button */}
          {isAdmin && (
            <label htmlFor="cover-photo-upload">
              <Input
                accept="image/*"
                id="cover-photo-upload"
                type="file"
                onChange={handleCoverPhotoChange}
              />
              <IconButton
                color="primary"
                aria-label="upload cover photo"
                component="span"
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  bgcolor: 'white',
                  '&:hover': { bgcolor: 'grey.100' },
                  zIndex: 1,
                }}
              >
                <PhotoCamera />
              </IconButton>
            </label>
          )}

          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: { xs: 2, md: 4 },
            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
            zIndex: 1,
          }}>
            <Typography variant="h4" color="white" gutterBottom>
              {neighborhood?.name}
            </Typography>
            <Typography variant="body1" color="white" sx={{ opacity: 0.9, maxWidth: 'xl' }}>
              {neighborhood?.description}
            </Typography>
          </Box>
        </Box>

        {/* Stats Bar */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3 
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              startIcon={<People />}
              variant="outlined"
              size="small"
            >
              {members.length} members
            </Button>
            <Typography variant="body2" color="text.secondary">
              Created {new Date(neighborhood?.createdAt?.toDate()).toLocaleDateString()}
            </Typography>
          </Box>
          {!isMember && (
            <Button variant="contained" onClick={handleJoinNeighborhood}>
              Join Group
            </Button>
          )}
        </Box>

        {/* Tabs */}
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab icon={<ChatIcon />} label="Posts" />
          <Tab icon={<EventIcon />} label="Events" />
          <Tab icon={<GroupIcon />} label="Members" />
        </Tabs>

        {/* Posts Tab */}
        {tabValue === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Create Post Card */}
            <Card>
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2,
                  flexDirection: { xs: 'column', sm: 'row' } // Stack vertically on mobile
                }}>
                  <Avatar src={auth.currentUser?.photoURL} />
                  <TextField
                    fullWidth
                    multiline
                    placeholder="Share something with the group..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    variant="outlined"
                  />
                  <Button 
                    variant="contained"
                    endIcon={<SendIcon />}
                    onClick={handleCreatePost}
                    disabled={!newPost.trim()}
                    sx={{ 
                      py: { xs: 1.5, sm: 1 }, // Taller on mobile
                      width: { xs: '100%', sm: 'auto' }, // Full width on mobile
                      mt: { xs: 1, sm: 0 } // Add margin top on mobile
                    }}
                  >
                    Post
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader
                  avatar={<Avatar src={post.user?.photoURL} />}
                  action={
                    <IconButton>
                      <MoreHoriz />
                    </IconButton>
                  }
                  title={post.user?.displayName}
                  subheader={post.createdAt?.toDate().toLocaleString()}
                />
                <CardContent>
                  <Typography variant="body1">
                    {post.content}
                  </Typography>
                  {post.image && (
                    <CardMedia
                      component="img"
                      image={post.image}
                      alt="Post image"
                      sx={{ 
                        mt: 2,
                        borderRadius: 1,
                        maxHeight: 400,
                        objectFit: 'cover'
                      }}
                    />
                  )}
                </CardContent>
                <CardActions>
                  <Button 
                    startIcon={post.likes?.includes(auth.currentUser?.uid) ? 
                      <FavoriteIcon color="error" /> : 
                      <FavoriteBorderIcon />
                    }
                  >
                    {post.likes?.length || 0}
                  </Button>
                  <Button startIcon={<ChatBubbleOutlineIcon />}>
                    {post.comments?.length || 0}
                  </Button>
                  <Button startIcon={<Share />} sx={{ ml: 'auto' }}>
                    Share
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        )}

        {/* Events Tab */}
        {tabValue === 1 && (
          <Box>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, // Stack vertically on mobile
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'center' }, // Full width on mobile
              gap: { xs: 2, sm: 0 }, // Add gap between stacked elements on mobile
              mb: 3 
            }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '1.5rem', sm: '2rem' } // Smaller font on mobile
              }}>
                Upcoming Events
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<EventIcon />}
                onClick={handleCreateEventClick}
                sx={{ 
                  py: { xs: 1.5, sm: 1 }, // Taller on mobile
                  fontSize: { xs: '1rem', sm: 'inherit' }, // Larger text on mobile
                  width: { xs: '100%', sm: 'auto' } // Full width on mobile
                }}
              >
                Create Event
              </Button>
            </Box>
            <Grid container spacing={3}>
              {events.map((event) => (
                <Grid item xs={12} md={6} lg={4} key={event.id}>
                  <Card sx={{ overflow: 'hidden' }}>
                    {event.image && (
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          sx={{ height: 200 }}
                          image={event.image}
                          alt={event.title}
                        />
                        <Box sx={{ 
                          position: 'absolute', 
                          top: 16, 
                          right: 16 
                        }}>
                          <Chip
                            label={
                              event.participants?.length >= event.maxParticipants ? "Event Full" :
                              event.participants?.length >= event.maxParticipants * 0.8 ? "Almost Full" :
                              "Spots Available"
                            }
                            color={
                              event.participants?.length >= event.maxParticipants ? "error" :
                              event.participants?.length >= event.maxParticipants * 0.8 ? "warning" :
                              "success"
                            }
                            sx={{ fontWeight: 'medium' }}
                          />
                        </Box>
                      </Box>
                    )}
                    <CardHeader
                      sx={{
                        position: 'relative',
                        pt: event.image ? 2 : 3,
                        pb: 1
                      }}
                      title={
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {event.title}
                        </Typography>
                      }
                      subheader={
                        <>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              mb: 1
                            }}
                          >
                            {event.description}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Avatar 
                              src={event.organizer?.photoURL} 
                              sx={{ width: 24, height: 24 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              Organized by {event.organizer?.displayName || 'Unknown'}
                            </Typography>
                          </Box>
                        </>
                      }
                    />
                    {!event.image && (
                      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                        <Chip
                          label={
                            event.participants?.length >= event.maxParticipants ? "Event Full" :
                            event.participants?.length >= event.maxParticipants * 0.8 ? "Almost Full" :
                            "Spots Available"
                          }
                          color={
                            event.participants?.length >= event.maxParticipants ? "error" :
                            event.participants?.length >= event.maxParticipants * 0.8 ? "warning" :
                            "success"
                          }
                          sx={{ fontWeight: 'medium' }}
                        />
                      </Box>
                    )}
                    <CardContent sx={{ pt: 0 }}>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon size={16} />
                          <Typography variant="body2">
                            {new Date(event.startDate?.toDate()).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ClockIcon size={16} />
                          <Typography variant="body2">
                            {new Date(event.startDate?.toDate()).toLocaleTimeString()} - 
                            {new Date(event.endDate?.toDate()).toLocaleTimeString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MapPinIcon size={16} />
                          <Typography variant="body2">
                            {event.location}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <UsersIcon size={16} />
                          <Typography variant="body2">
                            {event.participants?.length || 0} / {event.maxParticipants} attendees
                          </Typography>
                          <Box 
                            sx={{ 
                              ml: 'auto',
                              width: 96,
                              height: 8,
                              bgcolor: 'grey.200',
                              borderRadius: 1,
                              overflow: 'hidden'
                            }}
                          >
                            <Box
                              sx={{
                                height: '100%',
                                width: `${Math.min(((event.participants?.length || 0) / event.maxParticipants) * 100, 100)}%`,
                                bgcolor: event.participants?.length >= event.maxParticipants ? 'error.main' :
                                        event.participants?.length >= event.maxParticipants * 0.8 ? 'warning.main' :
                                        'primary.main'
                              }}
                            />
                          </Box>
                        </Box>
                      </Stack>
                    </CardContent>
                    <CardActions sx={{ p: 2 }}>
                      <Button 
                        fullWidth 
                        variant="contained"
                        disabled={event.participants?.length >= event.maxParticipants}
                        onClick={() => handleJoinEvent(event.id)}
                        sx={{ 
                          py: { xs: 1.5, sm: 1 }, // Taller on mobile
                          fontSize: { xs: '1rem', sm: 'inherit' } // Larger text on mobile
                        }}
                      >
                        {event.participants?.length >= event.maxParticipants ? 
                          "Event Full" : 
                          event.participants?.includes(auth.currentUser?.uid) ?
                          "Leave Event" :
                          "Join Event"
                        }
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Members Tab */}
        {tabValue === 2 && (
          <Box>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              mb: 3 
            }}>
              <Typography variant="h6">Members ({members.length})</Typography>
              {isAdmin && (
                <Button variant="contained" startIcon={<GroupIcon />}>
                  Invite
                </Button>
              )}
            </Box>
            <Grid container spacing={3}>
              {members.map((member) => (
                <Grid item xs={6} sm={4} md={3} key={member.id}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center' 
                  }}>
                    <Avatar
                      src={member.photoURL}
                      sx={{ width: 80, height: 80, mb: 1 }}
                    />
                    <Typography variant="subtitle1">
                      {member.displayName}
                    </Typography>
                    {(neighborhood?.admins?.includes(member.id) || 
                      neighborhood?.createdBy === member.id) && (
                      <Chip
                        label="Admin"
                        color="primary"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
      <NavBar />
      <Dialog 
        open={openEventDialog} 
        onClose={() => setOpenEventDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Event</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Event Title"
              required
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            />
            <TextField
              fullWidth
              label="Location"
              value={newEvent.location}
              onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
            />
            <TextField
              fullWidth
              type="datetime-local"
              label="Start Date & Time"
              required
              value={newEvent.startDate}
              onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="datetime-local"
              label="End Date & Time"
              required
              value={newEvent.endDate}
              onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              error={new Date(newEvent.endDate) <= new Date(newEvent.startDate)}
              helperText={
                new Date(newEvent.endDate) <= new Date(newEvent.startDate) 
                  ? "End time must be after start time" 
                  : ""
              }
            />
            <TextField
              fullWidth
              type="number"
              label="Maximum Participants (optional)"
              value={newEvent.maxParticipants}
              onChange={(e) => setNewEvent({ ...newEvent, maxParticipants: e.target.value })}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEventDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateEvent}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Creating...
              </>
            ) : (
              'Create Event'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default NeighborhoodDetail;