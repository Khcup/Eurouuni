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

const RemontitEditing = ({ isAdminMode }) => {
  const [categories, setCategories] = useState([]);
  const [selectedImages, setSelectedImages] = useState({});
  const [categoryOrder, setCategoryOrder] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = firestore.collection("remontitcategories");
        const orderRef = firestore
          .collection("categoryOrder")
          .doc("orderremontit");

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
        console.error("Virhe noudettaessa luokkia:", error);
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
          const id = imageUrl; // Use imageUrl as ID
          return { id, title: imageRef.name, imageUrl };
        }),
      );

      // Fetch the image order from Firestore
      const orderSnapshot = await firestore
        .collection("categoryRemontitImagesOrder")
        .doc(categoryId)
        .get();
      const orderData = orderSnapshot.data();
      if (orderData?.order) {
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

  const handleDeleteImage = async (category) => {
    try {
      const selectedIds = Object.keys(selectedImages[category.id] || {});
      if (!selectedIds.length) {
        alert("Valitse vähintään yksi poistettava kuva.");
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

      alert("Kuvien poistaminen onnistui!");
    } catch (error) {
      console.error("Virhe kuvan poistamisessa:", error);
      alert("Kuvia poistettaessa tapahtui virhe.");
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
        .doc("orderremontit")
        .set({ order: updatedOrder });
    } catch (error) {
      console.error("Virhe luokkajärjestyksen päivityksessä:", error);
      alert("Luokkajärjestystä päivitettäessä tapahtui virhe.");
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
        console.error("Virhe haettaessa luokkajärjestystä:", fetchError);
        setCategoryOrder([...categoryOrder]);
      }
    }
  };

  const handleEditCategory = async (category) => {
    try {
      const newCategoryName = prompt("Anna uuden luokan nimi:", category.title);
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
        alert("Luokan nimen päivitys onnistui!");
      }
    } catch (error) {
      console.error("Virhe luokan muokkaamisessa:", error);
      alert("Kategorian nimeä muokatessa tapahtui virhe.");
    }
  };

  const handleAddCategory = async () => {
    try {
      const newCategoryName = prompt("Anna uuden luokan nimi:");
      if (newCategoryName) {
        const imageFiles = await selectImageFiles();
        if (imageFiles.length === 0) {
          alert("Lataa vähintään yksi kuva.");
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

        alert("Kategoria lisätty onnistuneesti!");
      }
    } catch (error) {
      console.error("Virhe luokan lisäämisessä:", error);
      alert("Luokkaa lisättäessä tapahtui virhe.");
    }
  };

  const handleDeleteCategory = async (category) => {
    const MAX_RETRIES = 3;
    let retryCount = 0;

    const deleteImagesFolderWithRetry = async (imagesFolderRef) => {
      try {
        await imagesFolderRef.delete();
      } catch (error) {
        console.error(`Virhe luokkakansion poistamisessa: ${error.message}`);

        if (retryCount < MAX_RETRIES) {
          console.log(`Poistoyritystä yritetään uudelleen ${retryCount + 1}`);
          retryCount++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await deleteImagesFolderWithRetry(imagesFolderRef);
        } else {
          console.error(
            `Uudelleenyritysten enimmäismäärä (${MAX_RETRIES}) saavutettu. Luokan poistaminen epäonnistui.`,
          );
          throw error;
        }
      }
    };

    try {
      if (
        window.confirm(
          `Haluatko varmasti poistaa luokan "${category.title}"? Tämä toiminto poistaa myös kaikki liittyvät kuvat.`,
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
                `Virhe kuvan poistamisessa ${imageRef.name}: ${error.message}`,
              );
              throw error;
            }
          }),
        );

        await deleteImagesFolderWithRetry(imagesFolderRef);

        alert("Luokka ja siihen liittyvät kuvat poistettu onnistuneesti!");
      }
    } catch (error) {
      console.error("Virhe luokan poistamisessa:", error);
      //alert("Luokkaa poistettaessa tapahtui virhe.");
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
      console.log("Alakokoelma poistettu onnistuneesti!");
    } catch (error) {
      console.error("Virhe alikokoelman poistamisessa:", error);
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
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;

      input.onchange = (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
          reject(new Error("Ei valittuja tiedostoja."));
        } else {
          resolve(Array.from(files));
        }
      };

      input.click();
    });
  };
  const updateCategoryImageOrder = async (categoryId, imageOrder) => {
    try {
      await firestore.collection("categoryImagesOrder").doc(categoryId).set({
        order: imageOrder,
      });
    } catch (error) {
      console.error("Error updating category image order:", error);
      throw error;
    }
  };
  const updateCategoryOrder = async (newOrder) => {
    try {
      await firestore
        .collection("categoryOrder")
        .doc("orderremontit")
        .set({ order: newOrder });
      console.log("Luokkajärjestyksen päivitys onnistui!");
    } catch (error) {
      console.error("Virhe luokkajärjestyksen päivityksessä:", error);
      throw error;
    }
  };

  const addCategoryToFirestore = async (categoryName) => {
    try {
      const docRef = await firestore
        .collection("remontitcategories")
        .add({ text: categoryName });
      console.log("Kategoria lisätty Firestoreen onnistuneesti!");
      return docRef.id;
    } catch (error) {
      console.error("Virhe lisättäessä luokkaa Firestoreen:", error);
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
        `Kuva ${imageFile.name} luokkaan ${categoryId} tallennus onnistui.`,
      );
    } catch (error) {
      console.error(
        `Virhe kuvan lataamisessa ${imageFile.name} varastoon:`,
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
        `Kuva ${imageId} luokan poistaminen tallennustilasta onnistui ${categoryId}.`,
      );
    } catch (error) {
      console.error(`Virhe kuvan poistamisessa ${imageId} varastosta:`, error);
      throw error;
    }
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
            .collection("remontitcategories")
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

  const handleDrop = async (e, categoryId, newIndex) => {
    e.preventDefault();
    const draggedCategoryId = e.dataTransfer.getData("categoryId");
    const draggedIndex = parseInt(e.dataTransfer.getData("index"));

    if (draggedCategoryId === categoryId && draggedIndex !== newIndex) {
      setCategories((prevCategories) => {
        const updatedCategories = prevCategories.map((category) => {
          if (category.id === categoryId) {
            const updatedItems = Array.from(category.items);
            const [draggedItem] = updatedItems.splice(draggedIndex, 1);
            updatedItems.splice(newIndex, 0, draggedItem);
            return { ...category, items: updatedItems };
          }
          return category;
        });

        // Update the order in Firestore
        const updatedOrder = updatedCategories.map((category) => category.id);
        updateCategoryOrder(updatedOrder);

        // Update image order within the category
        const imageOrder = updatedCategories
          .find((category) => category.id === categoryId)
          .items.map((item) => item.id);
        updateCategoryImageOrder(categoryId, imageOrder);

        return updatedCategories;
      });
    }
  };
  const handleDragStart = (e, categoryId, index) => {
    e.dataTransfer.setData("categoryId", categoryId);
    e.dataTransfer.setData("index", index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
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
                {category.items.map(
                  (
                    item,
                    index, // Add index parameter to map function
                  ) => (
                    <div
                      key={item.id}
                      className="category-editing-item"
                      draggable
                      onDragStart={(e) =>
                        handleDragStart(e, category.id, index)
                      }
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, category.id, index)}
                    >
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
                  ),
                )}
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
