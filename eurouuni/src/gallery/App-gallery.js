import React, { useState, useEffect } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/storage";
import "firebase/compat/firestore";
import firebaseConfig from "../firebaseConfig";

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const firestore = firebase.firestore();

const AppGalleryItem = ({ item, toggleGallery, showText }) => (
  <div className="app-gallery-item">
    <div className="item-wrapper">
      <div onClick={() => toggleGallery(item.title)} style={{ cursor: "pointer" }}>
        <img alt={item.title} className="img-responsive" src={item.imageUrl} />
      </div>
      {showText && <div>{item.title}</div>}
    </div>
  </div>
);

const GalleryCategory = ({ category, selected, toggleGallery }) => (
  <div className="gallery-category">
    <h2>{category.title}</h2>
    <div className="category-items">
      {category.items.map((item) => (
        <div key={item.id} className="category-item">
          <AppGalleryItem item={item} toggleGallery={toggleGallery} showText={!selected} />
        </div>
      ))}
    </div>
  </div>
);

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const categoriesRef = firestore.collection("tulisijatcategories");
      const orderRef = firestore.collection("categoryOrder").doc("order");

      try {
        await categoriesRef.get();
        const orderSnapshot = await orderRef.get();

        const fetchedCategories = await Promise.all(
          orderSnapshot.exists ? orderSnapshot.data().order.map(async (categoryId) => {
            const categoryRef = await categoriesRef.doc(categoryId).get();
            const categoryName = categoryRef.data().text;
            const categoryImages = await fetchCategoryImages(categoryId);
            return { id: categoryId, title: categoryName, items: categoryImages };
          }) : []
        );

        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const fetchCategoryImages = async (categoryId) => {
    const storageRef = firebase.storage().ref().child("images").child(categoryId);
    const categoryImages = await storageRef.listAll();

    const categoryItems = await Promise.all(
      categoryImages.items.map(async (imageRef) => {
        const url = await imageRef.getDownloadURL();
        return { id: imageRef.name, title: imageRef.name, imageUrl: url };
      })
    );

    return categoryItems;
  };

  const toggleGallery = (title) => {
    if (selectedCategory && selectedCategory.title === title) {
      setSelectedCategory(null);
    } else {
      const category = categories.find((category) => category.title === title);
      setSelectedCategory(category);
    }
  };

  return (
    <div className="gallery-container">
      {selectedCategory ? (
        <div>
          <button className="back-button" onClick={() => setSelectedCategory(null)}>
            « Back
          </button>
          <GalleryCategory
            category={selectedCategory}
            selected={true}
            toggleGallery={toggleGallery}
          />
        </div>
      ) : (
        categories.map((category) => (
          <AppGalleryItem
            key={category.id}
            item={{ id: category.id, title: category.title, imageUrl: category.items[0]?.imageUrl }}
            toggleGallery={toggleGallery}
            showText={true}
          />
        ))
      )}
    </div>
  );
};

export default Gallery;
