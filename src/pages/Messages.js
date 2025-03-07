"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Typography,
  List,
  Avatar,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Badge,
  Paper,
  Tooltip,
} from "@mui/material"
import { AddComment, ChevronRight } from "@mui/icons-material"
import { db, auth } from "../firebase"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"
import NavBar from "../components/NavBar"

function Messages() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth.currentUser) return

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", auth.currentUser.uid),
      orderBy("lastMessageTime", "desc"),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversationsData = snapshot.docs
        .map((doc) => {
          const data = doc.data()
          if (!data.participants || !data.userNames) {
            return null
          }
          return {
            id: doc.id,
            ...data,
            lastMessageTime: data.lastMessageTime?.toDate(),
          }
        })
        .filter(Boolean)

      setConversations(conversationsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleNewChat = () => {
    navigate("/new-chat")
  }

  const getTimeLabel = (date) => {
    if (!date) return ""
    return formatDistanceToNow(date, { addSuffix: true })
  }

  return (
    <Box
      sx={{
        height: "100vh",
        bgcolor: theme.palette.background.default,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        component={Paper}
        elevation={0}
        sx={{
          width: "100%",
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 2,
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: 24, sm: 28, md: 32 },
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          My Messages
        </Typography>
        <Tooltip title="New conversation">
          <IconButton
            onClick={handleNewChat}
            color="primary"
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              "&:hover": {
                bgcolor: theme.palette.primary.dark,
              },
              "& .MuiSvgIcon-root": {
                fontSize: { xs: 24, sm: 28 },
              },
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
            }}
          >
            <AddComment />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Messages List */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          px: { xs: 2, sm: 3, md: 4 },
          py: 2,
          bgcolor: theme.palette.background.default,
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress size={40} />
          </Box>
        ) : conversations.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "70%",
              textAlign: "center",
              px: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No conversations yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start a new conversation by clicking the plus button
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {conversations.map((conversation) => {
              if (!conversation?.participants || !conversation?.userNames) {
                return null
              }

              const otherUserIndex = conversation.participants.findIndex((id) => id !== auth.currentUser?.uid)

              if (otherUserIndex === -1 || !conversation.userNames[otherUserIndex]) {
                return null
              }

              const otherUserName = conversation.userNames[otherUserIndex]
              const isUnread = !conversation.lastMessageSeenBy?.includes(auth.currentUser?.uid)

              return (
                <Paper
                  key={conversation.id}
                  elevation={0}
                  onClick={() => navigate(`/chat/${conversation.id}`)}
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    cursor: "pointer",
                    overflow: "hidden",
                    border: `1px solid ${theme.palette.divider}`,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: theme.shadows[2],
                      borderColor: "transparent",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      width: "100%",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: { xs: 2, sm: 2.5 },
                      bgcolor: isUnread ? 'action.hover' : 'transparent',
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                      <Badge
                        overlap="circular"
                        variant="dot"
                        color="primary"
                        invisible={!isUnread}
                        sx={{
                          '& .MuiBadge-badge': {
                            right: 2,
                            top: 2,
                          }
                        }}
                      >
                        <Avatar
                          src={conversation.photoURL}
                          alt={otherUserName}
                          sx={{
                            width: { xs: 48, sm: 56 },
                            height: { xs: 48, sm: 56 },
                            bgcolor: 'grey.300',
                          }}
                        >
                          {otherUserName.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                      <Box sx={{ ml: 2, overflow: "hidden" }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: isUnread ? 700 : 500,
                            color: theme.palette.text.primary,
                          }}
                        >
                          {otherUserName}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: isUnread ? theme.palette.text.primary : theme.palette.text.secondary,
                            fontWeight: isUnread ? 500 : 400,
                            maxWidth: { xs: 150, sm: 200, md: 300 },
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {conversation.lastMessage || "Start a conversation"}
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        ml: 1,
                        minWidth: 80,
                      }}
                    >
                      {conversation.lastMessageTime && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: isUnread ? theme.palette.primary.main : theme.palette.text.secondary,
                            fontWeight: isUnread ? 600 : 400,
                            mb: 0.5,
                          }}
                        >
                          {getTimeLabel(conversation.lastMessageTime)}
                        </Typography>
                      )}
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {isUnread && (
                          <Badge 
                            color="primary" 
                            variant="dot" 
                            sx={{ 
                              mr: 1,
                              '& .MuiBadge-badge': {
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                              }
                            }} 
                          />
                        )}
                        <ChevronRight
                          sx={{
                            color: isUnread ? theme.palette.primary.main : theme.palette.action.active,
                            fontSize: 20,
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              )
            })}
          </List>
        )}
      </Box>
      <NavBar />
    </Box>
  )
}

export default Messages

