import React, { useState } from "react";
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
  const [error, setError] = useState(null);

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
      setLoggedIn(true); // Set loggedIn state to true
    } catch (error) {
      setError("Invalid username or password");
      console.error("Error signing in:", error);
    }
  };

  // Function to handle input changes and update state accordingly
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "username") setUsername(value);
    if (name === "password") setPassword(value);
    checkFormFilled();
  };

  // Function to check if form fields are filled
  const checkFormFilled = () => {
    setIsFormFilled(username.trim() !== "" && password.trim() !== "");
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
          onChange={handleInputChange}
          placeholder="Email"
          className="login-input"
        />
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
