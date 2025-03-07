import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, getDoc, doc, deleteDoc, addDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
  Container,
  Box,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import NavBar from '../components/NavBar';
import { useNavigate } from 'react-router-dom';
import SettingsIcon from '@mui/icons-material/Settings';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import {
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import { ArrowForward } from '@mui/icons-material';
import { serverTimestamp } from 'firebase/firestore';
import MessageIcon from '@mui/icons-material/Message';

function ProfilePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentUser, setCurrentUser] = useState(null);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [userGroups, setUserGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch user data
  useEffect(() => {
    if (!currentUser) {
      console.error('No user is signed in');
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data());
        } else {
          console.error('No such user!');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [currentUser]);

  // Fetch user's posts
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(collection(db, 'posts'), where('user.uid', '==', currentUser.uid));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribePosts();
  }, [currentUser?.uid]);

  // Fetch user's groups
  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchUserGroups = async () => {
      try {
        const q = query(
          collection(db, 'neighborhoods'),
          where('members', 'array-contains', currentUser.uid)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const groups = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setUserGroups(groups);
          setLoadingGroups(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching user groups:', error);
        setLoadingGroups(false);
      }
    };

    fetchUserGroups();
  }, [currentUser?.uid]);

  const handleMenuOpen = (event, post) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedPost(post);
  };

  const handleMenuClose = (event) => {
    event?.stopPropagation();
    setAnchorEl(null);
  };

  const handleDeleteClick = (event) => {
    handleMenuClose(event);
    setDeleteDialogOpen(true);
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;

    try {
      await deleteDoc(doc(db, 'posts', selectedPost.id));
      setDeleteDialogOpen(false);
      // Optional: Show success message
      alert('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleMessageClick = async (recipientId) => {
    if (!currentUser) {
      // Handle not logged in case
      return;
    }

    try {
      // Check if a chat already exists between these users
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      let existingChat = null;
      
      querySnapshot.forEach((doc) => {
        const chatData = doc.data();
        if (chatData.participants.includes(recipientId)) {
          existingChat = { id: doc.id, ...chatData };
        }
      });

      if (existingChat) {
        // If chat exists, navigate to it
        navigate(`/chat/${existingChat.id}`);
      } else {
        // Create new chat
        const newChatRef = await addDoc(collection(db, 'chats'), {
          participants: [currentUser.uid, recipientId],
          createdAt: serverTimestamp(),
          lastMessage: null,
          lastMessageTime: null,
          messages: []
        });

        // Navigate to the new chat
        navigate(`/chat/${newChatRef.id}`);
      }
    } catch (error) {
      console.error('Error creating/finding chat:', error);
      // Handle error (show notification, etc.)
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 8, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            User not found.
          </Typography>
        </Box>
        <NavBar />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ px: isMobile ? 2 : 3 }}>
      <Box sx={{ mt: isMobile ? 2 : 4, mb: 8 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: isMobile ? 2 : 4,
            borderRadius: 2,
            position: 'relative'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'center' : 'flex-start',
            gap: 2,
            mb: 3 
          }}>
            <Avatar
              src={user?.photoURL}
              alt={user?.displayName}
              sx={{
                width: isMobile ? 80 : 120,
                height: isMobile ? 80 : 120,
                mb: isMobile ? 1 : 0
              }}
            />
            <Box sx={{ 
              flex: 1,
              textAlign: isMobile ? 'center' : 'left'
            }}>
              <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" sx={{ mb: 1 }}>
                {user?.displayName}
              </Typography>
              {user?.username && (
                <Typography variant="body1" color="textSecondary" sx={{ mb: 1 }}>
                  @{user.username}
                </Typography>
              )}
              <Typography variant="body1" color="textSecondary" sx={{ mb: 1 }}>
                {user?.email}
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex',
              gap: 1,
              position: isMobile ? 'static' : 'absolute',
              top: isMobile ? 'auto' : 20,
              right: isMobile ? 'auto' : 20,
              justifyContent: isMobile ? 'center' : 'flex-end',
              width: isMobile ? '100%' : 'auto',
              mt: isMobile ? 1 : 0
            }}>
              <IconButton onClick={() => navigate('/bookmarks')}>
                <BookmarkIcon />
              </IconButton>
              <IconButton onClick={() => navigate('/settings')}>
                <SettingsIcon />
              </IconButton>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{ mb: 2 }}
            variant="fullWidth"
          >
            <Tab 
              label="Posts" 
              icon={<BookmarkIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Groups" 
              icon={<GroupsIcon />} 
              iconPosition="start"
            />
          </Tabs>

          {tabValue === 0 && (
            <List sx={{ width: '100%' }}>
              {posts.length > 0 ? (
                posts.map((post) => (
                  <React.Fragment key={post.id}>
                    <ListItem 
                      alignItems="flex-start"
                      sx={{ 
                        flexDirection: 'column',
                        gap: 1,
                        py: 2,
                        position: 'relative'
                      }}
                    >
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, post)}
                        sx={{ 
                          position: 'absolute',
                          top: 8,
                          right: 8
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>

                      <ListItemText
                        primary={
                          <Box sx={{ mb: 1, pr: 4 }}>
                            <Typography 
                              variant={isMobile ? "body1" : "h6"} 
                              color="primary"
                              sx={{ mb: 1 }}
                            >
                              {post.requestType}
                            </Typography>
                            <Typography 
                              variant="body1"
                              sx={{ 
                                fontSize: isMobile ? '0.9rem' : '1rem'
                              }}
                            >
                              {post.description}
                            </Typography>
                            {post.dateRange && (
                              <Typography 
                                variant="caption" 
                                color="textSecondary"
                                sx={{ 
                                  display: 'block',
                                  mt: 1,
                                  fontSize: isMobile ? '0.75rem' : '0.875rem'
                                }}
                              >
                                Needed: {new Date(post.dateRange.start).toLocaleDateString()} - {new Date(post.dateRange.end).toLocaleDateString()}
                              </Typography>
                            )}
                            {post.imageUrl && (
                              <Box sx={{ mt: 2 }}>
                                <img
                                  src={post.imageUrl}
                                  alt="Post"
                                  style={{ 
                                    maxWidth: '100%', 
                                    maxHeight: 300, 
                                    borderRadius: 8,
                                    objectFit: 'cover' 
                                  }} 
                                />
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))
              ) : (
                <Typography 
                  variant="body1" 
                  color="textSecondary" 
                  sx={{ 
                    textAlign: 'center', 
                    mt: 2,
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}
                >
                  No posts yet.
                </Typography>
              )}
            </List>
          )}

          {tabValue === 1 && (
            <>
              {loadingGroups ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {userGroups.length > 0 ? (
                    userGroups.map((group) => (
                      <Grid item xs={12} sm={6} key={group.id}>
                        <Card sx={{ height: '100%' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar 
                                src={group.coverImage} 
                                sx={{ 
                                  mr: 2,
                                  width: 56,
                                  height: 56,
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
                                  {group.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {group.members?.length || 0} members
                                </Typography>
                              </Box>
                            </Box>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{
                                display: '-webkit-box',
                                overflow: 'hidden',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,
                                mb: 2
                              }}
                            >
                              {group.description}
                            </Typography>
                          </CardContent>
                          <CardActions>
                            <Button 
                              size="small" 
                              onClick={() => navigate(`/neighborhoods/${group.id}`)}
                              startIcon={<ArrowForward />}
                            >
                              View Group
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                          Not a member of any groups yet
                        </Typography>
                        <Button 
                          variant="contained" 
                          sx={{ mt: 2 }}
                          onClick={() => navigate('/neighborhoods')}
                        >
                          Find Groups
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              )}
            </>
          )}
        </Paper>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem 
          onClick={handleDeleteClick}
          sx={{ 
            color: 'error.main',
            '&:hover': { backgroundColor: 'error.light' }
          }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Post
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>
          Delete Post
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this post? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeletePost}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <NavBar />
    </Container>
  );
}

export default ProfilePage;