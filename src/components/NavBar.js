import React, { useState, useEffect } from 'react';
import { BottomNavigation, BottomNavigationAction, Paper, Badge } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ChatIcon from '@mui/icons-material/Chat';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase'; // Import auth and db from firebase
import { People as PeopleIcon } from '@mui/icons-material';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = auth.currentUser; // Get the current authenticated user
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const count = snapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        // Only count messages that are:
        // 1. Not seen by current user
        // 2. Last message is not from current user
        // 3. Has a last message (conversation isn't empty)
        const isUnread = !data.lastMessageSeenBy?.includes(currentUser.uid);
        const isFromOther = data.lastMessageFrom !== currentUser.uid;
        const hasMessage = !!data.lastMessage;
        
        return acc + (isUnread && isFromOther && hasMessage ? 1 : 0);
      }, 0);
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Reset badge when entering messages screen
  useEffect(() => {
    if (location.pathname === '/messages') {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
      <BottomNavigation showLabels value={location.pathname}>
        <BottomNavigationAction
          label="Home"
          icon={<HomeIcon />}
          onClick={() => navigate('/main-feed')}
          value="/main-feed"
        />
        <BottomNavigationAction
          label="Messages"
          icon={
            <Badge 
              badgeContent={unreadCount || null} 
              color="primary" 
              sx={{
                '& .MuiBadge-badge': {
                  right: -3,
                  top: 3,
                  minWidth: 20,
                  height: 20,
                  fontSize: '0.75rem',
                }
              }}
            >
              <ChatIcon />
            </Badge>
          }
          onClick={() => navigate('/messages')}
          value="/messages"
        />
        <BottomNavigationAction
          label="Create"
          icon={<AddIcon />}
          onClick={() => navigate('/create-post')}
          value="/create-post"
        />
        <BottomNavigationAction
          label="Search"
          icon={<SearchIcon />}
          onClick={() => navigate('/search')}
          value="/search"
        />
        <BottomNavigationAction
          label="Profile"
          icon={<PersonIcon />}
          onClick={() => navigate(`/profile/${currentUser?.uid}`)} // Navigate to the profile page of the current user
          value={`/profile/${currentUser?.uid}`}
        />
      </BottomNavigation>
    </Paper>
  );
}

export default NavBar;