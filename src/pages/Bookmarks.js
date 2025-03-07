import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Container, Box, Typography, Paper, TextField, Button, CardMedia } from "@mui/material";
import { ExternalLink, Trash2 } from "lucide-react";
import { collection, query, where, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import NavBar from "../components/NavBar";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Bookmarks = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [bookmarks, setBookmarks] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchBookmarks = async () => {
      try {
        const q = query(collection(db, "bookmarks"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const bookmarkedPosts = [];

        for (const docSnapshot of querySnapshot.docs) {
          const bookmarkData = docSnapshot.data();
          const postDoc = await getDoc(doc(db, "posts", bookmarkData.postId));
          if (postDoc.exists()) {
            const postData = postDoc.data();
            bookmarkedPosts.push({
              id: postDoc.id,
              title: postData.title,
              description: postData.description,
              imageUrl: postData.imageUrl,
              dateAdded: bookmarkData.timestamp.toDate().toLocaleDateString(),
              userId: postData.user.uid,
            });
          }
        }

        setBookmarks(bookmarkedPosts);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      }
    };

    fetchBookmarks();
  }, [user]);

  const filteredBookmarks = bookmarks.filter(
    (bookmark) =>
      bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const removeBookmark = async (id) => {
    try {
      const q = query(collection(db, "bookmarks"), where("userId", "==", user.uid), where("postId", "==", id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        await deleteDoc(doc(db, "bookmarks", querySnapshot.docs[0].id));
        setBookmarks(bookmarks.filter((bookmark) => bookmark.id !== id));
      }
    } catch (error) {
      console.error("Error removing bookmark:", error);
    }
  };

  const handleVisit = (userId) => {
    navigate(`/view-other-page/${userId}`);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 8 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
          Bookmarks
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search bookmarks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 4 }}
        />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {filteredBookmarks.map((bookmark) => (
            <Paper key={bookmark.id} elevation={3} sx={{ p: 4, borderRadius: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              {bookmark.imageUrl && (
                <CardMedia
                  component="img"
                  height="200"
                  image={bookmark.imageUrl}
                  alt="Post Image"
                  sx={{ borderRadius: 2, mb: 2 }}
                />
              )}
              <Typography variant="body2" color="textSecondary">
                {bookmark.dateAdded}
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {bookmark.title}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {bookmark.description}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleVisit(bookmark.userId)}
                  startIcon={<ExternalLink size={16} />}
                >
                  Visit
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={() => removeBookmark(bookmark.id)}
                  startIcon={<Trash2 size={16} />}
                >
                  Remove
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>
      <NavBar />
    </Container>
  );
};

Bookmarks.propTypes = {
  searchTerm: PropTypes.string,
  bookmarks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      dateAdded: PropTypes.string.isRequired,
      userId: PropTypes.string.isRequired,
    })
  ),
  user: PropTypes.object,
};

export default Bookmarks;