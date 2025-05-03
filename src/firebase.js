// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore"
// import { collection, addDoc, getDocs } from "@firebase/firestore"; // Perbarui ini


// // Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyB-lfUt1adpQ0KYcFFW_oAWTJVfHDOOZy8",
//   authDomain: "portofolio-web-3e8e8.firebaseapp.com",
//   projectId: "portofolio-web-3e8e8",
//   storageBucket: "portofolio-web-3e8e8.appspot.com",
//   messagingSenderId: "25195509306",
//   appId: "1:25195509306:web:2b635dcf997137bf612703"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

// export { db, collection, addDoc };

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Perbarui ini
import { collection, addDoc, getDocs } from "@firebase/firestore"; // Perbarui ini

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDeabdkF4I-djHSXdRnlfQBiRf03U1ZNlI",
  authDomain: "portofolio-bbc74.firebaseapp.com",
  projectId: "portofolio-bbc74",
  storageBucket: "portofolio-bbc74.firebasestorage.app",
  messagingSenderId: "552145882009",
  appId: "1:552145882009:web:d4303af1c18d567b15e108",
  measurementId: "G-MYNJL7YDVW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const analytics = getAnalytics(app);


export { db, collection, addDoc };