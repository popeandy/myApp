import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, where, getDocs, getDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  Container,
  Box,
  CardContent,
  CardMedia,
  Typography,
  Avatar,
  IconButton,
  Grid,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useMediaQuery,
  Tooltip,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  TextField,
  Card,
} from '@mui/material';
import { Share as ShareIcon, MoreVert as MoreVertIcon, Report as ReportIcon, Block as BlockIcon, Delete as DeleteIcon, People as PeopleIcon } from '@mui/icons-material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import NavBar from '../components/NavBar';

function MainFeed() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [shareError, setShareError] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPostForReport, setSelectedPostForReport] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    let q;
    if (activeTab === 0) {
      // Community feed (all posts)
      q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    } else {
      // Friends feed (only posts from friends)
      const userFriends = user.friends || [];
      console.log('Current user friends:', userFriends); // Debug log
      
      // Make sure we have a valid array of friend IDs
      if (userFriends.length === 0) {
        // If no friends, only show user's own posts
        q = query(
          collection(db, 'posts'),
          where('user.uid', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
      } else {
        // Show posts from friends and user
        q = query(
          collection(db, 'posts'),
          where('user.uid', 'in', [user.uid, ...userFriends]),
          orderBy('timestamp', 'desc')
        );
      }
    }

    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        console.log('Post data:', data); // Debug log
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || null,
        };
      });
      setPosts(postsData);
    }, (error) => {
      // If we get an index error, log it and provide the link
      if (error.code === 'failed-precondition') {
        console.error('Please create the following index:', error.message);
        // The error message includes a link to create the required index
      }
    });

    return () => unsubscribePosts();
  }, [user, activeTab]);

  // Add this useEffect to fetch user data including friends list
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser(prevUser => ({
            ...prevUser,
            friends: userData.friends || []
          }));
          console.log('User friends list:', userData.friends); // Debug log
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;

    const fetchBookmarkedPosts = async () => {
      const q = query(collection(db, 'bookmarks'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const bookmarkedPostIds = querySnapshot.docs.map((doc) => doc.data().postId);
      setBookmarkedPosts(bookmarkedPostIds);
    };

    fetchBookmarkedPosts();
  }, [user]);

  const handlePostClick = (postUserId) => {
    navigate(`/user/${postUserId}`);
  };

  const handleBookmark = async (postId, postUserId) => {
    if (postUserId === user.uid) {
      alert("You cannot bookmark your own posts.");
      return;
    }

    try {
      const q = query(collection(db, 'bookmarks'), where('userId', '==', user.uid), where('postId', '==', postId));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        await addDoc(collection(db, 'bookmarks'), {
          userId: user.uid,
          postId: postId,
          timestamp: new Date(),
        });
        setBookmarkedPosts([...bookmarkedPosts, postId]);
      } else {
        await deleteDoc(querySnapshot.docs[0].ref);
        setBookmarkedPosts(bookmarkedPosts.filter((id) => id !== postId));
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleShare = async (post, event) => {
    event.stopPropagation(); // Prevent post click event

    // Construct share text
    const shareText = `Check out this post from NeighborlyNeeds:\n\n${post.requestType || ''}\n${post.description || ''}\n\nPosted by: ${post.user?.displayName || 'Anonymous'}`;
    
    // Construct share data
    const shareData = {
      title: 'NeighborlyNeeds Post',
      text: shareText,
    };

    // If post has an image, add it to share data
    if (post.imageUrl) {
      try {
        // Fetch the image and create a blob
        const response = await fetch(post.imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'post-image.jpg', { type: 'image/jpeg' });
        shareData.files = [file];
      } catch (error) {
        console.error('Error preparing image for share:', error);
      }
    }

    try {
      if (navigator.share) {
        // Use native share if available
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(shareText);
        alert('Post details copied to clipboard!');
      } else {
        throw new Error('Sharing not supported on this device');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      setShareError(true);
    }
  };

  const handleMenuOpen = (event, post) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedPostForReport(post);
  };

  const handleMenuClose = (event) => {
    event?.stopPropagation();
    setAnchorEl(null);
  };

  const handleReportClick = (event) => {
    handleMenuClose(event);
    setReportDialogOpen(true);
  };

  const handleReportSubmit = async () => {
    if (!selectedPostForReport || !reportReason.trim()) return;

    try {
      // Add report to Firebase
      await addDoc(collection(db, 'reports'), {
        postId: selectedPostForReport.id,
        postAuthorId: selectedPostForReport.user.uid,
        postAuthorName: selectedPostForReport.user.displayName,
        reportedBy: auth.currentUser.uid,
        reporterName: auth.currentUser.displayName,
        reason: reportReason,
        timestamp: serverTimestamp(),
        status: 'pending',
        postContent: {
          description: selectedPostForReport.description,
          requestType: selectedPostForReport.requestType,
          imageUrl: selectedPostForReport.imageUrl || null,
        }
      });

      setReportSubmitted(true);
      setTimeout(() => {
        setReportDialogOpen(false);
        setReportReason('');
        setReportSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    }
  };

  const handleDeleteClick = (event) => {
    handleMenuClose(event);
    setDeleteDialogOpen(true);
  };

  const handleDeletePost = async () => {
    if (!selectedPostForReport) return;

    try {
      // Delete the post from Firestore
      await deleteDoc(doc(db, 'posts', selectedPostForReport.id));
      setDeleteDialogOpen(false);
      // Optional: Show success message
      alert('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 2 }}>
        <Card 
          sx={{ 
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' },
            mb: 2
          }}
          onClick={() => navigate('/neighborhoods')}
        >
          <CardContent sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="h6">
                  Neighborhoods
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect with your local community
                </Typography>
              </Box>
            </Box>
            <Button variant="outlined">
              View All
            </Button>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ 
        mt: 4, 
        mb: 8, 
        minHeight: '100vh',
        backgroundColor: 'white'  // Changed from #f8f9fa to white
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            mb: 2, 
            textAlign: 'center', 
            color: '#2C3E50',
            fontWeight: 700,
            letterSpacing: '0.5px'
          }}
        >
          Feed
        </Typography>

        {user && (
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 4, 
              textAlign: 'center', 
              color: '#34495E',  // Slightly lighter blue-gray
              fontWeight: 500
            }}
          >
            Welcome back, {user.displayName}!
          </Typography>
        )}

        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          mb: 4,
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            centered
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                color: '#7F8C8D',  // Muted gray for inactive tabs
                py: 2,
              },
              '& .Mui-selected': {
                color: '#3498DB',  // Bright blue for active tab
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#3498DB',
                height: 3,
              },
            }}
          >
            <Tab label="Community" />
            <Tab label="Friends" />
          </Tabs>
        </Box>

        {activeTab === 1 && posts.length === 0 && (
          <Typography 
            variant="body1" 
            sx={{ 
              textAlign: 'center', 
              mt: 4, 
              color: '#95A5A6',
              fontStyle: 'italic',
              fontSize: '1.1rem'
            }}
          >
            No posts from friends yet. Add some friends to see their posts here!
          </Typography>
        )}

        <Grid container spacing={3}>
          {posts.map((post) => (
            <Grid item xs={12} sm={6} md={4} key={post.id}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  border: '1px solid #E0E0E0',
                  '&:hover': {
                    transform: isMobile ? 'none' : 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  },
                  backgroundColor: 'white',
                }}
                onClick={() => handlePostClick(post.user.uid)}
              >
                {post.imageUrl && (
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={post.imageUrl}
                      alt="Post Image"
                      sx={{ 
                        cursor: 'pointer',
                        objectFit: 'cover'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(post.imageUrl, '_blank');
                      }}
                    />
                  </Box>
                )}
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2,
                    gap: 2
                  }}>
                    <Avatar
                      src={post.user?.photoURL}
                      alt={post.user?.displayName}
                      sx={{ 
                        width: 48, 
                        height: 48,
                        border: '2px solid #3498DB'
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{
                          fontWeight: 600,
                          color: '#2C3E50',
                          lineHeight: 1.2
                        }}
                      >
                        {post.user?.displayName}
                      </Typography>
                      {post.user?.username && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#7F8C8D',
                            display: 'block'
                          }}
                        >
                          @{post.user.username}
                        </Typography>
                      )}
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#95A5A6',
                          display: 'block'
                        }}
                      >
                        {post.timestamp ? formatDistanceToNow(post.timestamp, { addSuffix: true }) : 'Just now'}
                      </Typography>
                    </Box>
                    <IconButton 
                      onClick={(e) => handleMenuOpen(e, post)}
                      sx={{ color: '#7F8C8D' }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  {post.requestType && (
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        color: '#3498DB',
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        backgroundColor: '#EBF5FB',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        display: 'inline-block'
                      }}
                    >
                      {post.requestType}
                    </Typography>
                  )}

                  <Typography
                    variant="body1"
                    sx={{
                      color: '#34495E',
                      mb: 2,
                      fontSize: '1rem',
                      lineHeight: 1.6,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {post.description}
                  </Typography>

                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mt: 3,
                    pt: 2,
                    borderTop: '1px solid #EBF0F5'
                  }}>
                    <Button 
                      size="small" 
                      startIcon={<ShareIcon />} 
                      onClick={(e) => handleShare(post, e)}
                      sx={{ 
                        textTransform: 'none',
                        color: '#3498DB',
                        '&:hover': {
                          backgroundColor: '#EBF5FB'
                        }
                      }}
                    >
                      Share
                    </Button>
                    <Tooltip title={post.user?.uid === user?.uid ? "You cannot bookmark your own posts" : ""}>
                      <span>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookmark(post.id, post.user.uid);
                          }}
                          disabled={post.user?.uid === user?.uid}
                          sx={{
                            color: bookmarkedPosts.includes(post.id) ? '#3498DB' : '#95A5A6',
                            '&:hover': {
                              backgroundColor: '#EBF5FB'
                            }
                          }}
                        >
                          {bookmarkedPosts.includes(post.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <NavBar />

      <Dialog open={!!selectedPost} onClose={() => setSelectedPost(null)} fullWidth maxWidth="sm">
        {selectedPost && (
          <>
            <DialogTitle>{selectedPost.user?.displayName || 'Anonymous'}</DialogTitle>
            <DialogContent>
              <Typography variant="body1">{selectedPost.description}</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedPost(null)} color="primary">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Post Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        {selectedPostForReport?.user?.uid === auth.currentUser?.uid ? (
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
        ) : (
          <MenuItem 
            onClick={handleReportClick}
            sx={{ 
              color: 'error.main',
              '&:hover': { backgroundColor: 'error.light' }
            }}
          >
            <ReportIcon sx={{ mr: 1 }} />
            Report Post
          </MenuItem>
        )}
      </Menu>

      {/* Report Dialog */}
      <Dialog 
        open={reportDialogOpen} 
        onClose={() => setReportDialogOpen(false)}
        onClick={(e) => e.stopPropagation()}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Report Post
        </DialogTitle>
        <DialogContent>
          {reportSubmitted ? (
            <DialogContentText color="success.main">
              Thank you for your report. We will review it shortly.
            </DialogContentText>
          ) : (
            <>
              <DialogContentText>
                Please explain why you're reporting this post. Your report will be reviewed by our team.
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label="Reason for reporting"
                fullWidth
                multiline
                rows={4}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                variant="outlined"
                sx={{ mt: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          {!reportSubmitted && (
            <>
              <Button 
                onClick={() => setReportDialogOpen(false)}
                color="primary"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleReportSubmit}
                color="error"
                variant="contained"
                disabled={!reportReason.trim()}
              >
                Submit Report
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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

      <Snackbar 
        open={shareError} 
        autoHideDuration={6000} 
        onClose={() => setShareError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShareError(false)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          Unable to share post. Try copying the text instead.
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default MainFeed;