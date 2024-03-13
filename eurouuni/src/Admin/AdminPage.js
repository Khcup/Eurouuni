import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import firebaseConfig from '../firebaseConfig';

const AdminPage = () => {
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
      return <Navigate to="/" />;
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
