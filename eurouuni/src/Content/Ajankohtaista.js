import React, { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import firebaseConfig from '../firebaseConfig';
import { useLocation } from 'react-router-dom';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Ajankohtaista = () => {
  const [content1, setContent1] = useState('');
  const [content2, setContent2] = useState('');
  const [content3, setContent3] = useState('');
  const [content4, setContent4] = useState('');
  const [content5, setContent5] = useState('');
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const doc1 = await getDoc(doc(db, 'ajankohtaista', 'ajankohtaista1'));
        const doc2 = await getDoc(doc(db, 'ajankohtaista', 'ajankohtaista2'));
        const doc3 = await getDoc(doc(db, 'ajankohtaista', 'ajankohtaista3'));
        const doc4 = await getDoc(doc(db, 'ajankohtaista', 'ajankohtaista4'));
        const doc5 = await getDoc(doc(db, 'ajankohtaista', 'ajankohtaista5'));

        if (doc1.exists()) {
          setContent1(doc1.data().text || '');
        }

        if (doc2.exists()) {
          setContent2(doc2.data().text || '');
        }

        if (doc3.exists()) {
          setContent3(doc3.data().text || '');
        }

        if (doc4.exists()) {
          setContent4(doc4.data().text || '');
        }

        if (doc5.exists()) {
          setContent5(doc5.data().text || '');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    setUser({ isAdmin: true });
  }, []);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'ajankohtaista', 'ajankohtaista1'), {
        text: content1,
      });
      await updateDoc(doc(db, 'ajankohtaista', 'ajankohtaista2'), {
        text: content2,
      });
      await updateDoc(doc(db, 'ajankohtaista', 'ajankohtaista3'), {
        text: content3,
      });
      await updateDoc(doc(db, 'ajankohtaista', 'ajankohtaista4'), {
        text: content4,
      });
      await updateDoc(doc(db, 'ajankohtaista', 'ajankohtaista5'), {
        text: content5,
      });
      setEditing(false);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-body">
          <h4 className="card-title">Ajankohtaista</h4>
          {/* Render edit button based on editing state and user role */}
          {user?.isAdmin && location.pathname === '/admin' && (
            <button className="edit-button" onClick={editing ? handleSave : handleEdit}>
              {editing ? 'Save' : 'Edit'}
            </button>
          )}

          {/* Render content based on editing state */}
          <div className="content">
            {editing ? (
              <>
                <textarea
                  value={content1}
                  onChange={(e) => setContent1(e.target.value)}
                  className="edit-input"
                />
                <textarea
                  value={content2}
                  onChange={(e) => setContent2(e.target.value)}
                  className="edit-input"
                />
                <textarea
                  value={content3}
                  onChange={(e) => setContent3(e.target.value)}
                  className="edit-input"
                />
                <textarea
                  value={content4}
                  onChange={(e) => setContent4(e.target.value)}
                  className="edit-input"
                />
                <textarea
                  value={content5}
                  onChange={(e) => setContent5(e.target.value)}
                  className="edit-input"
                />
              </>
            ) : (
              <>
                <p>{content1}</p>
                <p>{content2}</p>
                <p>{content3}</p>
                <p>{content4}</p>
                <p>{content5}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ajankohtaista;
