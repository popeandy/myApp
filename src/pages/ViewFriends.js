import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db, auth } from '@/firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import {
  Container,
  Box,
  Typography,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  CircularProgress,
} from '@mui/material'
import { ArrowLeft } from 'lucide-react'
import NavBar from '@/components/NavBar'

export default function ViewFriends() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)

  // Add auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
      } else {
        navigate('/login')
      }
    })

    return () => unsubscribe()
  }, [navigate])

  useEffect(() => {
    const fetchUserAndFriends = async () => {
      if (!currentUser) return

      console.log('Fetching friends for user:', userId)
      try {
        // First get the user's document
        const userDoc = await getDoc(doc(db, 'users', userId))
        console.log('User document:', userDoc.data())
        
        if (userDoc.exists()) {
          const userData = { id: userDoc.id, ...userDoc.data() }
          setUser(userData)
          console.log('User data:', userData)

          // Check if user has friends array
          if (userData.friends && userData.friends.length > 0) {
            console.log('Found friends in user data:', userData.friends)
            
            const friendsData = []
            // Fetch each friend's details
            for (const friendId of userData.friends) {
              const friendDoc = await getDoc(doc(db, 'users', friendId))
              if (friendDoc.exists()) {
                friendsData.push({ id: friendDoc.id, ...friendDoc.data() })
              }
            }
            
            console.log('Processed friends data:', friendsData)
            setFriends(friendsData)
          } else {
            console.log('No friends found in user data')
            setFriends([])
          }
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching friends:', error)
        setLoading(false)
      }
    }

    if (userId && currentUser) {
      fetchUserAndFriends()
    }
  }, [userId, currentUser])

  const handleBack = () => {
    // Check if the user is viewing their own profile or someone else's
    if (userId === currentUser?.uid) {
      navigate('/profile')
    } else {
      navigate(`/user/${userId}`)
    }
  }

  const handleFriendClick = (friendId) => {
    console.log('Navigating to friend profile:', friendId)
    navigate(`/user/${friendId}`)
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <NavBar />
      <Paper elevation={3} sx={{ mt: 4, p: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowLeft />
          </IconButton>
          <Typography variant="h5" fontWeight="bold">
            {user?.displayName}'s Friends
          </Typography>
        </Box>
        
        <List>
          {friends.length > 0 ? (
            friends.map((friend) => (
              <ListItem 
                key={friend.id}
                button
                onClick={() => handleFriendClick(friend.id)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                  borderRadius: 1,
                  mb: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:active': {
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    transform: 'scale(0.98)',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar 
                    src={friend.photoURL || "/default-avatar.png"} 
                    alt={friend.displayName}
                    sx={{ width: 50, height: 50 }}
                  />
                </ListItemAvatar>
                <ListItemText 
                  primary={
                    <Typography variant="subtitle1" fontWeight="medium">
                      {friend.displayName}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="textSecondary">
                      @{friend.username}
                    </Typography>
                  }
                />
              </ListItem>
            ))
          ) : (
            <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', mt: 2 }}>
              No friends yet.
            </Typography>
          )}
        </List>
      </Paper>
    </Container>
  )
}