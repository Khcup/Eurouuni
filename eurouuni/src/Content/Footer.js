import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../firebaseConfig'; // Import your Firebase config

const Footer = () => {
  const [footerContent, setFooterContent] = useState(null);

  useEffect(() => {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);

    // Create a reference to the Firestore database
    const db = getFirestore(app);

    // Fetch footer content from Firestore
    const fetchFooterContent = async () => {
      try {
        const footerDocRef = doc(db, 'footer', 'contact');
        const footerDocSnap = await getDoc(footerDocRef);
        if (footerDocSnap.exists()) {
          const contactData = footerDocSnap.data();
          setFooterContent(contactData);
        } else {
          console.error('Footer document not found');
        }
      } catch (error) {
        console.error('Error fetching footer content:', error);
      }
    };

    fetchFooterContent();

    // Cleanup function (not needed for Firebase initialization)
  }, []);

  return (
    <div id="targetYhteistiedot" className="footer">
      {/* footer */}
      <div className="row">
        <div className="col">
          <h1>Yhteystiedot</h1>
          {footerContent && (
            <>
              <p>{footerContent.phone}</p>
              <p>{footerContent.email}</p>
            </>
          )}
        </div>
        <div className="col">
          <h1>Sijainti</h1>
          {footerContent && (
            <>
              <p>{footerContent.address}</p>
              <p>{footerContent.location}</p>
            </>
          )}
        </div>
        <div className="col">
          <h1>Seuraa meitä myös Instagramissa!</h1>
          <a
            rel="noreferrer"
            target="_blank"
            href={footerContent && footerContent.instagramLink}
          >
            <img
              alt="Instagram"
              src="../images/ig.png"
              style={{
                maxHeight: '10%',
                minWidth: '10%',
                opacity: '0.65',
              }}
            />
            <p>{footerContent && footerContent.instagramHandle}</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Footer;