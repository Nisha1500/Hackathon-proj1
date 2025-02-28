# 🔔 IoT-Based Security Alert System  

A Progressive Web App (PWA) designed for **hearing-impaired individuals**, providing real-time security alerts through **vibrations and notifications** when predefined words (like users name or words like help , run, alert are heard by the system) and unusual sounds (like glass breaking or door smashing) are detected.  

---

## 🚀 Features  
✅ **Real-time sound detection** using Web Speech API  
✅ **Push notifications & vibrations** for alerts  
✅ **User-configurable trigger words** stored in Firebase  
✅ **PWA support** – installable on mobile & desktop  
✅ **Activity log dashboard** to monitor alerts  // work in progress for dashboard.

---

## 🛠️ Technologies Used  
- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Firebase (Firestore, Hosting)  
- **APIs:** Web Speech API  
- **Other:** Service Workers, PWA ,speech worker   

---
How It Works
1️⃣ The app listens for predefined trigger words or sounds.
2️⃣ Once detected, it sends a push notification and vibrates the device.
3️⃣ Users can configure which sounds trigger an alert.
4️⃣ A dashboard logs all detected alerts for review. 

---
Run the project:

npm start  # (If applicable, else open index.html in a browser) 

---
In future additions :

1 ML model to detect sounds like glass breaking , dog barking.
2 dashboard for the logs 
3 a complete native app for better background functionality.


