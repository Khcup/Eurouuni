import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import Navbar from "./Navbar";
import Remonttigallery from "./gallery/Remontit-gallery";
import AppGallery from "./gallery/App-gallery";
import LoginForm from "./Admin/LoginForm";
import "./App.css";
import ChatButton from "./Eurobotti/Chatbutton";
import AdminPage from './Admin/AdminPage';
import Footer from "./Content/Footer";
import Ajankohtaista from "./Content/Ajankohtaista";

const App = () => {

  const [tulisijat1, setTulisijat1] = useState(false);
  const [palvelut1, setPalvelut1] = useState(false);
  const [remontit1, setRemontit1] = useState(false);
  const [muutpalvelut1, setMuutpalvelut1] = useState(false);

  const toggleGallery = (setter) => () => {
    setter((prevState) => !prevState);
  };

  return (
    <Router>
      <main>
      <Navbar />
        <Routes>
        <Route path="/auth" element={<LoginForm />} />
          <Route path="/admin" element={<AdminPage />} />
          {/* Add other routes here */}
        </Routes>
        <header
          style={{
            backgroundImage: "url(./images/orange2.png)",
            backgroundPosition: "45% 45%",
            backgroundSize: "cover",
          }}
        >
          <image src="" alt="" className="logo" />
        </header>
        <Ajankohtaista />
        <div id="targetGalleria"></div>
        <div className="container">
          {/* Tulisijat */}
          <div
            id="galleria"
            className="row justify-content-center"
            style={{
              backgroundImage: "url(./images/galleria.jpg)",
              backgroundPosition: "center",
              backgroundSize: "cover",
              textShadow: "1px 1px 2px black",
            }}
          >
            <div className="col-md-auto">
              <h2>Tulisijat</h2>
              <p> Yksilölliset mittatilaustulisijat</p>
              <p>Varaavat tulisijat</p>
              <p>Pönttöuunit</p>
              <button
                className="btn btn-lg btn-dark"
                onClick={toggleGallery(setTulisijat1)}
              >
                Galleria
              </button>
            </div>
          </div>
          {tulisijat1 && <AppGallery />}
          {/* Korjaukset */}
          <div id="targetPalvelut"></div>
          <div
            id="palvelut"
            className="row justify-content-center"
            style={{
              backgroundImage: "url(./images/tulisijakorjaus.jpg)",
              backgroundPosition: "center",
              backgroundSize: "cover",
              textShadow: "1px 1px 2px black",
            }}
          >
            <div className="col-md-auto">
              <h2>Korjaukset</h2>
              <p>Tulisijakorjaukset</p>
              <p>Hormikorjaukset</p>
              <button
                className="btn btn-lg btn-dark"
                onClick={toggleGallery(setPalvelut1)}
              >
                Korjaukset
              </button>
            </div>
          </div>
          {palvelut1 && (
            <div>
              <p>
                Korjaamme vanhat tulisijat ja hormistot. Asennamme takkasydämet
                avotakkoihin. Korjaamme vanhat tulipesät joko massaamalla tai
                muuraamalla ne uudenveroisiksi. Muuraamme hormistot, asennamme
                valmishormit (harkko- ja teräshormit)
              </p>
            </div>
          )}
          {/* Remontit */}
          <div
            id="remontit"
            className="row justify-content-center"
            style={{
              backgroundImage: "url(./images/remontti.jpg)",
              backgroundPosition: "70% 70%",
              backgroundSize: "cover",
              textShadow: "1px 1px 2px black",
            }}
          >
            <div className="col-md-auto">
              <h2>Remontit</h2>
              <p>Mökki– ja huoneistoremontit</p>
              <p>Sauna- ja kylpyhuoneremontit</p>
              <p>Kattoremontit</p>
              <button
                className="btn btn-lg btn-dark"
                onClick={toggleGallery(setRemontit1)}
              >
                Galleria
              </button>
            </div>
          </div>
          {remontit1 && <Remonttigallery />}
          {/* Muut Palvelut */}
          <div
            id="muutpalvelut"
            className="row justify-content-center"
            style={{
              backgroundImage: "url(./images/muut-palvelut.jpg)",
              backgroundPosition: "0% 40%",
              backgroundSize: "cover",
              textShadow: "1px 1px 2px black",
            }}
          >
            <div className="col-md-auto">
              <h2>Muut Palvelut</h2>
              <p>Piipunpellitykset</p>
              <p>Sadehatut</p>
              <p>Kattoturvatuotteet</p>
              <button
                className="btn btn-lg btn-dark"
                onClick={toggleGallery(setMuutpalvelut1)}
              >
                Muut Palvelut
              </button>
            </div>
          </div>
          {muutpalvelut1 && (
            <div>
              <p>
                Kauttamme saat kattoturvatuotteet asennettuna. Piipunpellitykset
                ja -hatut mittatilaustyönä. Vuokraamme myös kuljetuslauttaa
                saarityömaille.
              </p>
            </div>
          )}
          {/* Verkkokauppa */}
          <div
            id="targetVerkkokauppa"
            className="row justify-content-center"
            style={{
              backgroundColor: "#3C424C",
              textShadow: "1px 1px 2px black",
              marginTop: "45px",
            }}
          >
            <div className="col-md-auto">
              <h2>Verkkokauppa</h2>
              <p>Kaminat</p>
              <p>Valmistulisijat</p>
              <p>Hormistot</p>
              <a
                rel="noreferrer"
                href="https://www.eurotulisijat.fi/fi"
                target="_blank"
                className="btn btn-lg btn-dark"
              >
                Verkkokauppaan
              </a>
            </div>
            </div>
          <ChatButton />
        </div>
        <Footer />
      </main>
    </Router>
  );
};

export default App;
