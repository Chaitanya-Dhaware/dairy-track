import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBYyNxnMjOnVMz-OvmWMcHFESrm7GoL8_I",
  authDomain: "dairy-track-1d02d.firebaseapp.com",
  projectId: "dairy-track-1d02d",
  storageBucket: "dairy-track-1d02d.firebasestorage.app",
  messagingSenderId: "523208666043",
  appId: "1:523208666043:web:f320be327ebc054a5e729e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function setup() {
  try {
    console.log("Setting up Admin...");
    const adminCredential = await createUserWithEmailAndPassword(auth, "admin@dairytrack.com", "password123");
    await setDoc(doc(db, "users", adminCredential.user.uid), {
      name: "Admin User",
      email: "admin@dairytrack.com",
      role: "admin"
    });
    console.log("Admin created.");
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
        console.log("Admin already exists.");
    } else {
        console.error("Admin error:", err);
    }
  }

  try {
    console.log("Setting up Staff...");
    const staffCredential = await createUserWithEmailAndPassword(auth, "staff@dairytrack.com", "password123");
    await setDoc(doc(db, "users", staffCredential.user.uid), {
      name: "Staff User",
      email: "staff@dairytrack.com",
      role: "staff"
    });
    console.log("Staff created.");
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
        console.log("Staff already exists.");
    } else {
        console.error("Staff error:", err);
    }
  }
  process.exit(0);
}

setup();
