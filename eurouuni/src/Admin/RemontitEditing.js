import React, { useState, useEffect } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/storage";
import "firebase/compat/firestore";
import firebaseConfig from "../firebaseConfig";
import EditableTextField from "./EditableTextField";

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const storage = firebase.storage();
const firestore = firebase.firestore();

const RemontitEditing = ({ isAdminMode }) => {
  const [categories, setCategories] = useState([]);
  const [selectedImages, setSelectedImages] = useState({});
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [description, setDescription] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = firestore.collection("remontitcategories");
        const orderRef = firestore
          .collection("categoryOrder")
          .doc("orderremontit");
        const storedDescription = localStorage.getItem("descriptionText");
        setDescription(storedDescription || (await fetchDescription()));

        const [snapshot, orderSnapshot] = await Promise.all([
          categoriesRef.get(),
          orderRef.get(),
        ]);
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
    try {
      const categoryImagesRef = storage.ref(`imagesremontit/${categoryId}`);
      const categoryImages = await categoryImagesRef.listAll();
      const categoryItems = await Promise.all(
        categoryImages.items.map(async (imageRef) => {
          const imageUrl = await imageRef.getDownloadURL();
          return { id: imageRef.name, title: imageRef.name, imageUrl };
        }),
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
        alert("Select at least one image to delete.");
        return;
      }

      await Promise.all(
        selectedIds.map((imageId) =>
          deleteImageFromStorage(category.id, imageId),
        ),
      );

      const updatedItems = category.items.filter(
        (item) => !selectedIds.includes(item.id),
      );
      const updatedCategories = categories.map((cat) =>
        cat.id === category.id ? { ...cat, items: updatedItems } : cat,
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
    try {
      const draggedCategoryId = categoryOrder[dragIndex];
      const updatedOrder = [...categoryOrder];
      updatedOrder.splice(dragIndex, 1);
      updatedOrder.splice(hoverIndex, 0, draggedCategoryId);
      setCategoryOrder(updatedOrder);

      await firestore
        .collection("categoryOrder")
        .doc("orderremontit")
        .set({ order: updatedOrder });
    } catch (error) {
      console.error("Error updating category order:", error);
      alert("An error occurred while updating category order.");
      // Attempt to revert to the previous order if updating fails
      try {
        const orderSnapshot = await firestore
          .collection("categoryOrder")
          .doc("orderremontit")
          .get();
        const orderData = orderSnapshot.data();
        if (orderData) {
          setCategoryOrder([...orderData.order]);
        }
      } catch (fetchError) {
        console.error("Error fetching category order:", fetchError);
        setCategoryOrder([...categoryOrder]);
      }
    }
  };

  const handleEditCategory = async (category) => {
    try {
      const newCategoryName = prompt(
        "Enter the new category name:",
        category.title,
      );
      if (newCategoryName !== null && newCategoryName !== category.title) {
        await firestore
          .collection("remontitcategories")
          .doc(category.id)
          .update({ text: newCategoryName });
        setCategories((prevCategories) =>
          prevCategories.map((cat) =>
            cat.id === category.id ? { ...cat, title: newCategoryName } : cat,
          ),
        );
        alert("Category name updated successfully!");
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
        setCategoryOrder((prevOrder) => [...prevOrder, categoryId]);

        await Promise.all(
          imageFiles.map(async (imageFile) => {
            await uploadImageToStorage(categoryId, imageFile);
          }),
        );

        alert("Category added successfully!");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      alert("An error occurred while adding the category.");
    }
  };

  const handleDeleteCategory = async (category) => {
    const MAX_RETRIES = 3;
    let retryCount = 0;

    const deleteImagesFolderWithRetry = async (imagesFolderRef) => {
      try {
        await imagesFolderRef.delete();
      } catch (error) {
        console.error(`Error deleting category folder: ${error.message}`);

        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying deletion attempt ${retryCount + 1}`);
          retryCount++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await deleteImagesFolderWithRetry(imagesFolderRef);
        } else {
          console.error(
            `Maximum retries (${MAX_RETRIES}) reached. Failed to delete category.`,
          );
          throw error;
        }
      }
    };

    try {
      if (
        window.confirm(
          `Are you sure you want to delete the category "${category.title}"? This action will also delete all associated images.`,
        )
      ) {
        const categoryDocRef = firestore
          .collection("remontitcategories")
          .doc(category.id);
        await deleteSubcollection(category.id);
        await categoryDocRef.delete();

        const orderDocSnapshot = await firestore
          .collection("categoryOrder")
          .doc("orderremontit")
          .get();
        const currentOrder = orderDocSnapshot.data().order || [];
        const updatedOrder = currentOrder.filter(
          (categoryId) => categoryId !== category.id,
        );

        await firestore
          .collection("categoryOrder")
          .doc("orderremontit")
          .update({
            order: updatedOrder,
          });

        const updatedCategories = categories.filter(
          (cat) => cat.id !== category.id,
        );
        setCategories(updatedCategories);
        setCategoryOrder(updatedOrder);

        const storageRef = firebase.storage().ref();
        const imagesFolderRef = storageRef.child(
          `imagesremontit/${category.id}`,
        );
        const imageRefs = await imagesFolderRef.listAll();

        await Promise.all(
          imageRefs.items.map(async (imageRef) => {
            try {
              await imageRef.delete();
            } catch (error) {
              console.error(
                `Error deleting image ${imageRef.name}: ${error.message}`,
              );
              throw error;
            }
          }),
        );

        await deleteImagesFolderWithRetry(imagesFolderRef);

        alert("Category and associated images deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("An error occurred while deleting the category.");
    }
  };

  const deleteSubcollection = async (categoryId) => {
    try {
      const subcollectionRef = firestore
        .collection("remontitcategories")
        .doc(categoryId)
        .collection("subcollectionName");
      const snapshot = await subcollectionRef.get();
      const batch = firestore.batch();

      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log("Subcollection deleted successfully!");
    } catch (error) {
      console.error("Error deleting subcollection:", error);
      throw error;
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

  const selectImageFiles = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;

      return new Promise((resolve, reject) => {
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
    } catch (error) {
      console.error("Error selecting image files:", error);
      throw error;
    }
  };

  const updateCategoryOrder = async (newOrder) => {
    try {
      await firestore
        .collection("categoryOrder")
        .doc("orderremontit")
        .set({ order: newOrder });
      console.log("Category order updated successfully!");
    } catch (error) {
      console.error("Error updating category order:", error);
      throw error;
    }
  };

  const addCategoryToFirestore = async (categoryName) => {
    try {
      const docRef = await firestore
        .collection("remontitcategories")
        .add({ text: categoryName });
      console.log("Category added to Firestore successfully!");
      return docRef.id;
    } catch (error) {
      console.error("Error adding category to Firestore:", error);
      throw error;
    }
  };

  const uploadImageToStorage = async (categoryId, imageFile) => {
    try {
      await storage
        .ref()
        .child("imagesremontit")
        .child(categoryId)
        .child(imageFile.name)
        .put(imageFile);
      console.log(
        `Image ${imageFile.name} uploaded to storage successfully for category ${categoryId}.`,
      );
    } catch (error) {
      console.error(
        `Error uploading image ${imageFile.name} to storage:`,
        error,
      );
      throw error;
    }
  };

  const deleteImageFromStorage = async (categoryId, imageId) => {
    try {
      const imageRef = storage
        .ref()
        .child("imagesremontit")
        .child(categoryId)
        .child(imageId);
      await imageRef.delete();
      console.log(
        `Image ${imageId} deleted from storage successfully for category ${categoryId}.`,
      );
    } catch (error) {
      console.error(`Error deleting image ${imageId} from storage:`, error);
      throw error;
    }
  };

  const handleUploadImages = async (category) => {
    try {
      const imageFiles = await selectImageFiles();
      if (imageFiles.length === 0) {
        alert("Please upload at least one image.");
        return;
      }

      await Promise.all(
        imageFiles.map(async (imageFile) => {
          await uploadImageToStorage(category.id, imageFile);
        }),
      );

      alert("Images uploaded successfully!");
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("An error occurred while uploading images.");
    }
  };

  const handleSave = async () => {
    try {
      // Update category order in Firestore
      await updateCategoryOrder(categoryOrder);

      // Update category names in Firestore
      await Promise.all(
        categories.map((category) =>
          firestore
            .collection("remontitcategories")
            .doc(category.id)
            .update({ text: category.title }),
        ),
      );

      alert("Changes saved successfully!");
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("An error occurred while saving changes.");
    }
  };

  const fetchDescription = async () => {
    try {
      const descriptionRef = firestore
        .collection("descriptions")
        .doc("remontit");
      const descriptionDoc = await descriptionRef.get();

      if (descriptionDoc.exists) {
        const descriptionText = descriptionDoc.data().text;
        localStorage.setItem("descriptionText", descriptionText);
        setDescription(descriptionText);
      } else {
        console.log("No description found.");
      }
    } catch (error) {
      console.error("Error fetching description:", error);
      throw error;
    }
  };

  const handleDescriptionSave = async (newValue) => {
    try {
      await firestore
        .collection("descriptions")
        .doc("remontit")
        .set({ text: newValue });
      setDescription(newValue);
      alert("Description saved successfully!");
    } catch (error) {
      console.error("Error saving description:", error);
      alert("An error occurred while saving description.");
    }
  };

  return (
    <>
      <button
        className="new-category-btn"
        onClick={handleAddCategory}
        disabled={!isAdminMode}
      >
        Uusi Kategoria
      </button>
      <div>
        <EditableTextField
          initialValue={description}
          onSave={handleDescriptionSave}
          descriptionKey="remontit" // Specify the description key
        />
      </div>
      <div className="gallery-editing-container">
        {categoryOrder.map((categoryId, index) => {
          const category = categories.find((cat) => cat.id === categoryId);
          if (!category) return null;

          return (
            <div key={category.id} className="gallery-editing-category">
              <div className="category-header">
                <button
                  className="editable-title"
                  onClick={() => handleEditCategory(category)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleEditCategory(category);
                    }
                  }}
                >
                  {category.title} <span className="edit-icon">✎</span>
                </button>
                {isAdminMode && (
                  <button
                    className="delete-category-btn"
                    onClick={() => handleDeleteCategory(category)}
                  >
                    <i
                      className="fas fa-times-circle"
                      style={{ color: "red" }}
                    ></i>
                  </button>
                )}
              </div>
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
                <div className="category-actions">
                  <div className="order-buttons">
                    <button
                      className="category-order-btn"
                      onClick={() =>
                        handleCategoryOrderChange(index, index - 1)
                      }
                      disabled={index === 0}
                    >
                      <i className="fas fa-arrow-up"></i>
                    </button>
                    <button
                      className="category-order-btn"
                      onClick={() =>
                        handleCategoryOrderChange(index, index + 1)
                      }
                      disabled={index === categoryOrder.length - 1}
                    >
                      <i className="fas fa-arrow-down"></i>
                    </button>
                  </div>
                  <button
                    className="upload-images-btn"
                    onClick={() => handleUploadImages(category)}
                    disabled={!isAdminMode}
                  >
                    Lisää kuvia
                  </button>
                  <button
                    className="delete-selected-btn"
                    onClick={() => handleDeleteImage(category)}
                  >
                    Poista kuvat
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="save-button-container">
        <button className="save-button" onClick={handleSave}>
          Tallenna
        </button>
      </div>
    </>
  );
};

export default RemontitEditing;