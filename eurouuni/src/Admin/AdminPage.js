import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import firebaseConfig from '../firebaseConfig';

const AdminPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    // Check authentication status when component mounts
    const unsubscribe = firebase.auth().onAuthStateChanged(user => {
      if (!user) {
        // User is not logged in, redirect to login page
        navigate('/auth');
      }
    });

    // Clean up the subscription when component unmounts
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await firebase.auth().signOut();
      alert("Logout successful!");
      navigate('/'); // Redirect to home page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div>
      <h1>Admin Page</h1>
      {/* Add admin features here */}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default AdminPage;
