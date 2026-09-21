// ============================================================
// Echo Extension — Background Service Worker
// NO ES module imports — everything is self-contained here.
// ============================================================

// ── Inline utility (avoids ES module import issues) ──────────
function generateMeetingId() {
    const ts  = Date.now();
    const rnd = Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0');
    return `echo-${ts}-${rnd}`;
}

// ── State ─────────────────────────────────────────────────────
let recording          = false;
let meetingId          = null;
let targetTabId        = null;
let recordingStartTime = null;   // ms timestamp — survives popup open/close
let ws                 = null;
let wsReady            = false;
let pendingChunks      = [];

const BACKEND_WS_URL = 'ws://localhost:3001';

// ── Message Router ────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    switch (message.type) {

        case 'START_CAPTURE':
            startCapture()
                .then(() => sendResponse({ success: true, meetingId }))
                .catch(err => {
                    const msg = err.message || String(err);
                    console.error('[BG] startCapture error:', msg);
                    sendResponse({ success: false, error: msg });
                });
            return true;  // keep channel open for async sendResponse

        case 'STOP_CAPTURE':
            stopCapture()
                .then(() => sendResponse({ success: true }))
                .catch(err => sendResponse({ success: false, error: err.message }));
            return true;

        case 'AUDIO_CHUNK':
            handleAudioChunk(message.chunk, message.mimeType);
            sendResponse({ received: true });
            return false;

        case 'SPEAKER_UPDATE':
            handleSpeakerUpdate(message.speaker, message.timestamp);
            sendResponse({ received: true });
            return false;

        case 'GET_STATE':
            sendResponse({ recording, meetingId, wsReady, recordingStartTime });
            return false;
    }
});

