import React, { useState, useEffect } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/storage";
import "firebase/compat/firestore";
import firebaseConfig from "../firebaseConfig";

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const storage = firebase.storage();
const firestore = firebase.firestore();

const GalleryEditing = ({ isAdminMode }) => {
  const [categories, setCategories] = useState([]);
  const [selectedImages, setSelectedImages] = useState({});
  const [categoryOrder, setCategoryOrder] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const categoriesRef = firestore.collection("tulisijatcategories");
      const orderRef = firestore.collection("categoryOrder").doc("order");

      try {
        const snapshot = await categoriesRef.get();
        const orderSnapshot = await orderRef.get();

        const fetchedCategories = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const categoryId = doc.id;
            const categoryName = doc.data().text;
            const categoryImages = await fetchCategoryImages(categoryId);
            return {
              id: categoryId,
              title: categoryName,
              items: categoryImages || [],
            }; // Ensure items is initialized as an array
          }),
        );

        const fetchedOrder = orderSnapshot.exists
          ? orderSnapshot.data().order
          : fetchedCategories.map((category) => category.id);

        setCategories(fetchedCategories);
        setCategoryOrder(fetchedOrder);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const fetchCategoryImages = async (categoryId) => {
    const categoryImagesRef = storage.ref().child("images").child(categoryId);
    const categoryImages = await categoryImagesRef.listAll();

    const categoryItems = await Promise.all(
      categoryImages.items.map(async (imageRef) => {
        const imageUrl = await imageRef.getDownloadURL();
        return { id: imageRef.name, title: imageRef.name, imageUrl };
      }),
    );

    return categoryItems;
  };

  const handleDeleteImage = async (category) => {
    try {
      const selectedIds = Object.keys(selectedImages[category.id] || {});
      await Promise.all(
        selectedIds.map(async (imageId) => {
          const imageRef = storage
            .ref()
            .child("images")
            .child(category.id)
            .child(imageId);
          await imageRef.delete();
        }),
      );

      const updatedItems = category.items.filter(
        (item) => !selectedIds.includes(item.id),
      );
      const updatedCategory = { ...category, items: updatedItems };
      const updatedCategories = categories.map((cat) =>
        cat.id === category.id ? updatedCategory : cat,
      );

      setCategories(updatedCategories);
      setSelectedImages({ ...selectedImages, [category.id]: {} }); // Clear selected images for this category
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  const handleCategoryOrderChange = async (dragIndex, hoverIndex) => {
    const draggedCategoryId = categoryOrder[dragIndex];
    const updatedOrder = [...categoryOrder];
    updatedOrder.splice(dragIndex, 1);
    updatedOrder.splice(hoverIndex, 0, draggedCategoryId);
    setCategoryOrder(updatedOrder);

    try {
      // Update category order in Firestore
      await firestore
        .collection("categoryOrder")
        .doc("order")
        .set({ order: updatedOrder });
    } catch (error) {
      console.error("Error updating category order:", error);
      // Revert to the previous order by fetching from Firestore again
      try {
        const orderSnapshot = await firestore
          .collection("categoryOrder")
          .doc("order")
          .get();
        const orderData = orderSnapshot.data();
        if (orderData) {
          setCategoryOrder(orderData.order);
        }
      } catch (fetchError) {
        console.error("Error fetching category order:", fetchError);
        // Failed to fetch order from Firestore, reset to initial order
        setCategoryOrder(categoryOrder);
      }
    }
  };

  const handleEditCategory = async (category) => {
    try {
      const newCategoryName = prompt("Enter the new category name:");
      if (newCategoryName) {
        await firestore
          .collection("tulisijatcategories")
          .doc(category.id)
          .update({ text: newCategoryName });
        setCategories((prevCategories) =>
          prevCategories.map((cat) =>
            cat.id === category.id ? { ...cat, title: newCategoryName } : cat,
          ),
        );
      }
    } catch (error) {
      console.error("Error editing category:", error);
    }
  };

  const handleAddCategory = async () => {
    try {
      const newCategoryName = prompt("Enter the new category name:");
      if (newCategoryName) {
        const imageFiles = prompt(
          "Upload at least one image file (separate file names with comma):",
        ).split(",");
        if (
          imageFiles.length === 0 ||
          (imageFiles.length === 1 && imageFiles[0] === "")
        ) {
          alert("Please upload at least one image.");
          return;
        }
        const docRef = await firestore
          .collection("tulisijatcategories")
          .add({ text: newCategoryName });
        const categoryId = docRef.id;
        const newCategory = {
          id: categoryId,
          title: newCategoryName,
          items: [],
        };
        setCategories((prevCategories) => [newCategory, ...prevCategories]);
        await Promise.all(
          imageFiles.map(async (imageName) => {
            const imageFile = new File([], imageName);
            await storage
              .ref()
              .child("images")
              .child(categoryId)
              .child(imageName)
              .put(imageFile);
          }),
        );
      }
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleDeleteCategory = async (category) => {
    try {
      if (
        window.confirm(
          `Are you sure you want to delete the category "${category.title}"? This action cannot be undone.`,
        )
      ) {
        const imagesRef = storage.ref().child("images").child(category.id);
        await imagesRef.delete();
        await firestore
          .collection("tulisijatcategories")
          .doc(category.id)
          .delete();
        setCategories(categories.filter((cat) => cat.id !== category.id));
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const toggleImageSelection = (category, imageId) => {
    const isSelected = selectedImages[category.id]?.[imageId];
    setSelectedImages({
      ...selectedImages,
      [category.id]: {
        ...selectedImages[category.id],
        [imageId]: !isSelected,
      },
    });
  };

  return (
    <div className="gallery-editing-container">
      {categoryOrder.map((categoryId, index) => {
        const category = categories.find((cat) => cat.id === categoryId);
        if (!category) return null;
        return (
          <div key={category.id} className="gallery-editing-category">
            <h2>{category.title}</h2>
            {isAdminMode && (
              <button
                className="edit-category-btn"
                onClick={() => handleEditCategory(category)}
              >
                Edit Category Name
              </button>
            )}
            {isAdminMode && (
              <button
                className="delete-category-btn"
                onClick={() => handleDeleteCategory(category)}
              >
                Delete Category
              </button>
            )}
            {isAdminMode && (
              <button
                className="delete-selected-btn"
                onClick={() => handleDeleteImage(category)}
              >
                Delete Selected
              </button>
            )}
            <div className="category-editing-items">
              {category.items.map((item) => (
                <div key={item.id} className="category-editing-item">
                  <input
                    type="checkbox"
                    checked={!!selectedImages[category.id]?.[item.id]}
                    onChange={() => toggleImageSelection(category, item.id)}
                  />
                  <img
                    className="item-image"
                    src={item.imageUrl}
                    alt={item.title}
                  />
                </div>
              ))}
            </div>
            {isAdminMode && (
              <button
                className="category-order-btn"
                onClick={() => handleCategoryOrderChange(index, index - 1)}
                disabled={index === 0}
              >
                Move Up
              </button>
            )}
            {isAdminMode && (
              <button
                className="category-order-btn"
                onClick={() => handleCategoryOrderChange(index, index + 1)}
                disabled={index === categoryOrder.length - 1}
              >
                Move Down
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GalleryEditing;