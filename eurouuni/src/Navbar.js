// Navbar.js

import React from "react";
import { Link } from 'react-router-dom';
import "./App.css";

const Navbar = () => {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="p-menu1">
      <nav id="navbar" className="navigation" role="navigation">
        <input id="toggle1" type="checkbox" />
        <label className="hamburger1" htmlFor="toggle1">
          <div className="top"></div>
          <div className="meat"></div>
          <div className="bottom"></div>
        </label>
        <div className="navigation-menu">
          <ul>
            {navItems.map((item) => (
              <li key={item.id}>
                <Link to={`#${item.id}`} onClick={() => scrollToSection(item.id)}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <nav className="menu1">
          {navItems.map((item) => (
            <Link key={item.id} className="link1" to={`#${item.id}`} onClick={() => scrollToSection(item.id)}>
              {item.label}
            </Link>
          ))}
        </nav>
      </nav>
    </section>
  );
}

const navItems = [
  { id: "targetGalleria", label: "Galleria" },
  { id: "targetPalvelut", label: "Palvelut" },
  { id: "targetVerkkokauppa", label: "Verkkokauppa" },
  { id: "targetYhteystiedot", label: "Yhteystiedot" },
];

export default Navbar;
