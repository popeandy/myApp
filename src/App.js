import React from 'react';
import './index.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import MainFeed from './pages/MainFeed';
import Messages from './pages/Messages';
import CreatePost from './pages/CreatePost';
import Search from './pages/Search';
import Login from './pages/Login';
import CreateAccount from './pages/CreateAccount';
import ChatPage from './pages/ChatPage';
import NewChat from './pages/NewChat';
import ProfilePage from './pages/ProfilePage';
import ViewOtherPage from './pages/ViewOtherProfile';
import SettingsWidget from './pages/SettingsWidget';
import Bookmarks from './pages/Bookmarks'; // Import the Bookmarks component
import ViewFriends from './pages/ViewFriends';
import ViewOtherProfile from './pages/ViewOtherProfile';
import Support from './pages/Support';
import CreateTicket from './pages/CreateTicket';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AboutUs from './pages/AboutUs';
import TermsAndConditions from './pages/TermsAndConditions';
import EditProfile from './pages/EditProfile';
import Neighborhoods from './pages/Neighborhoods.js';
import NeighborhoodDetail from './pages/NeighborhoodDetail';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/main-feed" element={<MainFeed />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:conversationId" element={<Messages />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/search" element={<Search />} />
          <Route path="/chat/:chatId" element={<ChatPage />} />
          <Route path="/new-chat/:chatId" element={<NewChat />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsWidget />} />
          <Route path="/bookmarks" element={<Bookmarks />} /> {/* Add the Bookmarks route */}
          <Route path="/user/:userId" element={<ViewOtherProfile />} />
          <Route path="/user/:userId/friends" element={<ViewFriends />} />
          <Route path="/support" element={<Support />} />
          <Route path="/create-ticket" element={<CreateTicket />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/neighborhoods" element={<Neighborhoods />} />
          <Route path="/neighborhoods/:neighborhoodId" element={<NeighborhoodDetail />} />
        </Routes>
      </Router>
      <ToastContainer />
    </AuthProvider>
  );
}

export default App;
