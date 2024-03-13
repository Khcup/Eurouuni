import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import firebaseConfig from '../firebaseConfig';

const AdminPage = () => {
  const navigate = useNavigate(); // Initialize useNavigate hook

  useEffect(() => {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  }, []);

  // Function to handle logout
  const handleLogout = async () => {
    try {
      await firebase.auth().signOut();
      alert("Logout successful!");
      navigate('/'); // Use navigate function to redirect to home page
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
