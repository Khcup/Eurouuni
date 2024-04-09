import React, { useState, useEffect } from "react";
import "../App.css";
import firebase from "firebase/compat/app";
import "firebase/firestore"; // Import Firestore
import firebaseConfig from "../firebaseConfig";
import emailjs from '@emailjs/browser';

const Eurobotti = () => {
  const [openForm, setOpenForm] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState([]);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [form, setForm] = useState({}); // Form state

  // Initialize Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  useEffect(() => {
    emailjs.init("5NZhvTA8dQOjHGAY6");
  }, []);

  const firestore = firebase.firestore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const invalidFieldsList = [];
    if (!name) {
      invalidFieldsList.push("name");
    }
    if (!phone) {
      invalidFieldsList.push("phone");
    }
    if (!email || !isEmailValid) {
      invalidFieldsList.push("email");
    }
    if (!message) {
      invalidFieldsList.push("message");
    }
    setInvalidFields(invalidFieldsList);

    if (invalidFieldsList.length > 0) {
      return;
    }

    // Send email using EmailJS
    const templateParams = {
      name: name,
      phone: phone,
      email: email,
      message: message
    };

    emailjs.send(
      "service_0r4j1ef", // Your EmailJS service ID
      "template_a7sxmtj", // Your EmailJS template ID
      templateParams,
      "5NZhvTA8dQOjHGAY6" // Your EmailJS user ID
    )
      .then((result) => {
        alert('Message sent successfully!');
        console.log(result.text);
      })
      .catch((error) => {
        console.error('Email sending failed:', error);
        alert('Email sending failed. Please try again later.');
      });

    // Store form data in Firestore
    try {
      await firestore.collection("yhteydenottolomake").add({
        name: name,
        phone: phone,
        email: email,
        message: message,
      });
      console.log("Form data submitted successfully!");
    } catch (error) {
      console.error("Error submitting form data: ", error);
    }

    // Reset form fields after submission
    setName("");
    setPhone("");
    setEmail("");
    setMessage("");
    setOpenForm(null);
  };

  const toggleForm = (formName) => {
    setOpenForm(openForm === formName ? null : formName);
  };

  const isButtonDisabled = () => {
    return !name || !email || invalidFields.length > 0 || !isEmailValid;
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    setIsEmailValid(validateEmail(value));
  };

  return (
    <div className="wrapper1">
      <div className="botheader">
        <h2>Suomen Eurouuni</h2>
      </div>
      <div className="chat">
        <div className="chat-form">
          <div className="message bot-message">
            <span>👋Haluasitko saada lisää tietoa tuotteistamme tai palveluistamme?</span>
          </div>
        </div>
        <div className="chat-form">
          <div className="message bot-message">
            <span>Valitse ensin aihe alla olevista ja täytä sen jälkeen tarvittavat tietosi, niin olemme sinuun yhteydessä</span>
          </div>
        </div>
        <div className="chat-form" style={{ paddingBottom: "0" }}>
          <div className="app-formbtn">
            <button
              type="button"
              className={`chatbutton${
                openForm === "Remontit" ? " active" : ""
                }`}
              onClick={() => toggleForm("Remontit")}
            >
              Remontit
            </button>
            <br />
            <button
              type="button"
              className={`chatbutton${
                openForm === "Tulisija/tulisijakorjaus" ? " active" : ""
                }`}
              onClick={() => toggleForm("Tulisija/korjaus")}
            >
              Tulisija/tulisijakorjaus
            </button>
            <br />
            <button
              type="button"
              className={`chatbutton${
                openForm === "Muu tiedustelu" ? " active" : ""
                }`}
              onClick={() => toggleForm("Muu tiedustelu")}
            >
              Muu tiedustelu
            </button>
            {openForm && (
              <div className="form">
                <h2 style={{ textAlign: "center" }}>{openForm}</h2>
                <p style={{ textAlign: "center" }}>Yhteydenottolomake</p>
                <form noValidate onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Nimi</label>
                    <input
                      type="text"
                      id="name"
                      className={`form-control${
                        invalidFields.includes("name") ? " invalid" : ""
                        }`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                  <label htmlFor="phone">Puhelinnumero</label>
                  <input
                    type="tel"
                    id="phone"
                    className={`form-control${invalidFields.includes("phone") ? " invalid" : ""}`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                  <div className="form-group">
                    <label htmlFor="email">Sähköposti</label>
                    <input
                      type="email"
                      id="email"
                      className={`form-control${
                        invalidFields.includes("email") ? " invalid" : ""
                        }`}
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      required
                    />
                    {!isEmailValid && (
                      <p className="error-message">Viallinen Sähköposti</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="textarea">Tietoja</label>
                    <textarea
                      id="textarea"
                      rows="3"
                      className={`form-control${
                        invalidFields.includes("message") ? " invalid" : ""
                        }`}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                  <br />
                  <button
                    type="submit"
                    className={`submit-button${
                      isButtonDisabled() ? " disabled" : ""
                      }`}
                    disabled={isButtonDisabled()}
                  >
                    Lähetä Viesti
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="chatfooter"></div>
    </div>
  );
};

export default Eurobotti;
