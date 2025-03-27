// main.js file

console.log("🔥 main.js is running!");

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { firebaseConfig, firebaseCredentials } from '/firebase-config.js';


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("✅ Firebase initialized:", app);
console.log("✅ Firestore initialized:", db);

const triggerWordsRef = collection(db, "triggerwords");

async function authenticateFirebase() {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      firebaseCredentials.email, 
      firebaseCredentials.password
    );
    console.log("✅ Firebase Authentication Successful:", userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error("❌ Firebase Authentication Error:", error);
    throw error;
    
  }
}

async function testFirestore() {
  try {
    await authenticateFirebase();
    const querySnapshot = await getDocs(collection(db, "triggerwords"));
    if (querySnapshot.empty) {
      console.warn("⚠️ No documents found in 'triggerwords' collection.");
    } else {
      console.log(
        "🔥 Firestore connected! Found documents:",
        querySnapshot.docs.map((doc) => doc.data())
      );
    }
  } catch (error) {
    console.error("❌ Firestore connection failed:", error);
  }
}

// Improved function to load trigger words
async function loadTriggerWords() {
  try {
    await authenticateFirebase();

    const querySnapshot = await getDocs(triggerWordsRef);
    let allWords = [];

    querySnapshot.forEach(doc => {
      const wordsFromDoc = doc.data().words || [];
      allWords = allWords.concat(wordsFromDoc);
    });

    // Enhanced word processing: remove duplicates, null, empty strings, and trim
    const uniqueWords = [...new Set(
      allWords
        .filter(word => word && word.trim() !== '')
        .map(word => word.trim().toLowerCase())
    )].sort(); // Added sorting for consistent display

    console.log("🔥 Loaded unique trigger words from Firestore:", uniqueWords);

    // Update input field and localStorage
    document.getElementById("trigger-words").value = uniqueWords.join(", ");
    localStorage.setItem("savedTriggerWords", JSON.stringify(uniqueWords));

    // Update the saved words display
    updateSavedWordsDisplay(uniqueWords);

    return uniqueWords;
  } catch (error) {
    console.error("❌ Error loading trigger words:", error);
    return [];
  }
}

// Improved function to save trigger words
async function saveTriggerWords() {
  try {
    await authenticateFirebase();

    const input = document.getElementById("trigger-words").value.trim();
    if (!input) {
      alert("Please enter trigger words!");
      return;
    }

    // Enhanced word processing: remove duplicates, trim, remove empty strings, sort
    const wordsArray = [...new Set(
      input.split(",")
        .map(word => word.trim().toLowerCase())
        .filter(word => word.length > 0)
    )].sort();

    const querySnapshot = await getDocs(triggerWordsRef);
    if (!querySnapshot.empty) {
      // Update existing document
      const docRef = doc(db, "triggerwords", querySnapshot.docs[0].id);
      await setDoc(docRef, { words: wordsArray }, { merge: true });
      console.log("✅ Trigger words updated in Firestore:", wordsArray);
    } else {
      // Create a new document if none exist
      await addDoc(triggerWordsRef, { words: wordsArray });
      console.log("✅ New trigger words document created:", wordsArray);
    }

    alert("Trigger words saved!");
    updateSavedWordsDisplay(wordsArray);
    
    // Update local storage
    localStorage.setItem("savedTriggerWords", JSON.stringify(wordsArray));
    
    // Reload words after saving
    await loadTriggerWords();
  } catch (error) {
    console.error("❌ Error saving trigger words:", error);
    alert("Failed to save words. Please try again.");
  }
}

// Enhanced function to update saved words display
function updateSavedWordsDisplay(words) {
  const savedWordsList = document.getElementById("saved-words-list");
  if (savedWordsList) {
    // Remove all existing content
    savedWordsList.innerHTML = "";
    
    // If no words, show a placeholder
    if (words.length === 0) {
      const placeholder = document.createElement("div");
      placeholder.className = "placeholder";
      placeholder.textContent = "No trigger words saved";
      savedWordsList.appendChild(placeholder);
      return;
    }
    
    // Create elements for each unique word with a delete button
    words.forEach(word => {
      const wordContainer = document.createElement("div");
      wordContainer.className = "saved-word-container";
      
      const wordElement = document.createElement("span");
      wordElement.className = "saved-word";
      wordElement.textContent = word;
      
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "❌";
      deleteButton.className = "delete-word-btn";
      deleteButton.addEventListener("click", () => deleteWord(word));
      
      wordContainer.appendChild(wordElement);
      wordContainer.appendChild(deleteButton);
      
      savedWordsList.appendChild(wordContainer);
    });
  }
}

// Improved function to delete a specific word
async function deleteWord(wordToDelete) {
  try {
    await authenticateFirebase();

    // Get the current saved words from localStorage
    const savedWords = JSON.parse(localStorage.getItem("savedTriggerWords") || "[]");
    
    // Filter out the word to delete and remove duplicates
    const updatedWords = [...new Set(
      savedWords.filter(word => word !== wordToDelete)
    )].sort();
    
    // Update localStorage
    localStorage.setItem("savedTriggerWords", JSON.stringify(updatedWords));
    
    // Update Firestore
    const querySnapshot = await getDocs(triggerWordsRef);
    if (!querySnapshot.empty) {
      const docRef = doc(db, "triggerwords", querySnapshot.docs[0].id);
      await setDoc(docRef, { words: updatedWords }, { merge: true });
      
      console.log("✅ Word deleted:", wordToDelete);
      
      // Reload trigger words and update display
      await loadTriggerWords();
    }
  } catch (error) {
    console.error("❌ Error deleting word:", error);
    alert("Failed to delete word. Please try again.");
  }
}

// Ensure DOM is loaded before attaching events
document.addEventListener("DOMContentLoaded", () => {
  // Event listener for Save Words button
  const saveButton = document.getElementById("save-trigger-words");
  if (saveButton) {
    saveButton.addEventListener("click", saveTriggerWords);
  }
  
  // Run Firestore fetch on app start
  testFirestore();
  loadTriggerWords();
});

// Export Firestore instance for use in other files
export { db };

console.log("✅ Script successfully loaded!");