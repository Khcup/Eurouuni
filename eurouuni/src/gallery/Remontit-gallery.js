import "../App.css";
import React from "react";
const Remonttigallery = () => {
  return (
    <div>
      <appgallery>
        <appgallerylist className="ng-star-inserted">
          <appgallerytextshow className="ng-star-inserted">
            <p>
              Teemme monipuolisesti erilaisia remontti- ja saneeraustöitä.
              -Kattoremontit, huopa-ja peltikatot -Sauna-ja kylpyhuoneremontit
              -Mökkiremontit -Purkutyöt -Laiturit, (uudet laiturit ja vanhojen
              korjaus, myös nosto ja laskupalvelu
            </p>
          </appgallerytextshow>
          <appgalleryitem className="ng-star-inserted">
            <div className="itemswrapper">
              <a href="#/gallery/0" style={{ cursor: "pointer" }}>
                <img
                  alt=""
                  className="img-responsive"
                  style={{
                    maxHeight: "220px",
                    alt: "Takkaleivinuunit",
                    backgroundImage: "url()",
                  }}
                />
                <h4 style={{ color: "black" }}>Temporary</h4>
              </a>
            </div>
            {<div></div>}
          </appgalleryitem>
        </appgallerylist>
      </appgallery>
    </div>
  );
};
export default Remonttigallery;
