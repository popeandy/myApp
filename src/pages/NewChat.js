import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Container, Box, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';

function NewChat() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch the current user's friends
  useEffect(() => {
    const q = query(collection(db, 'users'), where('friends', 'array-contains', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const friendsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFriends(friendsData);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  // Handle friend selection
  const handleSelectFriend = (friendId) => {
    navigate(`/chat/${friendId}`); // Navigate to the chat page with the selected friend
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 8 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>
          New Chat
        </Typography>
        <TextField
          fullWidth
          label="Search friends"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 4 }}
        />
        <List>
          {friends
            .filter((friend) =>
              friend.displayName.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((friend) => (
              <ListItem
                key={friend.id}
                button
                onClick={() => handleSelectFriend(friend.id)}
                sx={{
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <ListItemAvatar>
                  <Avatar src={friend.photoURL} alt={friend.displayName} />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight="medium">
                      {friend.displayName}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
        </List>
      </Box>
      <NavBar />
    </Container>
  );
}

export default NewChat;