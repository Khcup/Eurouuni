import React, { useState, useEffect } from "react";
import firebase from "firebase/compat/app";

const Muutpalvelut = () => {
  const [muutpalvelut, setMuutpalvelut] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await firebase
          .firestore()
          .collection("descriptions")
          .doc("muutpalvelut")
          .get();
        if (response.exists) {
          setMuutpalvelut(response.data().text);
        } else {
          console.log("Document does not exist");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      }
      return muutpalvelut;
    };

    fetchData();
  }, []);

  return (
    <div>
      {muutpalvelut && muutpalvelut.split('\n').map((line, index) => (
        <div key={index}>{line}</div>
      ))}
    </div>
  );
};

export default Muutpalvelut;
