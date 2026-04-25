import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB2qU_rP_SRsjiA31e4oWoWB-HCsxvXAys",
  authDomain: "barbur-poker.firebaseapp.com",
  projectId: "barbur-poker",
  storageBucket: "barbur-poker.firebasestorage.app",
  messagingSenderId: "233472709878",
  appId: "1:233472709878:web:f6b9fed6d53c3dd28848d7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// אחסון משותף - תואם API של window.storage
export const loadState = async (key) => {
  try {
    const docRef = doc(db, 'app_data', key);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.value ? JSON.parse(data.value) : null;
    }
    return null;
  } catch (e) {
    console.error('Firebase load failed:', e);
    return null;
  }
};

export const saveState = async (state, key) => {
  try {
    const docRef = doc(db, 'app_data', key);
    await setDoc(docRef, { value: JSON.stringify(state), updatedAt: new Date().toISOString() });
    return true;
  } catch (e) {
    console.error('Firebase save failed:', e);
    return false;
  }
};
