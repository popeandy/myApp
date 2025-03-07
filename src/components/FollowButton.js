import React, { useState, useEffect } from 'react';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Button } from '@mui/material';

function FollowButton({ targetUserId }) {
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const checkIfFollowing = async () => {
      const followDoc = await getDoc(doc(db, 'friends', `${auth.currentUser.uid}_${targetUserId}`));
      setIsFollowing(followDoc.exists());
    };

    checkIfFollowing();
  }, [targetUserId]);

  const handleFollow = async () => {
    const followDocRef = doc(db, 'friends', `${auth.currentUser.uid}_${targetUserId}`);
    await setDoc(followDocRef, {
      follower: auth.currentUser.uid,
      followee: targetUserId,
      timestamp: new Date(),
    });
    setIsFollowing(true);
  };

  const handleUnfollow = async () => {
    const followDocRef = doc(db, 'friends', `${auth.currentUser.uid}_${targetUserId}`);
    await deleteDoc(followDocRef);
    setIsFollowing(false);
  };

  return (
    <Button variant="contained" onClick={isFollowing ? handleUnfollow : handleFollow}>
      {isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
}

export default FollowButton;