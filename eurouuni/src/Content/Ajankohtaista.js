import React, { useEffect, useState } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Ajankohtaista = () => {
  const [content1, setContent1] = useState("");
  const [content2, setContent2] = useState("");
  const [content3, setContent3] = useState("");
  const [content4, setContent4] = useState("");
  const [content5, setContent5] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const doc1 = await getDoc(doc(db, "ajankohtaista", "ajankohtaista1"));
        const doc2 = await getDoc(doc(db, "ajankohtaista", "ajankohtaista2"));
        const doc3 = await getDoc(doc(db, "ajankohtaista", "ajankohtaista3"));
        const doc4 = await getDoc(doc(db, "ajankohtaista", "ajankohtaista4"));
        const doc5 = await getDoc(doc(db, "ajankohtaista", "ajankohtaista5"));

        if (doc1.exists()) {
          setContent1(doc1.data().text || "");
        }

        if (doc2.exists()) {
          setContent2(doc2.data().text || "");
        }

        if (doc3.exists()) {
          setContent3(doc3.data().text || "");
        }

        if (doc4.exists()) {
          setContent4(doc4.data().text || "");
        }

        if (doc5.exists()) {
          setContent5(doc5.data().text || "");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <div className="card-body">
          <h4 className="card-title">Ajankohtaista</h4>
          <div className="content" style={{ whiteSpace: "pre-line" }}>
            <p>{content1}</p>
            <p>{content2}</p>
            <p>{content3}</p>
            <p>{content4}</p>
            <p>{content5}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ajankohtaista;
