import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import EditableTextField from "./EditableTextField";

const TitleEditing = ({ firestore, section }) => {
  const [description, setDescription] = useState(""); // Initialize with empty string

  useEffect(() => {
    fetchDescription();
  }, []);

  const fetchDescription = async () => {
    try {
      const descriptionDocRef = doc(firestore, "descriptions", section);
      const descriptionDocSnap = await getDoc(descriptionDocRef);
      if (descriptionDocSnap.exists()) {
        setDescription(descriptionDocSnap.data().text || ""); // Use empty string if text doesn't exist
      } else {
        console.error("Description document not found");
      }
    } catch (error) {
      console.error("Error fetching description:", error);
    }
  };

  const handleDescriptionSave = async (newValue) => {
    try {
      const descriptionRef = doc(firestore, "descriptions", section);
      await setDoc(descriptionRef, { text: newValue });
      setDescription(newValue);
      alert("Kuvaus tallennettu onnistuneesti!");
    } catch (error) {
      console.error("Error saving description:", error);
      alert("Kuvausta tallennettaessa tapahtui virhe.");
    }
  };

  // Function to fetch initial value from Firestore
  const fetchInitialValue = async () => {
    try {
      const descriptionDocRef = doc(firestore, "descriptions", section);
      const descriptionDocSnap = await getDoc(descriptionDocRef);
      if (descriptionDocSnap.exists()) {
        return descriptionDocSnap.data().text || ""; // Use empty string if text doesn't exist
      } else {
        console.error("Description document not found");
        return ""; // Return empty string if document doesn't exist
      }
    } catch (error) {
      console.error("Error fetching initial value:", error);
      return ""; // Return empty string on error
    }
  };

  return (
    <>
      <h2>{section}</h2>
      <EditableTextField
        initialValue={description}
        onSave={handleDescriptionSave}
        fetchInitialValue={fetchInitialValue} // Pass the fetchInitialValue function
        descriptionKey={`${section}_description`}
      />
    </>
  );
};

export default TitleEditing;
