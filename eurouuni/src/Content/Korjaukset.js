import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';

const Korjaukset = () => {
  const [korjaukset, setKorjaukset] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await firebase.firestore().collection('descriptions').doc('korjaukset').get();
        if (response.exists) {
          setKorjaukset(response.data().text);
        } else {
          console.log('Document does not exist');
        }
      } catch (error) {
        console.error('Error fetching document:', error);
      }
      return korjaukset;
    };

    fetchData();
  }, []);

  return (
    <div>
      {korjaukset && korjaukset.split('\n').map((line, index) => (
        <div key={index}>{line}</div>
      ))}
    </div>
  );
};

export default Korjaukset;
