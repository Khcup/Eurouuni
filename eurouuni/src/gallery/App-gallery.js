import React, { useState } from "react";
import { galleryData, categoriesData } from "./data";

const AppGalleryItem = ({ item, toggleGallery }) => (
  <appgalleryitem className="ng-star-inserted">
    <div className="itemswrapper">
      <a
        href={`#/gallery/${item.id}`}
        onClick={() => toggleGallery(item.title)}
        style={{ cursor: "pointer" }}
      >
        <img
          alt={item.title}
          className="img-responsive"
          style={{
            maxHeight: "220px",
            display: "block",
            width: "100%",
          }}
          src={item.imageUrl}
        />
        <h4 style={{ color: "black" }}>{item.title}</h4>
      </a>
    </div>
  </appgalleryitem>
);

const GalleryCategory = ({ categoryTitle, items }) => (
  <div className="gallery-category">
    <h2>{categoryTitle}</h2>
    <div className="category-items">
      {items.map((item) => (
        <div key={item.id} className="category-item">
          <img src={item.imageSrc} alt={item.altText} />
          <p>{item.itemName}</p>
        </div>
      ))}
    </div>
  </div>
);

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAll, setShowAll] = useState(true);

  const toggleGallery = (title) => {
    if (title === "All") {
      setSelectedCategory(null);
      setShowAll(true);
    } else {
      const category = categoriesData.find(
        (category) => category.title === title,
      );
      setSelectedCategory(category);
      setShowAll(false);
    }
  };

  return (
    <div>
      {showAll
        ? galleryData.map((item) => (
            <AppGalleryItem
              key={item.id}
              item={item}
              toggleGallery={toggleGallery}
            />
          ))
        : selectedCategory && (
            <div>
              <button
                className="back-button"
                onClick={() => {
                  setShowAll(true);
                  setSelectedCategory(null);
                }}
              >
                « Takaisin
              </button>
              <GalleryCategory
                categoryTitle={selectedCategory.title}
                items={selectedCategory.items}
              />
            </div>
          )}
    </div>
  );
};

export default Gallery;