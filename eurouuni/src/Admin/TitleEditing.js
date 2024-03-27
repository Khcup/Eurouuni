import React, { useState, useEffect } from "react";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import EditableTextField from "./EditableTextField";

const TitleEditing = ({ firestore, section }) => {
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchDescription();
  }, []);

  const fetchDescription = async () => {
    try {
      const descriptionRef = collection(firestore, "descriptions", section, "remontit");
      const querySnapshot = await getDocs(descriptionRef);
  
      let descriptionText = "";
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.text) {
          descriptionText += data.text + "\n";
        }
      });
  
      setDescription(descriptionText.trim()); // Trimming to remove extra newline at the end
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
      console.error("Virhe kuvauksen tallentamisessa:", error);
      alert("Kuvausta tallennettaessa tapahtui virhe.");
    }
  };

  return (
    <>
      <h2>{section}</h2>
      <EditableTextField
        initialValue={description}
        onSave={handleDescriptionSave}
        descriptionKey={`${section}_description`}
      />
    </>
  );
};

export default TitleEditing;