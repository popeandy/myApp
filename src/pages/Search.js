import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Paper,
  InputAdornment,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  Stack,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material'; // Using Material-UI's SearchIcon
import { collection, query, where, getDocs, addDoc, getDoc, doc, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import NavBar from '../components/NavBar';
import { formatDistanceToNow } from 'date-fns';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [postResults, setPostResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUserFriends, setCurrentUserFriends] = useState([]);
  const [activeTab, setActiveTab] = useState(0); // 0 for users, 1 for posts
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [neighborhoodResults, setNeighborhoodResults] = useState([]);
  const navigate = useNavigate();

  // Define categories
  const categories = [
    { label: 'All', value: 'all' },
    { label: 'Pet Sitting', value: 'petSitting' },
    { label: 'Baby Sitting', value: 'babySitting' },
    { label: 'House Sitting', value: 'houseSitting' },
    { label: 'Mail Collection', value: 'mailCollection' },
    { label: 'Yard Work', value: 'yardWork' },
    { label: 'Other', value: 'other' },
  ];

  // Fetch current user's friends when component mounts
  useEffect(() => {
    const fetchCurrentUserFriends = async () => {
      if (!auth.currentUser) return;
      
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setCurrentUserFriends(userDoc.data().friends || []);
      }
    };

    fetchCurrentUserFriends();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.trim() === '') {
        setUserResults([]);
        setPostResults([]);
        setNeighborhoodResults([]);
        return;
      }

      setLoading(true);
      try {
        // Search users
        const userQuery = query(
          collection(db, 'users'),
          where('displayName', '>=', searchQuery),
          where('displayName', '<=', searchQuery + '\uf8ff')
        );
        const userSnapshot = await getDocs(userQuery);
        const users = userSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.id !== auth.currentUser?.uid);

        // Search neighborhoods
        const neighborhoodQuery = query(
          collection(db, 'neighborhoods'),
          where('name', '>=', searchQuery),
          where('name', '<=', searchQuery + '\uf8ff')
        );
        const neighborhoodSnapshot = await getDocs(neighborhoodQuery);
        const neighborhoods = neighborhoodSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }));

        // Update post search to handle "other" category
        let postQuery;
        if (selectedCategory === 'all') {
          postQuery = query(
            collection(db, 'posts'),
            orderBy('timestamp', 'desc')
          );
        } else if (selectedCategory === 'other') {
          // For "other", get all posts and filter out the known categories
          postQuery = query(
            collection(db, 'posts'),
            orderBy('timestamp', 'desc')
          );
          const postSnapshot = await getDocs(postQuery);
          const mainCategories = ['petSitting', 'babySitting', 'houseSitting', 'mailCollection', 'yardWork'];
          const posts = postSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(post => {
              // Include posts that don't match any main category
              return !mainCategories.includes(post.category) &&
                (post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 post.title?.toLowerCase().includes(searchQuery.toLowerCase()));
            });

          setPostResults(posts);
          setLoading(false);
          return;
        } else {
          postQuery = query(
            collection(db, 'posts'),
            where('category', '==', selectedCategory),
            orderBy('timestamp', 'desc')
          );
        }

        const postSnapshot = await getDocs(postQuery);
        const posts = postSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(post => {
            const description = post.description?.toLowerCase() || '';
            const title = post.title?.toLowerCase() || '';
            const searchLower = searchQuery.toLowerCase();
            return description.includes(searchLower) || title.includes(searchLower);
          });

        setUserResults(users);
        setPostResults(posts);
        setNeighborhoodResults(neighborhoods);
      } catch (error) {
        console.error('Search error:', error);
      }
      setLoading(false);
    };

    const debounceTimer = setTimeout(fetchResults, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleSendFriendRequest = async (userId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('You need to be signed in to send friend requests.');
      return;
    }

    try {
      await addDoc(collection(db, 'friendRequests'), {
        from: currentUser.uid,
        to: userId,
        status: 'pending',
        timestamp: new Date(),
      });
      alert('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request.');
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  const handlePostClick = (post) => {
    navigate(`/user/${post.user.uid}`);
  };

  const handleNeighborhoodClick = (neighborhoodId) => {
    navigate(`/neighborhoods/${neighborhoodId}`);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 8 }}>
        {/* Search Bar */}
        <Box sx={{ mb: 4 }}>
          <TextField
            type="search"
            placeholder="Search users or posts..."
            variant="outlined"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 8,
              },
            }}
          />
        </Box>

        {/* Category Filters */}
        <Box sx={{ mb: 3, overflowX: 'auto' }}>
          <Stack 
            direction="row" 
            spacing={1} 
            sx={{ 
              pb: 1,
              '::-webkit-scrollbar': { display: 'none' },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {categories.map((category) => (
              <Chip
                key={category.value}
                label={category.label}
                onClick={() => handleCategoryChange(category.value)}
                color={selectedCategory === category.value ? "primary" : "default"}
                variant={selectedCategory === category.value ? "filled" : "outlined"}
                sx={{ 
                  '&:hover': { bgcolor: selectedCategory === category.value ? 'primary.main' : 'action.hover' },
                  minWidth: 'fit-content'
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} centered>
            <Tab label="Users" />
            <Tab label="Posts" />
            <Tab label="Neighborhoods" />
          </Tabs>
        </Box>

        {/* Loading Indicator */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Results */}
        {activeTab === 0 ? (
          // Users Results
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {userResults.length > 0 ? (
              userResults.map((user) => (
                <Paper
                  key={user.id}
                  elevation={3}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                  onClick={() => handleUserClick(user.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={user.photoURL}
                      alt={user.displayName}
                      sx={{ width: 56, height: 56 }}
                    />
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {user.displayName}
                      </Typography>
                      {user.username && (
                        <Typography variant="body2" color="textSecondary">
                          @{user.username}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Paper>
              ))
            ) : (
              searchQuery.trim() !== '' && !loading && (
                <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center' }}>
                  No users found.
                </Typography>
              )
            )}
          </Box>
        ) : activeTab === 1 ? (
          // Posts Results
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {postResults.length > 0 ? (
              postResults.map((post) => (
                <Paper
                  key={post.id}
                  elevation={3}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                  onClick={() => handlePostClick(post)}
                >
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar
                      src={post.user?.photoURL}
                      alt={post.user?.displayName}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {post.user?.displayName}
                      </Typography>
                      {post.user?.username && (
                        <Typography variant="body2" color="textSecondary">
                          @{post.user.username}
                        </Typography>
                      )}
                      {post.title && (
                        <Typography variant="h6" sx={{ mt: 1, fontWeight: 'medium' }}>
                          {post.title}
                        </Typography>
                      )}
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {post.description}
                      </Typography>
                      {post.imageUrl && (
                        <Box sx={{ mt: 2 }}>
                          <img
                            src={post.imageUrl}
                            alt="Post"
                            style={{
                              maxWidth: '100%',
                              maxHeight: 200,
                              borderRadius: 8,
                              objectFit: 'cover',
                            }}
                          />
                        </Box>
                      )}
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        {post.timestamp ? formatDistanceToNow(post.timestamp.toDate(), { addSuffix: true }) : ''}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))
            ) : (
              searchQuery.trim() !== '' && !loading && (
                <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center' }}>
                  No posts found.
                </Typography>
              )
            )}
          </Box>
        ) : (
          // Neighborhoods Results
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {neighborhoodResults.length > 0 ? (
              neighborhoodResults.map((neighborhood) => (
                <Paper
                  key={neighborhood.id}
                  elevation={3}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                  onClick={() => handleNeighborhoodClick(neighborhood.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar>
                      {neighborhood.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {neighborhood.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {neighborhood.location}
                      </Typography>
                      {neighborhood.description && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {neighborhood.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Paper>
              ))
            ) : (
              searchQuery.trim() !== '' && !loading && (
                <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center' }}>
                  No neighborhoods found.
                </Typography>
              )
            )}
          </Box>
        )}
      </Box>
      <NavBar />
    </Container>
  );
};

export default Search;