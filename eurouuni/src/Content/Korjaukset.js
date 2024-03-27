import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app'; // Assuming you have Firebase initialized properly

const Korjaukset = () => {
  const [muutpalvelut, setMuutpalvelut] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await firebase.firestore().collection('descriptions').doc('korjaukset').get();
        if (response.exists) {
          setMuutpalvelut(response.data().text);
        } else {
          console.log('Document does not exist');
        }
      } catch (error) {
        console.error('Error fetching document:', error);
      }
      // Unreachable code here
      return muutpalvelut; // This line is unreachable
    };

    fetchData();
  }, []);

  // Render a loading state while data is being fetched
  if (muutpalvelut === null) {
    return <div>Loading...</div>;
  }

  // Render the fetched data
  return <div>{muutpalvelut}</div>;
};

export default Korjaukset;