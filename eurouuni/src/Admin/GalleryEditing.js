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
      try {
        const categoriesRef = firestore.collection("tulisijatcategories");
        const orderRef = firestore.collection("categoryOrder").doc("order");

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
            };
          })
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
    try {
      const categoryImagesRef = storage.ref().child("images").child(categoryId);
      const categoryImages = await categoryImagesRef.listAll();

      const categoryItems = await Promise.all(
        categoryImages.items.map(async (imageRef) => {
          const imageUrl = await imageRef.getDownloadURL();
          return { id: imageRef.name, title: imageRef.name, imageUrl };
        })
      );

      return categoryItems;
    } catch (error) {
      console.error("Error fetching category images:", error);
      return [];
    }
  };

  const handleDeleteImage = async (category) => {
    try {
      const selectedIds = Object.keys(selectedImages[category.id] || {});
      if (!selectedIds.length) {
        alert("Please select at least one image to delete.");
        return;
      }

      await Promise.all(
        selectedIds.map(async (imageId) => {
          await deleteImageFromStorage(category.id, imageId);
        })
      );

      const updatedItems = category.items.filter((item) => !selectedIds.includes(item.id));
      const updatedCategory = { ...category, items: updatedItems };
      const updatedCategories = categories.map((cat) =>
        cat.id === category.id ? updatedCategory : cat
      );

      setCategories(updatedCategories);
      setSelectedImages({ ...selectedImages, [category.id]: {} });

      alert("Images deleted successfully!");
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("An error occurred while deleting images.");
    }
  };

  const handleCategoryOrderChange = async (dragIndex, hoverIndex) => {
    const draggedCategoryId = categoryOrder[dragIndex];
    const updatedOrder = [...categoryOrder];
    updatedOrder.splice(dragIndex, 1);
    updatedOrder.splice(hoverIndex, 0, draggedCategoryId);
    setCategoryOrder(updatedOrder);

    try {
      await firestore
        .collection("categoryOrder")
        .doc("order")
        .set({ order: updatedOrder });
    } catch (error) {
      console.error("Error updating category order:", error);
      try {
        const orderSnapshot = await firestore
          .collection("categoryOrder")
          .doc("order")
          .get();
        const orderData = orderSnapshot.data();
        if (orderData) {
          setCategoryOrder([...orderData.order]);
        }
      } catch (fetchError) {
        console.error("Error fetching category order:", fetchError);
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
            cat.id === category.id ? { ...cat, title: newCategoryName } : cat
          )
        );
      }
    } catch (error) {
      console.error("Error editing category:", error);
      alert("An error occurred while editing the category name.");
    }
  };

  const handleAddCategory = async () => {
    try {
      const newCategoryName = prompt("Enter the new category name:");
      if (newCategoryName) {
        const imageFiles = await selectImageFiles();
        if (imageFiles.length === 0) {
          alert("Please upload at least one image.");
          return;
        }
  
        const categoryId = await addCategoryToFirestore(newCategoryName);
        const newCategory = {
          id: categoryId,
          title: newCategoryName,
          items: [],
        };
        setCategories((prevCategories) => [newCategory, ...prevCategories]);
        setCategoryOrder((prevOrder) => [categoryId, ...prevOrder]);
  
        await Promise.all(
          imageFiles.map(async (imageFile) => {
            await uploadImageToStorage(categoryId, imageFile);
          })
        );
  
        alert("Category added successfully!");
      }
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleDeleteCategory = async (category) => {
    const MAX_RETRIES = 3; // Maximum number of retry attempts
    let retryCount = 0;
  
    async function deleteImagesFolderWithRetry(imagesFolderRef) {
      try {
        await imagesFolderRef.delete();
      } catch (error) {
        console.error(`Error deleting folder: ${error.message}`);
  
        // Retry deletion if maximum retries not reached
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying deletion attempt ${retryCount + 1}`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
          await deleteImagesFolderWithRetry(imagesFolderRef);
        } else {
          console.error(`Maximum retry attempts (${MAX_RETRIES}) reached. Unable to delete folder.`);
          throw error; // Throw the error to indicate that folder deletion failed after retries
        }
      }
    }
  
    try {
      if (
        window.confirm(
          `Are you sure you want to delete the category "${category.title}"? This action will also delete all associated images.`
        )
      ) {
        // Fetch the category document
        const categoryDocRef = firestore.collection("tulisijatcategories").doc(category.id);
        const categoryDocSnapshot = await categoryDocRef.get();
        const categoryData = categoryDocSnapshot.data();
  
        // Delete subcollection under category matching the category ID
        await deleteSubcollection(category.id);
  
        // Delete the category document from Firestore
        await categoryDocRef.delete();
  
        // Fetch the current order array
        const orderDocSnapshot = await firestore.collection("categoryOrder").doc("order").get();
        const currentOrder = orderDocSnapshot.data().order || [];
  
        // Remove the deleted category ID from the order array
        const updatedOrder = currentOrder.filter((categoryId) => categoryId !== category.id);
  
        // Update the order field in categoryOrder document
        await firestore.collection("categoryOrder").doc("order").update({
          order: updatedOrder
        });
  
        // Update local state: Filter out the deleted category
        const updatedCategories = categories.filter((cat) => cat.id !== category.id);
        setCategories(updatedCategories);
  
        // Update category order: Remove the deleted category from the order
        setCategoryOrder(updatedOrder);
  
        // Delete the folder inside the "images" folder associated with the category
        const storageRef = firebase.storage().ref();
        const imagesFolderRef = storageRef.child(`images/${category.id}`);
  
        // List all items in the folder
        const imageRefs = await imagesFolderRef.listAll();
  
        // Delete each item (file) in the folder
        await Promise.all(imageRefs.items.map(async (imageRef) => {
          try {
            await imageRef.delete();
          } catch (error) {
            console.error(`Error deleting image ${imageRef.name}: ${error.message}`);
            throw error; // Throw the error to stop the deletion process if an error occurs
          }
        }));
  
        // Finally, delete the folder itself with retry
        await deleteImagesFolderWithRetry(imagesFolderRef);
  
        alert("Category and associated images deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("An error occurred while deleting the category.");
    }
  };

  const deleteSubcollection = async (categoryId) => {
    const subcollectionRef = firestore.collection("tulisijatcategories").doc(categoryId).collection("subcollectionName");
    const snapshot = await subcollectionRef.get();
    snapshot.forEach((doc) => {
      doc.ref.delete();
    });
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

  const selectImageFiles = () => {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;
      input.onchange = (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
          reject(new Error("No files selected."));
        } else {
          resolve(Array.from(files));
        }
      };
      input.click();
    });
  };

  const updateCategoryOrder = async (newOrder) => {
    try {
      await firestore.collection("categoryOrder").doc("order").set({ order: newOrder });
    } catch (error) {
      console.error("Error updating category order:", error);
    }
  };

  const addCategoryToFirestore = async (categoryName) => {
    const docRef = await firestore.collection("tulisijatcategories").add({ text: categoryName });
    return docRef.id;
  };

  const uploadImageToStorage = async (categoryId, imageFile) => {
    await storage.ref().child("images").child(categoryId).child(imageFile.name).put(imageFile);
  };

  const deleteImageFromStorage = async (categoryId, imageId) => {
    const imageRef = storage.ref().child("images").child(categoryId).child(imageId);
    await imageRef.delete();
  };

  return (
    <>
      <button
        className="new-category-btn"
        onClick={handleAddCategory}
        disabled={!isAdminMode}
      >
        New Category
      </button>
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
    </>
  );
};

export default GalleryEditing;
