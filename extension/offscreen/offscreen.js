// ============================================================
// Echo Extension — Offscreen Document
// Lives in a hidden page so it can use getUserMedia / MediaRecorder.
//
// Flow:
//   background.js  →  START_RECORDING  →  offscreen.js
//                                           ↓
//                                    MediaRecorder records tab audio
//                                           ↓ every 5 seconds
//                   AUDIO_CHUNK (base64)  →  background.js
//                                           ↓
//                                        WebSocket → Backend
// ============================================================

let mediaRecorder = null;
let audioStream   = null;
let currentMeetingId = null;

const CHUNK_INTERVAL_MS = 5000;   // send a chunk every 5 seconds

// ── Message listener ──────────────────────────────────────────
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

    if (message.type === 'START_RECORDING') {
        await startRecording(message.streamId, message.meetingId);
        sendResponse({ ok: true });
    }

    if (message.type === 'STOP_RECORDING') {
        stopRecording();
        sendResponse({ ok: true });
    }

    return true;
});

// ── Start recording ───────────────────────────────────────────
async function startRecording(streamId, meetingId) {

    console.log('[Offscreen] Starting audio recording for meeting:', meetingId);

    currentMeetingId = meetingId;

    // Capture the tab audio via the stream ID provided by background.js
    audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
            mandatory: {
                chromeMediaSource:   'tab',
                chromeMediaSourceId: streamId
            }
        },
        video: false
    });

    // Pick best supported MIME type
    const mimeType = getSupportedMimeType();
    console.log('[Offscreen] Using MIME type:', mimeType);

    mediaRecorder = new MediaRecorder(audioStream, { mimeType });

    // Each time a chunk is ready → convert to base64 → send to background
    mediaRecorder.ondataavailable = async (event) => {

        if (event.data.size === 0) return;

        console.log('[Offscreen] Audio chunk:', event.data.size, 'bytes');

        const base64 = await blobToBase64(event.data);

        chrome.runtime.sendMessage({
            type:     'AUDIO_CHUNK',
            chunk:    base64,
            mimeType: mimeType
        });
    };

    mediaRecorder.onerror = (err) => {
        console.error('[Offscreen] MediaRecorder error:', err);
    };

    // Start recording; fire ondataavailable every CHUNK_INTERVAL_MS
    mediaRecorder.start(CHUNK_INTERVAL_MS);

    console.log('[Offscreen] Recording started');
}

// ── Stop recording ────────────────────────────────────────────
function stopRecording() {

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    mediaRecorder = null;

    if (audioStream) {
        audioStream.getTracks().forEach(t => t.stop());
        audioStream = null;
    }

    currentMeetingId = null;
    console.log('[Offscreen] Recording stopped');
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Convert a Blob to a base64 data string (without the data: prefix).
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // result is "data:<mimeType>;base64,<data>"
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Return the best supported audio MIME type for this browser.
 * Prefer WebM/Opus (best quality for speech), fallback to others.
 */
function getSupportedMimeType() {
    const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
    ];
    for (const type of candidates) {
        if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';   // let browser choose
}