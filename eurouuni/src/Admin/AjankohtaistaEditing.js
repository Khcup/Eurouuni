import React, { useEffect, useState } from "react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const AjankohtaistaEditing = () => {
  const [content, setContent] = useState([]);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ajankohtaistaDocs = await Promise.all([
          getDoc(doc(db, "ajankohtaista", "ajankohtaista1")),
          getDoc(doc(db, "ajankohtaista", "ajankohtaista2")),
          getDoc(doc(db, "ajankohtaista", "ajankohtaista3")),
          getDoc(doc(db, "ajankohtaista", "ajankohtaista4")),
          getDoc(doc(db, "ajankohtaista", "ajankohtaista5")),
        ]);

        const updatedContent = ajankohtaistaDocs.map((doc) => ({
          id: doc.id,
          text: doc.exists() ? doc.data().text || "" : "",
        }));

        setContent(updatedContent);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e, id) => {
    const { value } = e.target;
    setContent((prevContent) =>
      prevContent.map((item) =>
        item.id === id ? { ...item, text: value } : item,
      ),
    );
  };

  const handleSave = async () => {
    try {
      await Promise.all(
        content.map((item) =>
          updateDoc(doc(db, "ajankohtaista", item.id), { text: item.text }),
        ),
      );
      setSaveStatus("success");
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000); // Hide the message after 3 seconds (3000 milliseconds)
      console.log("Data saved successfully");
    } catch (error) {
      console.error("Error saving data:", error);
      setSaveStatus("error");
    }
  };

  return (
  <>
    <div className="ajankohtaista-editing">
      <h2>Ajankohtaista Muokkaus</h2>
      {saveStatus === "success" && (
        <p className="success-message">Tietojen tallennus onnistui!</p>
      )}
      {saveStatus === "error" && (
        <p className="error-message">Virhe tallennettaessa tietoja. Yritä uudelleen.</p>
      )}
      {content.map((item) => (
        <div className="content-item" key={item.id}>
          <label htmlFor={`content-${item.id}`}>Rivi {item.id}: </label>
          <textarea
            id={`content-${item.id}`}
            className="content-textarea"
            value={item.text}
            onChange={(e) => handleChange(e, item.id)}
            placeholder={`Lisää sisältö riville ${item.id}...`}
            rows={5}
          />
        </div>
      ))}
    </div>
        <div className="save-button-container">
          <button className="save-button" onClick={handleSave}>
            Tallenna
          </button>
      </div>
    </>
  );
};

export default AjankohtaistaEditing;
