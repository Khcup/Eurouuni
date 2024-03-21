import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/firestore';
import firebaseConfig from '../firebaseConfig';
import '../App.css';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

const FooterEditing = ({ footerContent, handleChange }) => {
  const [footerTitles, setFooterTitles] = useState({});
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    const fetchFooterTitles = async () => {
      try {
        const contactDoc = await db.collection('footer').doc('contact').get();
        const locationDoc = await db.collection('footer').doc('location').get();
        const socialDoc = await db.collection('footer').doc('social').get();

        const contactData = contactDoc.data();
        const locationData = locationDoc.data();
        const socialData = socialDoc.data();

        if (contactData && locationData && socialData) {
          setFooterTitles({
            contact: contactData.title || 'Contact',
            location: locationData.title || 'Location',
            social: socialData.title || 'Social',
          });
        }
      } catch (error) {
        console.error('Error fetching footer titles:', error);
      }
    };

    fetchFooterTitles();
  }, []);

  const handleTitleChange = async (e, section) => {
    const updatedTitle = e.target.textContent;
    setFooterTitles(prevState => ({
      ...prevState,
      [section]: updatedTitle
    }));
  
    try {
      const docRef = db.collection('footer').doc(section);
      const docSnap = await docRef.get();
      
      if (!docSnap.exists) {
        // Create the document with the title field
        await docRef.set({ title: updatedTitle });
      } else {
        // Update the title field
        await docRef.update({ title: updatedTitle });
      }
      
      setSaveStatus('success');
    } catch (error) {
      console.error('Error updating title:', error);
      setSaveStatus('error');
    }
  };

  const handleSave = async () => {
    try {
      // Saving contact data
      await db.collection('footer').doc('contact').set({
        title: footerTitles.contact,
        phone: footerContent.contact.phone,
        email: footerContent.contact.email,
      });
  
      // Saving social data
      await db.collection('footer').doc('social').set({
        title: footerTitles.social,
        instagram: footerContent.social.instagram,
        instagramImage: footerContent.social.instagramImage,
      });
  
      // Saving location data
      await db.collection('footer').doc('location').set({
        title: footerTitles.location,
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
  <>
    <div className="footer-editing-container">
      <h2>Alatunnisteen muokkaus,</h2>
      <p>Pystyt muokata otsikkoja klikkaamalla.</p>
      {saveStatus === 'success' && (
        <p className="success-message">Tietojen tallennus onnistui!</p>
      )}
      {saveStatus === 'error' && (
        <p className="error-message">Virhe tietojen tallentamisessa!</p>
      )}
      <div className="row">
        <div className="footer-section">
          <h3 
            contentEditable="true"
            onBlur={(e) => handleTitleChange(e, 'contact')}
            suppressContentEditableWarning={true}
            dangerouslySetInnerHTML={{ __html: footerTitles.contact }}
          />
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
        <div className="footer-section">
          <h3 
            contentEditable="true"
            onBlur={(e) => handleTitleChange(e, 'location')}
            suppressContentEditableWarning={true}
            dangerouslySetInnerHTML={{ __html: footerTitles.location }}
          />
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
        <div className="footer-section">
          <h3 
            contentEditable="true"
            onBlur={(e) => handleTitleChange(e, 'social')}
            suppressContentEditableWarning={true}
            dangerouslySetInnerHTML={{ __html: footerTitles.social }}
          />
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

      </div>
        <div className="save-button-container">
          <button className="save-button" onClick={handleSave}>
            Tallenna
          </button>
      </div>
    </>
  );
};

export default FooterEditing;
