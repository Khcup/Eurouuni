import React, { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebaseConfig';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const Footer = () => {
  const [footerContent, setFooterContent] = useState(null);
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchFooterContent = async () => {
      try {
        const contactDocRef = doc(db, 'footer', 'contact');
        const locationDocRef = doc(db, 'footer', 'location');
        const socialDocRef = doc(db, 'footer', 'social');

        const contactDocSnap = await getDoc(contactDocRef);
        const locationDocSnap = await getDoc(locationDocRef);
        const socialDocSnap = await getDoc(socialDocRef);

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
      } catch (error) {
        console.error('Error fetching footer content:', error);
      }
    };

    fetchFooterContent();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleEdit = () => {
    if (user) {
      setEditing(true);
    } else {
      // Redirect to login page or show a message indicating authentication is required
    }
  };

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'footer', 'contact'), footerContent.contact);
      await updateDoc(doc(db, 'footer', 'location'), footerContent.location);
      await updateDoc(doc(db, 'footer', 'social'), footerContent.social);
      setEditing(false);
    } catch (error) {
      console.error('Error updating footer content:', error);
    }
  };

  const handleChange = (e, category, field) => {
    setFooterContent((prevState) => ({
      ...prevState,
      [category]: {
        ...prevState[category],
        [field]: e.target.value,
      },
    }));
  };

  return (
    <div id="targetYhteistiedot" className="footer">
      {/* Render edit button */}
      {user && (
        <button className="edit-button" onClick={editing ? handleSave : handleEdit}>
          {editing ? 'Save' : 'Edit'}
        </button>
      )}

      {/* footer */}
      <div className="row">
        <div className="col">
          <h1>Yhteystiedot</h1>
          {footerContent && (
            <>
              {editing ? (
                <>
                  <input
                    className="edit-input"
                    type="text"
                    value={footerContent.contact.phone}
                    onChange={(e) => handleChange(e, 'contact', 'phone')}
                  />
                  <input
                    className="edit-input"
                    type="text"
                    value={footerContent.contact.email}
                    onChange={(e) => handleChange(e, 'contact', 'email')}
                  />
                </>
              ) : (
                <>
                  <p>{footerContent.contact.phone}</p>
                  <p>{footerContent.contact.email}</p>
                </>
              )}
            </>
          )}
        </div>
        <div className="col">
          <h1>Sijainti</h1>
          {footerContent && (
            <>
              {editing ? (
                <>
                  <input
                    className="edit-input"
                    type="text"
                    value={footerContent.location.address}
                    onChange={(e) => handleChange(e, 'location', 'address')}
                  />
                  <input
                    className="edit-input"
                    type="text"
                    value={footerContent.location.city}
                    onChange={(e) => handleChange(e, 'location', 'city')}
                  />
                </>
              ) : (
                <>
                  <p>{footerContent.location.address}</p>
                  <p>{footerContent.location.city}</p>
                </>
              )}
            </>
          )}
        </div>
        <div className="col">
          <h1>Seuraa meitä myös Instagramissa!</h1>
          {footerContent && (
            <>
              {editing ? (
                <>
                  <input
                    className="edit-input"
                    type="text"
                    value={footerContent.social.instagram}
                    onChange={(e) => handleChange(e, 'social', 'instagram')}
                  />
                  <input
                    className="edit-input"
                    type="text"
                    value={footerContent.social.instagramImage}
                    onChange={(e) =>
                      handleChange(e, 'social', 'instagramImage')
                    }
                  />
                </>
              ) : (
                <a
                  rel="noreferrer"
                  target="_blank"
                  href={footerContent.social.instagram}
                >
                  <img
                    alt="Instagram"
                    src={footerContent.social.instagramImage}
                    style={{
                      maxHeight: '10%',
                      minWidth: '10%',
                      opacity: '0.65',
                    }}
                  />
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Footer;
