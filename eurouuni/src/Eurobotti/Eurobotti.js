import React, { useState } from "react";
import "../App.css";

const Eurobotti = () => {
  const [openForm, setOpenForm] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState([]);
  const [isEmailValid, setIsEmailValid] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    const invalidFieldsList = [];
    if (!name) {
      invalidFieldsList.push("name");
    }
    if (!email || !isEmailValid) {
      invalidFieldsList.push("email");
    }
    if (!message) {
      invalidFieldsList.push("message");
    }
    setInvalidFields(invalidFieldsList);

    // If any required fields are not filled, return without submitting the form
    if (invalidFieldsList.length > 0) {
      return;
    }

    // Logic to handle form submission, not done yet
    console.log("Form submitted:", { name, email, message });

    // Reset form fields after submission
    setName("");
    setEmail("");
    setMessage("");
    setOpenForm(null); // Close the form after submission
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
            <b>Yhteydenottobotti🤖</b>
            <br />
            <span>👋Hei olen Suomen Eurouuni yhteydenottobottis</span>
          </div>
        </div>
        <div className="chat-form">
          <div className="message bot-message">
            <b>Yhteydenottobotti🤖</b>
            <br />
            <span>Valitse aihe jonka kanssa tarvitset apua alta</span>
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
              onClick={() => toggleForm("Tulisija/tulisijakorjaus")}
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