import React, { useState, useEffect } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import firebaseConfig from "../firebaseConfig";

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const firestore = firebase.firestore();
const storage = firebase.storage();

const AppGalleryItem = ({ item, toggleGallery, showText }) => (
  <div className="app-gallery-item">
    <div className="item-wrapper">
      <div
        onClick={() => toggleGallery(item.title)}
        style={{ cursor: "pointer" }}
      >
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
          <AppGalleryItem
            item={item}
            toggleGallery={toggleGallery}
            showText={!selected}
          />
        </div>
      ))}
    </div>
  </div>
);

const Remonttigallery = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [description, setDescription] = useState(""); // State for description

  useEffect(() => {
    const fetchDescription = async () => {
      try {
        const descriptionDoc = await firestore
          .collection("descriptions")
          .doc("remontit")
          .get();
        if (descriptionDoc.exists) {
          setDescription(descriptionDoc.data().text);
        } else {
          console.log("No description found.");
        }
      } catch (error) {
        console.error("Error fetching description:", error);
      }
    };

    fetchDescription();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = firestore.collection("remontitcategories");
        const snapshot = await categoriesRef.get();

        const fetchedCategories = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const categoryId = doc.id;
            const categoryData = doc.data();
            const categoryName = categoryData.text || "No Title";
            const categoryImages = await fetchCategoryImages(categoryId);
            return {
              id: categoryId,
              title: categoryName,
              items: categoryImages || [],
            };
          }),
        );

        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const fetchCategoryImages = async (categoryId) => {
    try {
      const categoryImagesRef = storage
        .ref()
        .child("imagesremontit")
        .child(categoryId);
      const categoryImages = await categoryImagesRef.listAll();

      // Fetch image URLs and create an array of objects with id, title, and imageUrl
      const categoryItems = await Promise.all(
        categoryImages.items.map(async (imageRef) => {
          const imageUrl = await imageRef.getDownloadURL();
          const id = imageRef.name; // Use imageRef.name as ID
          return { id, title: imageRef.name, imageUrl };
        }),
      );

      // Fetch the image order from Firestore
      const orderSnapshot = await firestore
        .collection("categoryImagesOrder")
        .doc(categoryId)
        .get();
      const orderData = orderSnapshot.data();
      if (orderData && orderData.order) {
        const orderedIds = orderData.order;
        categoryItems.sort((a, b) => {
          const aIndex = orderedIds.indexOf(a.imageUrl);
          const bIndex = orderedIds.indexOf(b.imageUrl);
          return aIndex - bIndex;
        });
      }

      return categoryItems;
    } catch (error) {
      console.error("Error fetching category images:", error);
      return [];
    }
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
      <p>{description}</p>

      {selectedCategory ? (
        <div>
          <button
            className="back-button"
            onClick={() => setSelectedCategory(null)}
          >
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
            item={{
              id: category.id,
              title: category.title,
              imageUrl: category.items[0]?.imageUrl,
            }}
            toggleGallery={toggleGallery}
            showText={true}
          />
        ))
      )}
    </div>
  );
};

export default Remonttigallery;
