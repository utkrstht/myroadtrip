// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyCxY8rScLpfcdZ7ZfGsEm7AemuOrQTWps4",
  authDomain: "bookings-bucket.firebaseapp.com",
  projectId: "bookings-bucket",
  storageBucket: "bookings-bucket.firebasestorage.app",
  messagingSenderId: "798342782227",
  appId: "1:798342782227:web:3166f11d96e48de941cee6",
  measurementId: "G-SL66SGJR9V"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export { auth };

export default app;