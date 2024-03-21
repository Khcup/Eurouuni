import React, { useState, useEffect } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/storage";
import "firebase/compat/firestore";
import firebaseConfig from "../firebaseConfig";
import EditableTextField from "./EditableTextField";

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const storage = firebase.storage();
const firestore = firebase.firestore();

const GalleryEditing = ({ isAdminMode }) => {
  const [categories, setCategories] = useState([]);
  const [selectedImages, setSelectedImages] = useState({});
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [description, setDescription] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = firestore.collection("tulisijatcategories");
        const orderRef = firestore.collection("categoryOrder").doc("order");

        const snapshot = await categoriesRef.get();
        const orderSnapshot = await orderRef.get();
        const storedDescription = localStorage.getItem("descriptionText");
        if (storedDescription) {
          setDescription(storedDescription);
        } else {
          fetchDescription();
        }
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
      const categoryImagesRef = storage.ref().child("images").child(categoryId);
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
        selectedIds.map(async (imageId) => {
          await deleteImageFromStorage(category.id, imageId);
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
        setCategoryOrder([...categoryOrder]);
      }
    }
  };

  const handleEditCategory = async (category) => {
    const newCategoryName = prompt(
      "Enter the new category name:",
      category.title,
    );
    if (newCategoryName !== null && newCategoryName !== category.title) {
      try {
        await firestore
          .collection("tulisijatcategories")
          .doc(category.id)
          .update({ text: newCategoryName });
        setCategories((prevCategories) =>
          prevCategories.map((cat) =>
            cat.id === category.id ? { ...cat, title: newCategoryName } : cat,
          ),
        );
      } catch (error) {
        console.error("Error editing category:", error);
        alert("An error occurred while editing the category name.");
      }
    }
  };

  const handleAddCategory = async () => {
    try {
      const newCategoryName = prompt("Enter the new category name:");
      if (newCategoryName) {
        // Add category to Firestore
        const categoryId = await addCategoryToFirestore(newCategoryName);
        const newCategory = {
          id: categoryId,
          title: newCategoryName,
          items: [],
        };
        setCategories((prevCategories) => [newCategory, ...prevCategories]);
        setCategoryOrder((prevOrder) => [...prevOrder, categoryId]);
        // Upload images if any
        const imageFiles = await selectImageFiles();
        if (imageFiles.length === 0) {
          alert("Upload at least one image.");
          return;
        }
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
    const MAX_RETRIES = 3; // Maximum number of retry attempts
    let retryCount = 0;

    async function deleteImagesFolderWithRetry(imagesFolderRef) {
      try {
        await imagesFolderRef.delete();
      } catch (error) {
        console.error(`Error deleting category folder: ${error.message}`);

        // Retry deletion if maximum retries not reached
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying deletion attempt ${retryCount + 1}`);
          retryCount++;
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
          await deleteImagesFolderWithRetry(imagesFolderRef);
        } else {
          console.error(
            `Maximum retry attempts (${MAX_RETRIES}) reached. Category could not be deleted.`,
          );
          throw error;
        }
      }
    }

    try {
      if (
        window.confirm(
          `Are you sure you want to delete the category "${category.title}"? This action will also delete all related images.`,
        )
      ) {
        // Delete subcollection under category matching the category ID
        await deleteSubcollection(category.id);

        // Delete the category document from Firestore
        await firestore
          .collection("tulisijatcategories")
          .doc(category.id)
          .delete();

        // Update the order field in categoryOrder document
        const currentOrderSnapshot = await firestore
          .collection("categoryOrder")
          .doc("order")
          .get();
        const currentOrder = currentOrderSnapshot.data().order || [];
        const updatedOrder = currentOrder.filter(
          (categoryId) => categoryId !== category.id,
        );
        await firestore.collection("categoryOrder").doc("order").update({
          order: updatedOrder,
        });

        // Update local state
        const updatedCategories = categories.filter(
          (cat) => cat.id !== category.id,
        );
        setCategories(updatedCategories);
        setCategoryOrder(updatedOrder);

        // Delete the folder inside the "images" folder associated with the category
        const storageRef = firebase.storage().ref();
        const imagesFolderRef = storageRef.child(`images/${category.id}`);
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

        alert("Category and related images deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("An error occurred while deleting the category.");
    }
  };

  const deleteSubcollection = async (categoryId) => {
    try {
      const subcollectionRef = firestore
        .collection("tulisijatcategories")
        .doc(categoryId)
        .collection("subcollectionName");
      const snapshot = await subcollectionRef.get();
      const deletePromises = snapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error deleting subcollection:", error);
      throw error; // Propagate the error to the caller for proper error handling
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
      await firestore
        .collection("categoryOrder")
        .doc("order")
        .set({ order: newOrder });
    } catch (error) {
      console.error("Virhe kategoriajärjestyksen päivityksessä:", error);
    }
  };

  const addCategoryToFirestore = async (categoryName) => {
    const docRef = await firestore
      .collection("tulisijatcategories")
      .add({ text: categoryName });
    return docRef.id;
  };

  const uploadImageToStorage = async (categoryId, imageFile) => {
    await storage
      .ref()
      .child("images")
      .child(categoryId)
      .child(imageFile.name)
      .put(imageFile);
  };

  const deleteImageFromStorage = async (categoryId, imageId) => {
    const imageRef = storage
      .ref()
      .child("images")
      .child(categoryId)
      .child(imageId);
    await imageRef.delete();
  };

  const handleUploadImages = async (category) => {
    try {
      const imageFiles = await selectImageFiles();
      if (imageFiles.length === 0) {
        alert("Lataa vähintään yksi kuva.");
        return;
      }

      await Promise.all(
        imageFiles.map(async (imageFile) => {
          await uploadImageToStorage(category.id, imageFile);
        }),
      );

      alert("Kuvien lataus onnistui!");
    } catch (error) {
      console.error("Virhe kuvien lataamisessa:", error);
      alert("Virhe ladattaessa kuvia.");
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
            .collection("tulisijatcategories")
            .doc(category.id)
            .update({ text: category.title }),
        ),
      );

      alert("Muutokset tallennettu onnistuneesti!");
    } catch (error) {
      console.error("Virhe tallennettaessa muutoksia:", error);
      alert("Muutoksia tallennettaessa tapahtui virhe.");
    }
  };

  const fetchDescription = async () => {
    try {
      const descriptionRef = firestore
        .collection("descriptions")
        .doc("tulisijat");
      const descriptionDoc = await descriptionRef.get();

      if (descriptionDoc.exists) {
        const descriptionText = descriptionDoc.data().text;
        setDescription(descriptionText);
      } else {
        console.log("No description found.");
      }
    } catch (error) {
      console.error("Error fetching description:", error);
    }
  };

  const handleDescriptionSave = async (newValue) => {
    try {
      await firestore
        .collection("descriptions")
        .doc("tulisijat")
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
      <EditableTextField
        initialValue={description}
        onSave={handleDescriptionSave}
        descriptionKey="tulisijat" // Specify the description key
      />
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

export default GalleryEditing;
