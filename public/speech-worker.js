// ✅ Handle messages from main.js
self.onmessage = function (e) {
    if (e.data === "start") {
        startRecognition();
    } else if (e.data === "stop") {
        stopRecognition();
    } else if (e.data.type === "setTriggerWords") {
        triggerWords = e.data.words || []; // Ensure it's an array
        self.postMessage({ type: "log", message: `🔥 Trigger words updated in Worker: ${JSON.stringify(triggerWords)}` });
    }
};

// ✅ Variables
let recognition;
let triggerWords = []; // Store trigger words from Firestore
let isListening = false; // Flag to control continuous listening

// ✅ Check if spoken text matches trigger words
function checkTriggerWords(spokenText) {
    const spokenLower = spokenText.toLowerCase();
    for (const word of triggerWords) {
        if (spokenLower.includes(word)) {
            self.postMessage({ type: "trigger", word: word });
            return;
        }
    }
}

// ✅ Start speech recognition
function startRecognition() {
    if (!recognition) {
        recognition = new (self.SpeechRecognition || self.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = false;
    }

    isListening = true; // ✅ Set flag to keep listening

    recognition.onresult = function (event) {
        const lastResult = event.results[event.results.length - 1][0].transcript.trim();
        self.postMessage({ type: "result", text: lastResult });

        // ✅ Check trigger words
        checkTriggerWords(lastResult);
    };

    recognition.onerror = function (event) {
        self.postMessage({ type: "error", error: event.error });
    };

    recognition.onend = function () {
        if (isListening) {
            console.log("🔥 Restarting speech recognition...");
            recognition.start(); // ✅ Auto-restart unless stopped manually
        } else {
            self.postMessage({ type: "stopped" });
        }
    };

    recognition.start();
    self.postMessage({ type: "started" });
}

// ✅ Stop speech recognition
function stopRecognition() {
    if (recognition) {
        isListening = false; // ✅ Prevent auto-restart
        recognition.stop();
        self.postMessage({ type: "stopped" });
    }
}

