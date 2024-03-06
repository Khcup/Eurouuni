import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import "../App.css";

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isFormFilled, setIsFormFilled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const firebaseConfig = {
    apiKey: "AIzaSyD-f1yUyy447cwj7qxCikUna512nAIzquc",
    authDomain: "eurouuni-592c6.firebaseapp.com",
    projectId: "eurouuni-592c6",
    storageBucket: "eurouuni-592c6.appspot.com",
    messagingSenderId: "841016645103",
    appId: "1:841016645103:web:1e5b392c565b3f3ecb121a",
    measurementId: "G-3LHL4MZ938"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Sign in user with email and password
      await firebase.auth().signInWithEmailAndPassword(username, password);
      alert("Login successful!");
      onLogin(); // Notify parent component about successful login
      setLoggedIn(true); // Set loggedIn state to true
    } catch (error) {
      alert("Invalid username or password");
      console.error(error.message);
    }
  };

  // Function to handle input changes and update state accordingly
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "username") setUsername(value);
    if (name === "password") setPassword(value);
  };

  // Function to check if form fields are filled
  const checkFormFilled = () => {
    if (username.trim() !== "" && password.trim() !== "") {
      setIsFormFilled(true);
    } else {
      setIsFormFilled(false);
    }
  };

  // Redirect to admin page if logged in
  if (loggedIn) {
    return <Navigate to="/admin" />;
  }

  return (
    <div className="login-container">
      <h2 className="login-title">Login</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          value={username}
          onChange={(e) => {
            handleInputChange(e);
            checkFormFilled();
          }}
          placeholder="Username"
          className="login-input"
        />
        <input
          type="password"
          name="password"
          value={password}
          onChange={(e) => {
            handleInputChange(e);
            checkFormFilled();
          }}
          placeholder="Password"
          className="login-input"
        />
        <button type="submit" className="login-button" disabled={!isFormFilled}>
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
