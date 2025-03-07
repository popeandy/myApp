import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth, storage } from '@/firebase';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
  Container,
  Paper,
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
  CircularProgress,
  Fade,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Image as ImageIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';

export default function ChatPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatData, setChatData] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!chatId || !auth.currentUser) {
      navigate('/messages');
      return;
    }

    const fetchChatData = async () => {
      try {
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        if (chatDoc.exists()) {
          const data = chatDoc.data();
          setChatData(data);
          setMessages(data.messages || []);
          
          const otherUserId = data.participants.find(id => id !== auth.currentUser?.uid);
          if (otherUserId) {
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) {
              setOtherUser(userDoc.data());
            }
          }
        }
      } catch (error) {
        console.error('Error fetching chat:', error);
        toast.error('Error loading chat');
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();

    // Listen for chat updates
    const unsubscribe = onSnapshot(
      doc(db, 'chats', chatId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setMessages(data.messages || []);
          setChatData(data);
          scrollToBottom();
        }
      }
    );

    return () => unsubscribe();
  }, [chatId, navigate]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !e.target.files) return;

    try {
      setSending(true);
      const timestamp = new Date();
      
      const messageData = {
        text: newMessage.trim(),
        sender: auth.currentUser.uid,
        senderName: auth.currentUser.displayName,
        senderPhoto: auth.currentUser.photoURL,
        timestamp: timestamp,
        read: false,
      };

      await updateDoc(doc(db, 'chats', chatId), {
        messages: arrayUnion(messageData),
        lastMessage: newMessage.trim(),
        lastMessageTime: serverTimestamp(),
        [`lastRead.${auth.currentUser.uid}`]: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload only images');
      return;
    }

    try {
      setIsUploading(true);
      const storageRef = ref(storage, `chat-images/${chatId}/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          toast.error('Failed to upload image');
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const timestamp = new Date();
          
          const messageData = {
            type: 'image',
            imageUrl: downloadURL,
            sender: auth.currentUser.uid,
            senderName: auth.currentUser.displayName,
            senderPhoto: auth.currentUser.photoURL,
            timestamp: timestamp,
            read: false,
          };

          await updateDoc(doc(db, 'chats', chatId), {
            messages: arrayUnion(messageData),
            lastMessage: 'Sent an image',
            lastMessageTime: serverTimestamp(),
            [`lastRead.${auth.currentUser.uid}`]: serverTimestamp(),
          });

          setIsUploading(false);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error('Error handling image:', error);
      toast.error('Failed to process image');
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: 'background.default' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        bgcolor: theme.palette.background.default,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 3,
          py: 2,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <IconButton
          onClick={() => navigate('/messages')}
          sx={{
            color: theme.palette.text.primary,
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Avatar
          src={otherUser?.photoURL}
          alt={otherUser?.displayName}
          sx={{
            width: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
            bgcolor: theme.palette.primary.main,
          }}
        >
          {otherUser?.displayName?.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            {otherUser?.displayName || 'Chat'}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
            }}
          >
            {chatData?.isOnline ? 'Online' : 'Offline'}
          </Typography>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: { xs: 2, sm: 3 },
          py: 2,
          bgcolor: theme.palette.background.default,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {messages.map((message, index) => (
          <Box
            key={message.id || index}
            sx={{
              display: 'flex',
              justifyContent: message.sender === auth.currentUser?.uid ? 'flex-end' : 'flex-start',
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                maxWidth: '70%',
                bgcolor: message.sender === auth.currentUser?.uid 
                  ? theme.palette.primary.main 
                  : theme.palette.background.paper,
                color: message.sender === auth.currentUser?.uid 
                  ? theme.palette.primary.contrastText 
                  : theme.palette.text.primary,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              {message.type === 'image' ? (
                <Box
                  component="img"
                  src={message.imageUrl}
                  alt="Shared image"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: 300,
                    borderRadius: 1,
                  }}
                />
              ) : (
                <Typography variant="body1">{message.text}</Typography>
              )}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 0.5,
                  mt: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: message.sender === auth.currentUser?.uid 
                      ? 'rgba(255,255,255,0.7)' 
                      : theme.palette.text.secondary,
                  }}
                >
                  {message.timestamp?.toDate() && 
                    formatDistanceToNow(message.timestamp.toDate(), { addSuffix: true })}
                </Typography>
                {message.sender === auth.currentUser?.uid && (
                  <Tooltip title={message.read ? "Read" : "Sent"}>
                    {message.read ? (
                      <CheckCircleIcon sx={{ fontSize: 14, color: 'inherit' }} />
                    ) : (
                      <CheckIcon sx={{ fontSize: 14, color: 'inherit' }} />
                    )}
                  </Tooltip>
                )}
              </Box>
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Paper
        component="form"
        onSubmit={handleSendMessage}
        elevation={0}
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          bgcolor: theme.palette.background.paper,
        }}
      >
        <input
          type="file"
          accept="image/*"
          hidden
          ref={fileInputRef}
          onChange={handleImageUpload}
        />
        <IconButton
          color="primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          sx={{
            color: theme.palette.text.secondary,
          }}
        >
          <Badge
            color="secondary"
            variant="dot"
            invisible={!isUploading}
          >
            <ImageIcon />
          </Badge>
        </IconButton>
        <TextField
          fullWidth
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          variant="outlined"
          size="small"
          disabled={isUploading}
          multiline
          maxRows={4}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
            }
          }}
        />
        <IconButton
          type="submit"
          disabled={(!newMessage.trim() && !isUploading) || sending}
          sx={{
            bgcolor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
            '&.Mui-disabled': {
              bgcolor: theme.palette.action.disabledBackground,
            },
          }}
        >
          {sending ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            <SendIcon />
          )}
        </IconButton>
      </Paper>

      {/* Upload Progress */}
      {isUploading && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 80,
            left: 0,
            right: 0,
            p: 2,
            bgcolor: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CircularProgress
            variant="determinate"
            value={uploadProgress}
            size={24}
          />
          <Typography variant="body2">
            Uploading image... {Math.round(uploadProgress)}%
          </Typography>
        </Box>
      )}
    </Box>
  );
}