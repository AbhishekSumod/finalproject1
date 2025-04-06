import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebaseConfig";

// Add User Data to Firestore
export const addUserData = async (userId, data) => {
  try {
    await addDoc(collection(db, "users"), { userId, ...data });
    console.log("Data added successfully!");
  } catch (error) {
    console.error("Error adding data:", error.message);
  }
};

// Fetch Users Data from Firestore
export const getUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error("Error fetching users:", error.message);
    throw error;
  }
};
