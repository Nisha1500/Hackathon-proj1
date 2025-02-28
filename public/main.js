import dotenv from 'dotenv';
dotenv.config();

// ✅ Import Firebase SDK at the top!
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

console.log("🔥 main.js is running!");

// ✅ Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};


// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("✅ Firebase initialized:", app);
console.log("✅ Firestore initialized:", db);

// ✅ Firestore Reference
const triggerWordsRef = collection(db, "triggerwords");

// ✅ Web Worker Setup (BEFORE loading trigger words)
let speechWorker = null; // Declare speechWorker globally

if (window.Worker) {
  speechWorker = new Worker("speechWorker.js");

  // ✅ Handle messages from the worker
  speechWorker.onmessage = function (event) {
    if (event.data.type === "result") {
      console.log("Recognized Speech:", event.data.text);
    } else if (event.data.type === "trigger") {
      console.log("🚨 Trigger word detected:", event.data.word);
      
      // ✅ Send push notification through the service worker
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification("Speech Alert", {
            body: `Trigger word detected: "${event.data.word}"`,
            icon: "/img/ikon-pwa.png",
            vibrate: [200, 100, 200]
          });
        });
      }

      triggerVibration();
    } else if (event.data.type === "error") {
      console.error("Speech Recognition Error:", event.data.error);
    } else if (event.data.type === "stopped") {
      console.log("Speech recognition stopped.");
    } else if (event.data.type === "log") {
      console.log(event.data.message);
    }
  };
}

// ✅ Ensure startListening is globally available
function startListening() {
  if (speechWorker) {
    speechWorker.postMessage("start");
    console.log("🎙️ Speech recognition started.");
  } else {
    console.error("❌ Speech worker not initialized!");
  }
}


// ✅ Ensure stopListening is globally available now 
function stopListening() {
  if (speechWorker) {
    speechWorker.postMessage("stop");
  } else {
    console.error("❌ Speech worker not initialized!");
  }
}

// ✅ Function to load trigger words from Firestore
async function loadTriggerWords() {
  try {
    const querySnapshot = await getDocs(triggerWordsRef);
    let allWords = [];

    querySnapshot.forEach(doc => {
      allWords = allWords.concat(doc.data().words);
    });

    console.log("🔥 Loaded trigger words from Firestore:", allWords);

    if (speechWorker) {
      speechWorker.postMessage({ type: "setTriggerWords", words: allWords });

      // ✅ Start listening after trigger words are set
      console.log("🎙️ Starting speech recognition...");
      startListening();
    }
  } catch (error) {
    console.error("❌ Error loading trigger words:", error);
  }
}

// ✅ Function to save trigger words to Firestore
async function saveTriggerWords() {
  const input = document.getElementById("trigger-words").value.trim();
  if (!input) {
    alert("Please enter trigger words!");
    return;
  }

  const wordsArray = input.split(",").map(word => word.trim().toLowerCase());

  try {
    const querySnapshot = await getDocs(triggerWordsRef);
    if (!querySnapshot.empty) {
      // ✅ Get the first document in the collection
      const docRef = doc(db, "triggerwords", querySnapshot.docs[0].id);
      await setDoc(docRef, { words: wordsArray }, { merge: true }); // ✅ Use setDoc with merge
      console.log("✅ Trigger words updated in Firestore:", wordsArray);
    } else {
      // ✅ Create a new document if none exist
      await addDoc(triggerWordsRef, { words: wordsArray });
      console.log("✅ New trigger words document created:", wordsArray);
    }

    alert("Trigger words saved!");
    loadTriggerWords(); // ✅ Reload words after saving
  } catch (error) {
    console.error("❌ Error saving trigger words:", error);
  }
}

// ✅ Function to handle device vibration
function triggerVibration() {
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
    console.log("📳 Device vibrated.");
  } else {
    console.warn("⚠️ Vibration not supported on this device.");
  }
}

// ✅ Test Firestore connection
async function testFirestore() {
  try {
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

// ✅ Run Firestore fetch on app start
testFirestore();
loadTriggerWords(); // ✅ Now safe to call after worker setup

// ✅ Export Firestore instance for use in other files
export { db };

// ✅ Event listener for Save Words button
document.getElementById("save-trigger-words").addEventListener("click", saveTriggerWords);

console.log("✅ Script successfully loaded!");

// ✅ Register Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(reg => {
      console.log("✅ Service Worker registered:", reg);
    })
    .catch(error => {
      console.error("❌ Service Worker registration failed:", error);
    });
}
