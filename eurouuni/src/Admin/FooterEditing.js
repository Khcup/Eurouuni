import React, { useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/firestore';
import firebaseConfig from '../firebaseConfig'; // Import the Firebase configuration

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

const FooterEditing = ({ footerContent, handleChange }) => {
  const [saveStatus, setSaveStatus] = useState(null);

  const handleSave = async () => {
    try {
      // Saving contact data
      await db.collection('footer').doc('contact').set({
        phone: footerContent.contact.phone,
        email: footerContent.contact.email,
      });
  
      // Saving social data
      await db.collection('footer').doc('social').set({
        instagram: footerContent.social.instagram,
      });
  
      // Saving location data
      await db.collection('footer').doc('location').set({
        address: footerContent.location.address,
        city: footerContent.location.city,
      });
  
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000); // Hide the message after 3 seconds
    } catch (error) {
      console.error('Error saving data:', error);
      setSaveStatus('error');
    }
  };

  const handleSaveClick = async () => {
    try {
      await handleSave(); // Call handleSave function
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  return (
    <div>
      <h2>Alatunniste Muokkaus</h2>
      {saveStatus === 'success' && (
        <p style={{ color: 'green' }}>Data saved successfully!</p>
      )}
      {saveStatus === 'error' && (
        <p style={{ color: 'red' }}>Error saving data!</p>
      )}
      <div className="row">
        <div className="col">
          <h3>Yhteystiedot</h3>
          <input
            type="text"
            value={footerContent.contact.phone}
            onChange={(e) => handleChange(e, 'contact', 'phone')}
          />
          <input
            type="text"
            value={footerContent.contact.email}
            onChange={(e) => handleChange(e, 'contact', 'email')}
          />
        </div>
        <div className="col">
          <h3>Sijainti</h3>
          <input
            type="text"
            value={footerContent.location.address}
            onChange={(e) => handleChange(e, 'location', 'address')}
          />
          <input
            type="text"
            value={footerContent.location.city}
            onChange={(e) => handleChange(e, 'location', 'city')}
          />
        </div>
        <div className="col">
          <h3>Seuraa meitä myös Instagramissa!</h3>
          <input
            type="text"
            value={footerContent.social.instagram}
            onChange={(e) => handleChange(e, 'social', 'instagram')}
          />
          <input
            type="text"
            value={footerContent.social.instagramImage}
            onChange={(e) => handleChange(e, 'social', 'instagramImage')}
          />
        </div>
      </div>
      <button onClick={handleSaveClick}>Save</button>
    </div>
  );
};

export default FooterEditing;