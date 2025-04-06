import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

// Sign Up Function
export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("User Signed Up:", userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Signup Error:", error.message);
    throw error;
  }
};

// Login Function
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("User Logged In:", userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Login Error:", error.message);
    throw error;
  }
};

// Logout Function
export const logout = async () => {
  try {
    await signOut(auth);
    console.log("User Logged Out");
  } catch (error) {
    console.error("Logout Error:", error.message);
  }
};

// Save analysis results to Firestore
export const saveAnalysis = async (grammarMistakes, fillerWords, sentiment) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not logged in");

    await addDoc(collection(db, "analysis"), {
      userId: user.uid,
      grammarMistakes,
      fillerWords,
      sentiment,
      timestamp: new Date(),
    });

    console.log("Analysis saved successfully!");
  } catch (error) {
    console.error("Error saving analysis:", error.message);
  }
};

// Fetch analysis history for logged-in user
export const getAnalysisHistory = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not logged in");

    const q = query(
      collection(db, "analysis"),
      where("userId", "==", user.uid)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching history:", error.message);
    return [];
  }
};
