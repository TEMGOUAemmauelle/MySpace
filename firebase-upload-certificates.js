import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import certificates from "./src/data/certificates.js";

const firebaseConfig = {
  apiKey: "AIzaSyDeabdkF4I-djHSXdRnlfQBiRf03U1ZNlI",
  authDomain: "portofolio-bbc74.firebaseapp.com",
  projectId: "portofolio-bbc74",
  storageBucket: "portofolio-bbc74.firebasestorage.app",
  messagingSenderId: "552145882009",
  appId: "1:552145882009:web:d4303af1c18d567b15e108",
  measurementId: "G-MYNJL7YDVW"
};

async function uploadCertificates() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log("📁 Début de l'upload des certificats...");

    for (const cert of certificates) {
      await setDoc(doc(db, "certificates", cert.id), {
        title: cert.title  || null,
        issuer: cert.issuer  || null,
        date: cert.date,
        ImgSertif: cert.ImgSertif,
        credentialId: cert.credentialId || null,
        createdAt: new Date()
      });
      console.log(`✅ Certificat ${cert.id} uploadé`);
    }

    console.log("🎉 Tous les certificats ont été uploadés avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de l'upload :", error);
    process.exit(1);
  }
}

uploadCertificates();
