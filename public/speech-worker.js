// speechWorker.js

// ✅ Variables
let recognition;
let triggerWords = []; // Store trigger words from Firestore
let isListening = false; // Flag to control continuous listening
let spokenContext = "";  // Store the full context of spoken text

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

// ✅ Check if spoken text matches trigger words
function checkTriggerWords(spokenText) {
    const spokenLower = spokenText.toLowerCase();
    
    for (const word of triggerWords) {
        if (word && word.trim() !== "" && spokenLower.includes(word.trim())) {
            self.postMessage({ 
                type: "trigger", 
                word: word,
                text: spokenText  // Send the full spoken context
            });
            return true;
        }
    }
    return false;
}

// ✅ Start speech recognition
function startRecognition() {
    try {
        if (!recognition) {
            recognition = new (self.SpeechRecognition || self.webkitSpeechRecognition)();
            
            if (!recognition) {
                self.postMessage({ 
                    type: "error", 
                    error: "Speech recognition not supported in this environment" 
                });
                return;
            }
            
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = "en-US";
        }

        isListening = true; // ✅ Set flag to keep listening

        recognition.onresult = function (event) {
            try {
                const lastResult = event.results[event.results.length - 1][0].transcript.trim();
                spokenContext = lastResult;
                self.postMessage({ type: "result", text: lastResult });

                // ✅ Check trigger words
                checkTriggerWords(lastResult);
            } catch (err) {
                self.postMessage({ 
                    type: "error", 
                    error: "Error processing speech results: " + err.message 
                });
            }
        };

        recognition.onerror = function (event) {
            self.postMessage({ type: "error", error: event.error });
            
            // Try to restart if it was a temporary error
            if (event.error === 'network' || event.error === 'aborted') {
                setTimeout(() => {
                    if (isListening) {
                        try {
                            recognition.start();
                        } catch (e) {
                            self.postMessage({ 
                                type: "error", 
                                error: "Failed to restart after error: " + e.message 
                            });
                        }
                    }
                }, 1000);
            }
        };

        recognition.onend = function () {
            if (isListening) {
                try {
                    recognition.start(); // ✅ Auto-restart unless stopped manually
                    self.postMessage({ type: "log", message: "🔄 Speech recognition restarted automatically" });
                } catch (err) {
                    self.postMessage({ 
                        type: "error", 
                        error: "Error restarting speech recognition: " + err.message 
                    });
                    
                    // Try again after a delay
                    setTimeout(() => {
                        if (isListening) {
                            try {
                                recognition.start();
                            } catch (e) {
                                isListening = false;
                                self.postMessage({ 
                                    type: "error", 
                                    error: "Failed to restart after multiple attempts. Please refresh the page." 
                                });
                            }
                        }
                    }, 2000);
                }
            } else {
                self.postMessage({ type: "stopped" });
            }
        };

        recognition.start();
        self.postMessage({ type: "started" });
    } catch (err) {
        self.postMessage({ 
            type: "error", 
            error: "Failed to initialize speech recognition: " + err.message 
        });
    }
}

// ✅ Stop speech recognition
function stopRecognition() {
    if (recognition) {
        isListening = false; // ✅ Prevent auto-restart
        try {
            recognition.stop();
            self.postMessage({ type: "stopped" });
        } catch (err) {
            self.postMessage({ 
                type: "error", 
                error: "Error stopping speech recognition: " + err.message 
            });
        }
    }
}