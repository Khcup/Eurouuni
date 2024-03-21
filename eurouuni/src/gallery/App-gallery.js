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
  const [description, setDescription] = useState(""); // State for description
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const fetchDescription = async () => {
      try {
        const descriptionDoc = await firestore.collection("descriptions").doc("tulisijat").get();
        if (descriptionDoc.exists) {
          setDescription(descriptionDoc.data().text);
        } else {
          console.log("No description found.");
        }
      } catch (error) {
        console.error("Error fetching description:", error);
      }
    };

    const fetchCategories = async () => {
      try {
        const categoriesRef = firestore.collection("tulisijatcategories");
        const orderRef = firestore.collection("categoryOrder").doc("order");
    
        const snapshot = await categoriesRef.get();
        const orderSnapshot = await orderRef.get();
    
        const fetchedCategories = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const categoryId = doc.id;
            const categoryData = doc.data();
            
            // Check if 'text' field exists in the document data
            const categoryName = categoryData && categoryData.text ? categoryData.text : "";
            
            const categoryImages = await fetchCategoryImages(categoryId);
            return {
              id: categoryId,
              title: categoryName,
              items: categoryImages || [],
            };
          })
        );

        // Apply category order
        const orderedCategories = orderSnapshot.exists ? orderSnapshot.data().order.map(id => fetchedCategories.find(category => category.id === id)) : fetchedCategories;

        setCategories(orderedCategories);
        setLoading(false); // Set loading to false after fetching is complete
      } catch (error) {
        console.error("Error fetching categories:", error);
        setLoading(false); // Set loading to false in case of error
      }
    };

    fetchDescription();
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

  if (loading) {
    return <div>Loading...</div>; // Render loading state
  }

  return (
    <div className="gallery-container">
      <p>{description}</p>

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