// ── Tab Lifecycle Listeners ───────────────────────────────────
chrome.tabs.onRemoved.addListener((tabId) => {
    if (recording && targetTabId === tabId) {
        console.log('[BG] Meet tab closed — stopping capture');
        stopCapture();
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (recording && targetTabId === tabId && changeInfo.url &&
        !changeInfo.url.startsWith('https://meet.google.com/')) {
        console.log('[BG] Meet tab navigated away — stopping capture');
        stopCapture();
    }
});

// ── Start Capture ─────────────────────────────────────────────
async function startCapture() {

    if (recording) return;

    // ── Find the Google Meet tab ──────────────────────────────
    // Service workers have NO "currentWindow", so we query by URL instead.
    const meetTabs = await chrome.tabs.query({ url: 'https://meet.google.com/*' });

    if (meetTabs.length === 0) {
        throw new Error('No Google Meet tab found. Open Google Meet first.');
    }

    // Pick the most recently accessed Meet tab
    meetTabs.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    const tab = meetTabs[0];

    if (!tab.id) {
        throw new Error('Could not access the Google Meet tab.');
    }

    // Validate it's a real meeting room (not /home, /about, etc.)
    // Meeting URLs: meet.google.com/abc-defg-hij
    const pathname = new URL(tab.url).pathname;
    const isMeetingRoom = /^\/[a-z0-9]{3,4}-[a-z0-9]{3,4}-[a-z0-9]{3,4}/.test(pathname);
    if (!isMeetingRoom) {
        throw new Error('Please join a meeting room first (not the Google Meet home page).');
    }

    targetTabId = tab.id;
    meetingId   = generateMeetingId();

    console.log('[BG] Starting capture | meeting:', meetingId, '| tab:', targetTabId);

    // ── Connect WebSocket ─────────────────────────────────────
    await connectWebSocket();
    wsSend({ type: 'meeting_start', meetingId, tabUrl: tab.url });

    // ── Start audio capture ───────────────────────────────────
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
    await ensureOffscreenDocument();
    await chrome.runtime.sendMessage({ type: 'START_RECORDING', streamId, meetingId });

    // ── Start speaker detection (non-fatal) ───────────────────
    try {
        await chrome.tabs.sendMessage(tab.id, { type: 'START_SPEAKER_WATCH', meetingId });
    } catch (e) {
        // Content script might not be ready — audio still works without speaker labels
        console.warn('[BG] Speaker watch skipped:', e.message);
    }

    recording          = true;
    recordingStartTime = Date.now();
    console.log('[BG] Recording started ✓');
}

// ── Stop Capture ──────────────────────────────────────────────
async function stopCapture() {

    if (!recording) return;

    // Stop audio recorder in offscreen
    try {
        await chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
    } catch (e) {
        console.warn('[BG] Offscreen stop failed:', e.message);
    }

    // Stop speaker watch in content script
    if (targetTabId) {
        chrome.tabs.sendMessage(targetTabId, { type: 'STOP_SPEAKER_WATCH' }).catch(() => {});
    }

    // Notify backend
    wsSend({ type: 'meeting_end', meetingId });

    recording          = false;
    meetingId          = null;
    targetTabId        = null;
    recordingStartTime = null;

    console.log('[BG] Recording stopped ✓');
}

// ── Audio / Speaker handlers ──────────────────────────────────
function handleAudioChunk(base64Audio, mimeType) {
    wsSend({
        type:      'audio_chunk',
        meetingId,
        timestamp: new Date().toISOString(),
        audio:     base64Audio,
        mimeType:  mimeType || 'audio/webm'
    });
}

function handleSpeakerUpdate(speaker, timestamp) {
    wsSend({ type: 'speaker_update', meetingId, speaker, timestamp });
}

// ── WebSocket ─────────────────────────────────────────────────
function connectWebSocket() {

    return new Promise((resolve, reject) => {

        if (ws && wsReady) { resolve(); return; }

        console.log('[WS] Connecting to', BACKEND_WS_URL);
        ws = new WebSocket(BACKEND_WS_URL);

        ws.onopen = () => {
            console.log('[WS] Connected ✓');
            wsReady = true;
            pendingChunks.forEach(p => ws.send(p));
            pendingChunks = [];
            resolve();
        };

        ws.onmessage = (event) => {
            try {
                handleBackendMessage(JSON.parse(event.data));
            } catch (e) {
                console.warn('[WS] Non-JSON message:', event.data);
            }
        };

        ws.onerror = () => {
            wsReady = false;
            reject(new Error('Backend not reachable. Run: python extension_ws.py'));
        };

        ws.onclose = () => {
            wsReady = false;
            ws      = null;
            if (recording) {
                recording = false;
                console.warn('[BG] WS closed mid-recording. Stopped.');
            }
        };

        // 5 second timeout
        setTimeout(() => {
            if (!wsReady) {
                reject(new Error('Backend timeout (5s). Is extension_ws.py running?'));
            }
        }, 5000);
    });
}

function wsSend(data) {
    const payload = JSON.stringify(data);
    if (ws && wsReady) {
        ws.send(payload);
    } else if (data.type !== 'audio_chunk') {
        pendingChunks.push(payload);   // buffer metadata
    } else {
        console.warn('[WS] Not connected — dropping audio chunk');
    }
}

// ── Handle backend → extension messages ───────────────────────
function handleBackendMessage(data) {
    console.log('[BG] ← Backend:', data.type);
    if (['transcript_update', 'ai_update', 'status'].includes(data.type)) {
        chrome.tabs.query({ url: 'https://meet.google.com/*' }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'BACKEND_UPDATE', data }).catch(() => {});
            });
        });
    }
}

// ── Offscreen document ────────────────────────────────────────
async function ensureOffscreenDocument() {

    const existing = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [chrome.runtime.getURL('offscreen/offscreen.html')]
    });

    if (existing.length > 0) return;

    await chrome.offscreen.createDocument({
        url:           'offscreen/offscreen.html',
        reasons:       ['USER_MEDIA'],
        justification: 'Capture Google Meet audio for transcription'
    });

    // Wait a moment for the offscreen script to load and register its listeners
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('[BG] Offscreen document created ✓');
}