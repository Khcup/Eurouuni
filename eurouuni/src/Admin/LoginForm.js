import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "../App.css";
import firebaseConfig from "../firebaseConfig";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isFormFilled, setIsFormFilled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    // Check authentication state
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        setLoggedIn(true); // Set loggedIn state to true if user is authenticated
      } else {
        setLoggedIn(false); // Set loggedIn state to false if user is not authenticated
      }
    });

    // Clean up listener
    return () => unsubscribe();
  }, []); // Only run this effect once, when the component mounts

  // Regular expression for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (emailError) {
      return;
    }

    try {
      // Sign in user with email and password
      await firebase.auth().signInWithEmailAndPassword(username, password);
      alert("Login successful!");
    } catch (error) {
      setError("Invalid email or password");
      console.error("Error signing in:", error);
    }
  };

  // Function to handle input changes and update state accordingly
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "username") {
      setUsername(value);
      checkEmailValidity(value);
    }
    if (name === "password") setPassword(value);
    checkFormFilled();
  };

  // Function to check if form fields are filled
  const checkFormFilled = () => {
    setIsFormFilled(username.trim() !== "" && password.trim() !== "");
  };

  // Function to check the validity of the email address
  const checkEmailValidity = (email) => {
    if (!emailRegex.test(email)) {
      setEmailError("Invalid email address");
    } else {
      setEmailError(null);
    }
  };

  // Redirect to admin page if logged in
  if (loggedIn) {
    return <Navigate to="/admin" />;
  }

  // Render login form if not logged in
  return (
    <div className="login-container">
      <h2 className="login-title">Admin Login</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          value={username}
          onChange={handleInputChange}
          placeholder="Email"
          className={`login-input ${emailError ? "error-input" : ""}`}
        />
        {emailError && <p className="error-message">{emailError}</p>}
        <input
          type="password"
          name="password"
          value={password}
          onChange={handleInputChange}
          placeholder="Password"
          className="login-input"
        />
        <button type="submit" className="login-button" disabled={!isFormFilled}>
          Login
        </button>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default LoginForm;
