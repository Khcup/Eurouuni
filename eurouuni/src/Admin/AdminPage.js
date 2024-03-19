import React, { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebaseConfig';
import firebase from 'firebase/compat/app';
import FooterEditing from './FooterEditing';
import AjankohtaistaEditing from './AjankohtaistaEditing'; 
import GalleryEditing from './GalleryEditing'; // Import the GalleryEditing component
import { useNavigate } from 'react-router-dom';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const AdminPage = () => {
  const [footerContent, setFooterContent] = useState(null);
  const [ajankohtaistaContent, setAjankohtaistaContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const contactDocRef = doc(db, 'footer', 'contact');
        const locationDocRef = doc(db, 'footer', 'location');
        const socialDocRef = doc(db, 'footer', 'social');
        const ajankohtaistaDocRef = doc(db, 'ajankohtaista', 'ajankohtaista1');

        const contactDocSnap = await getDoc(contactDocRef);
        const locationDocSnap = await getDoc(locationDocRef);
        const socialDocSnap = await getDoc(socialDocRef);
        const ajankohtaistaDocSnap = await getDoc(ajankohtaistaDocRef);

        if (
          contactDocSnap.exists() &&
          locationDocSnap.exists() &&
          socialDocSnap.exists()
        ) {
          const contactData = contactDocSnap.data();
          const locationData = locationDocSnap.data();
          const socialData = socialDocSnap.data();
          setFooterContent({
            contact: contactData,
            location: locationData,
            social: socialData,
          });
        } else {
          console.error('One or more footer documents not found');
        }

        if (ajankohtaistaDocSnap.exists()) {
          setAjankohtaistaContent(ajankohtaistaDocSnap.data().text || '');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleToggleEditing = () => {
    if (user) {
      setIsEditing((prevEditing) => !prevEditing);
      setEditMode(null);
    } else {
      // Redirect to login page or show a message indicating authentication is required
    }
  };

  const handleSave = async () => {
    try {
      if (editMode === 'footer') {
        await Promise.all([
          updateDoc(doc(db, 'footer', 'contact'), footerContent.contact),
          updateDoc(doc(db, 'footer', 'location'), footerContent.location),
          updateDoc(doc(db, 'footer', 'social'), footerContent.social),
        ]);
      } else if (editMode === 'ajankohtaista') {
        await updateDoc(doc(db, 'ajankohtaista', 'ajankohtaista1'), {
          text: ajankohtaistaContent,
        });
      }
      setIsEditing(false);
      window.location.reload(); // Refresh the page
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleChange = (e, category, field) => {
    const { value } = e.target;
    if (category === 'ajankohtaista') {
      setAjankohtaistaContent(value); // Update ajankohtaistaContent directly
    } else {
      // Update footerContent for other categories
      setFooterContent((prevContent) => ({
        ...prevContent,
        [category]: {
          ...prevContent[category],
          [field]: value,
        },
      }));
    }
  };  

  const handleLogout = async () => {
    try {
      await firebase.auth().signOut();
      alert('Logout successful!');
      navigate('/'); // Redirect to homepage
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleElementEdit = (element) => {
    if (user) {
      setEditMode(element);
      setIsEditing(true);
    } else {
      // Redirect to login page or show a message indicating authentication is required
    }
  };

  const handleBack = () => {
    setEditMode(null); // Set editMode to null when handling back button click
  };

  return (
    <div>
      {user && (
        <button className="toggle-admin-panel" onClick={handleToggleEditing}>
          Toggle Admin Panel
        </button>
      )}
      {isEditing && user && (
        <div className="admin-panel">
          <h1>Admin Panel</h1>
          {editMode ? ( // Check if editMode is set
            <button onClick={handleBack}>Back</button>
          ) : (
            <div className="element-buttons">
              <button onClick={() => handleElementEdit('footer')}>
                Muokkaa Footer
              </button>
              <button onClick={() => handleElementEdit('ajankohtaista')}>
                Muokkaa Ajankohtaista
              </button>
              <button onClick={() => handleElementEdit('tulisija')}>
                Muokkaa Tulisija
              </button>
            </div>
          )}
          {/* Your editing components for footer, ajankohtaista, and tulisija */}
          {editMode === 'footer' && (
            <FooterEditing
              footerContent={footerContent}
              handleChange={handleChange}
            />
          )}
          {editMode === 'ajankohtaista' && (
            <AjankohtaistaEditing
              content={ajankohtaistaContent}
              handleChange={handleChange}
            />
          )}
          {editMode === 'tulisija' && (
            <>
              <GalleryEditing isAdminMode={true} />
              <button onClick={handleSave}>Save</button>
            </>
          )}
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
