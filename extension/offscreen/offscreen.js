// ============================================================
// Echo Extension — Offscreen Document
//
// Key design decisions:
//  1. Audio passthrough: captured stream is reconnected to
//     AudioContext so the user can still hear the call.
//  2. Zero-gap chunking: the NEXT recorder is started BEFORE
//     async processing of the current chunk, so no audio is
//     ever dropped between intervals.
//  3. Each chunk is a self-contained WebM (fresh MediaRecorder)
//     so FFmpeg / Groq can decode every blob independently.
// ============================================================

let activeStream     = null;   // the MediaStream from tabCapture
let audioContext     = null;   // passthrough to speakers
let isRecording      = false;  // guards against double-starts / stale callbacks
let currentRecorder  = null;   // reference to the in-flight MediaRecorder

const CHUNK_INTERVAL_MS = 10000;  // 10s chunks — longer = fewer gaps, more context

// ── Message listener ──────────────────────────────────────────
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

    if (message.type === 'START_RECORDING') {
        await startRecording(message.streamId, message.meetingId);
        sendResponse({ ok: true });
    }

    if (message.type === 'STOP_RECORDING') {
        await stopRecording();
        sendResponse({ ok: true });
    }

    return true;
});

// ── Start recording ───────────────────────────────────────────
async function startRecording(streamId, meetingId) {

    if (isRecording) return;
    console.log('[Offscreen] Starting for meeting:', meetingId);

    activeStream = await navigator.mediaDevices.getUserMedia({
        audio: {
            mandatory: {
                chromeMediaSource:   'tab',
                chromeMediaSourceId: streamId,
            },
            optional: [
                { echoCancellation: false },
                { noiseSuppression: false },
                { autoGainControl: false }
            ]
        },
        video: false,
    });

    // ── Passthrough: reconnect captured stream to speakers ────
    audioContext = new AudioContext();
    const src = audioContext.createMediaStreamSource(activeStream);
    src.connect(audioContext.destination);

    const mimeType = getSupportedMimeType();
    console.log('[Offscreen] MIME type:', mimeType);

    isRecording = true;
    scheduleChunk(mimeType);
    console.log('[Offscreen] Recording started — audio still audible');
}

// ── Zero-gap chunk scheduler ──────────────────────────────────
function scheduleChunk(mimeType) {

    if (!isRecording || !activeStream || !activeStream.active) return;

    const recorder  = new MediaRecorder(activeStream, { mimeType });
    const parts     = [];
    currentRecorder = recorder;   // expose for graceful stop

    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) parts.push(e.data);
    };

    recorder.onstop = async () => {
        // ① If still recording, arm the next chunk immediately (zero gap)
        if (isRecording) scheduleChunk(mimeType);

        // ② Process and send this chunk's audio
        if (parts.length === 0) {
            if (recorder._resolveStop) recorder._resolveStop();
            return;
        }
        
        const blob = new Blob(parts, { type: mimeType });
        console.log('[Offscreen] Chunk ready:', blob.size, 'bytes');

        const base64 = await blobToBase64(blob);
        chrome.runtime.sendMessage({
            type:     'AUDIO_CHUNK',
            chunk:    base64,
            mimeType: mimeType,
        }, () => {
            // Unblock stopRecording ONLY AFTER background receives the chunk
            if (recorder._resolveStop) recorder._resolveStop();
        });
    };

    recorder.onerror = (err) => {
        console.error('[Offscreen] MediaRecorder error:', err);
    };

    recorder.start();

    // Stop after interval → triggers onstop → schedules next chunk
    setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
    }, CHUNK_INTERVAL_MS);
}

// ── Stop recording ────────────────────────────────────────────
// Stops the current recorder gracefully so the final partial chunk
// is flushed and sent BEFORE the stream tracks are destroyed.
function stopRecording() {
    return new Promise((resolve) => {

        isRecording = false;  // prevents scheduleChunk from re-arming

        if (currentRecorder && currentRecorder.state === 'recording') {
            // The onstop handler will call this function when the chunk is sent
            currentRecorder._resolveStop = () => {
                teardownStream();
                resolve();
            };
            currentRecorder.stop();   // triggers onstop
        } else {
            teardownStream();
            resolve();
        }
    });
}

function teardownStream() {
    if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
        activeStream = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    currentRecorder = null;
    console.log('[Offscreen] Recording stopped — all audio flushed');
}


// ── Helpers ───────────────────────────────────────────────────

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror  = reject;
        reader.readAsDataURL(blob);
    });
}

function getSupportedMimeType() {
    const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
    ];
    for (const type of candidates) {
        if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
}