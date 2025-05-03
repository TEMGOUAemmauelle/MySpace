import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import projects from "./src/data/projects.js";

const firebaseConfig = {
  apiKey: "AIzaSyDeabdkF4I-djHSXdRnlfQBiRf03U1ZNlI",
  authDomain: "portofolio-bbc74.firebaseapp.com",
  projectId: "portofolio-bbc74",
  storageBucket: "portofolio-bbc74.firebasestorage.app",
  messagingSenderId: "552145882009",
  appId: "1:552145882009:web:d4303af1c18d567b15e108",
  measurementId: "G-MYNJL7YDVW"
};

async function uploadProjects() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log("Vérification de la collection...");

    // Vérifie si la collection contient déjà au moins un document
    const projetsSnapshot = await getDocs(collection(db, "projects"));
    if (projetsSnapshot.empty) {
      console.log("❌ La collection 'projets' n'existe pas encore ou est vide. Aucun upload effectué.");
      return;
    }

    console.log("Collection détectée. Début de l'upload conditionnel...");

    for (const project of projects) {
      const projectRef = doc(db, "projects", project.id);
      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists()) {
        await setDoc(projectRef, {
          Title: project.Title,
          Description: project.Description,
          Features: project.Features,
          Github: project.Github || null,
          Link: project.Link || null,
          Img: project.Img,
          TechStack: project.TechStack,
          createdAt: new Date()
        });
        console.log(`✅ ${project.id} créé`);
      } else {
        console.log(`⚠️ ${project.id} existe déjà, non modifié`);
      }
    }

    console.log("Upload terminé !");
  } catch (error) {
    console.error("Erreur lors de l'upload :", error);
    process.exit(1);
  }
}

uploadProjects();
