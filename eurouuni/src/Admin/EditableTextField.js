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

  return (
    <div>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleSave}
        />
      ) : (
        <button onClick={() => setIsEditing(true)}>{value}</button>
      )}
    </div>
  );
};

export default EditableTextField;