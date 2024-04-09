import React, { useEffect, useState } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const Footer = () => {
  const [footerContent, setFooterContent] = useState(null);
  const [footerTitles, setFooterTitles] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchFooterContent = async () => {
      try {
        const contactDocRef = doc(db, "footer", "contact");
        const locationDocRef = doc(db, "footer", "location");
        const socialDocRef = doc(db, "footer", "social");

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

          const contactTitle = contactData.title;
          const locationTitle = locationData.title;
          const socialTitle = socialData.title;
          setFooterTitles({
            contact: contactTitle,
            location: locationTitle,
            social: socialTitle,
          });
        } else {
          console.error("One or more footer documents not found");
        }
      } catch (error) {
        console.error("Error fetching footer content:", error);
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

  return (
    <div id="targetYhteistiedot" className="footer">
      {/* footer */}
      <div className="row">
        <div className="col">
          <h1>{footerTitles?.contact}</h1>
          {footerContent && (
            <>
              <p>{footerContent.contact.phone}</p>
              <p>{footerContent.contact.email}</p>
            </>
          )}
        </div>
        <div className="col">
          <h1>{footerTitles?.location}</h1>
          {footerContent && (
            <>
              <p>{footerContent.location.address}</p>
              <p>{footerContent.location.city}</p>
            </>
          )}
        </div>
        <div className="col">
          <h1>{footerTitles?.social}</h1>
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
                  maxHeight: "10%",
                  minWidth: "10%",
                  opacity: "0.65",
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
