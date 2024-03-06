import React, { useState } from "react";
import Eurobotti from "./Eurobotti.js";
import "../App.css";

const ChatButton = () => {
  // State to track whether the button is clicked or not
  const [clicked, setClicked] = useState(false);

  // Function to handle reaction button click
  const handleReactionClick = () => {
    // Toggle the clicked state
    setClicked(!clicked);
  };

  return (
    <div className={`chat-container ${clicked ? "clicked" : ""}`}>
      <button className="reaction-button" onClick={handleReactionClick}>
        {clicked ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 2H3a2 2 0 00-2 2v13l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" />
          </svg>
        )}
      </button>
      {clicked && (
        <div className="wrapper1">
          <Eurobotti></Eurobotti>
        </div>
      )}
    </div>
  );
};

export default ChatButton;