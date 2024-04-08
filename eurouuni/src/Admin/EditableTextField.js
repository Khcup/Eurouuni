import React, { useState, useRef, useEffect } from "react";

const EditableTextField = ({ initialValue, onSave, descriptionKey }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(() => {
    // Initialize the state with the initialValue prop
    const storedValue = localStorage.getItem(descriptionKey);
    return storedValue !== null ? storedValue : initialValue;
  });
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Save the value to local storage when it changes
  useEffect(() => {
    localStorage.setItem(descriptionKey, value);
  }, [value, descriptionKey]);

  const handleSave = () => {
    onSave(value);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    setValue(e.target.value);
  };

  // Render the text with line breaks
  const renderText = () => {
    return value.split("\n").map((line, index) => <div key={index}>{line}</div>);
  };

  return (
    <div>
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onBlur={handleSave}
          style={{
            width: "100%", // Full width
            height: "10rem", // Default height for PC
            "@media (max-width: 768px)": {
              height: "5rem" // Adjust height for smaller screens
            }
          }}
        />
      ) : (
        <button onClick={() => setIsEditing(true)}>{renderText()}</button>
      )}
    </div>
  );
};

export default EditableTextField;
