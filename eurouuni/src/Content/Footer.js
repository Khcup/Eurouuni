import React, { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore'; // Import Firestore functions directly
import { initializeApp } from 'firebase/app';
import firebaseConfig from '../firebaseConfig'; // Import your Firebase config

// Initialize Firebase outside the component
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Footer = () => {
  const [footerContent, setFooterContent] = useState(null);

  useEffect(() => {
    const fetchFooterContent = async () => {
      try {
        const contactDocRef = doc(db, 'footer', 'contact');
        const locationDocRef = doc(db, 'footer', 'location');
        const socialDocRef = doc(db, 'footer', 'social');
        
        const contactDocSnap = await getDoc(contactDocRef);
        const locationDocSnap = await getDoc(locationDocRef);
        const socialDocSnap = await getDoc(socialDocRef);
        
        if (contactDocSnap.exists() && locationDocSnap.exists() && socialDocSnap.exists()) {
          const contactData = contactDocSnap.data();
          const locationData = locationDocSnap.data();
          const socialData = socialDocSnap.data();
          setFooterContent({ contact: contactData, location: locationData, social: socialData });
        } else {
          console.error('One or more footer documents not found');
        }
      } catch (error) {
        console.error('Error fetching footer content:', error);
      }
    };

    fetchFooterContent();
  }, []);

  return (
    <div id="targetYhteistiedot" className="footer">
      {/* footer */}
      <div className="row">
        <div className="col">
          <h1>Yhteystiedot</h1>
          {footerContent && (
            <>
              <p>{footerContent.contact.phone}</p>
              <p>{footerContent.contact.email}</p>
            </>
          )}
        </div>
        <div className="col">
          <h1>Sijainti</h1>
          {footerContent && (
            <>
              <p>{footerContent.location.address}</p>
              <p>{footerContent.location.city}</p>
            </>
          )}
        </div>
        <div className="col">
          <h1>Seuraa meitä myös Instagramissa!</h1>
          {footerContent && (
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
        </div>
      </div>
    </div>
  );
};

export default Footer;