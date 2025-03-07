"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { MessageSquare, UserPlus, UserMinus, Settings, Bookmark } from "lucide-react"
import { db, auth } from "@/firebase"
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, updateDoc, arrayUnion, arrayRemove, addDoc, getDocs, serverTimestamp } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { toast } from "react-toastify"
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
  useMediaQuery
} from '@mui/material'
import NavBar from "@/components/NavBar"
import { useNavigate } from "react-router-dom"

export default function ViewOtherProfile() {
  const { userId } = useParams()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [isFriend, setIsFriend] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })
    return () => unsubscribeAuth()
  }, [])

  useEffect(() => {
    if (!userId) return

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId))
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() })
        } else {
          toast.error("User not found")
          setUser(null)
        }

        if (currentUser) {
          const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid))
          if (currentUserDoc.exists()) {
            const friendsList = currentUserDoc.data().friends || []
            setIsFriend(friendsList.includes(userId))
          }
        }
      } catch (error) {
        toast.error("Error loading user data")
        console.error("Error fetching user:", error)
      }
    }

    const fetchPosts = () => {
      const postsQuery = query(
        collection(db, "posts"),
        where("user.uid", "==", userId),
        orderBy("timestamp", "desc")
      )
      
      return onSnapshot(postsQuery, (snapshot) => {
        const postsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        }))
        setPosts(postsData)
      })
    }

    if (userId) {
      setLoading(true)
      fetchUserData()
      const unsubscribePosts = fetchPosts()
      setLoading(false)

      return () => unsubscribePosts?.()
    }
  }, [userId, currentUser])

  const handleFriendship = async () => {
    if (!currentUser) {
      toast.error("Please login first")
      return
    }

    try {
      const currentUserRef = doc(db, "users", currentUser.uid)
      const otherUserRef = doc(db, "users", userId)

      if (isFriend) {
        await updateDoc(currentUserRef, {
          friends: arrayRemove(userId)
        })
        await updateDoc(otherUserRef, {
          friends: arrayRemove(currentUser.uid)
        })
        toast.success(`Unfriended ${user.displayName}`)
      } else {
        await updateDoc(currentUserRef, {
          friends: arrayUnion(userId)
        })
        await updateDoc(otherUserRef, {
          friends: arrayUnion(currentUser.uid)
        })
        toast.success(`Added ${user.displayName} as friend`)
      }
      setIsFriend(!isFriend)
    } catch (error) {
      toast.error("Error updating friendship")
      console.error("Friendship error:", error)
    }
  }

  const handleMessage = async () => {
    if (!currentUser || !userId) {
      toast.error("Please login to send messages");
      return;
    }

    try {
      // Check if a chat already exists
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      let existingChat = null;
      
      querySnapshot.forEach((doc) => {
        const chatData = doc.data();
        if (chatData.participants.includes(userId)) {
          existingChat = { id: doc.id, ...chatData };
        }
      });

      if (existingChat) {
        // If chat exists, navigate to existing chat
        navigate(`/chat/${existingChat.id}`);
      } else {
        // Create new chat
        const newChatRef = await addDoc(collection(db, 'chats'), {
          participants: [currentUser.uid, userId],
          userNames: [currentUser.displayName, user.displayName],
          photoURL: user.photoURL || '',
          lastMessage: '',
          lastMessageTime: serverTimestamp(),
          lastMessageSeenBy: [],
          createdAt: serverTimestamp()
        });

        // Navigate directly to the new chat
        navigate(`/chat/${newChatRef.id}`);
      }
    } catch (error) {
      console.error('Error creating/finding chat:', error);
      toast.error("Unable to start conversation");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (!user) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 8, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            User not found.
          </Typography>
        </Box>
      </Container>
    )
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
              <Button
                variant="contained"
                startIcon={<MessageSquare />}
                onClick={handleMessage}
                size={isMobile ? "small" : "medium"}
              >
                Message
              </Button>
              <Button
                variant="outlined"
                startIcon={isFriend ? <UserMinus /> : <UserPlus />}
                onClick={handleFriendship}
                size={isMobile ? "small" : "medium"}
              >
                {isFriend ? 'Unfriend' : 'Add Friend'}
              </Button>
            </Box>
          </Box>

          {/* Posts Section */}
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
              Posts
            </Typography>
            <List>
              {posts.length > 0 ? (
                posts.map((post) => (
                  <React.Fragment key={post.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar src={user.photoURL || "/default-avatar.png"} alt={user.displayName} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body1" fontWeight="medium">{post.description}</Typography>}
                        secondary={
                          <>
                            <Typography variant="body2" color="textSecondary">
                              {post.timestamp?.toLocaleDateString()}
                            </Typography>
                            {post.imageUrl && (
                              <Box sx={{ mt: 1 }}>
                                <img 
                                  src={post.imageUrl} 
                                  alt={post.description} 
                                  style={{ 
                                    maxWidth: '100%', 
                                    maxHeight: 300, 
                                    borderRadius: 8,
                                    objectFit: 'cover' 
                                  }} 
                                />
                              </Box>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))
              ) : (
                <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', mt: 2 }}>
                  No posts yet.
                </Typography>
              )}
            </List>
          </Paper>
        </Paper>
      </Box>
      <NavBar />
    </Container>
  )
}