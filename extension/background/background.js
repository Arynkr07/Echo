// ============================================================
// Echo Extension — Background Service Worker
// Responsibilities:
//   • Handle popup messages (START_CAPTURE / STOP_CAPTURE)
//   • Manage the offscreen document for audio capture
//   • Hold the WebSocket connection to the backend
//   • Forward audio chunks + speaker/timestamp data to backend
//   • Relay transcript/status updates back to the content script
// ============================================================

import { generateMeetingId } from './utils.js';

// ── State ────────────────────────────────────────────────────
let recording     = false;
let meetingId     = null;
let targetTabId   = null;
let ws            = null;           // WebSocket instance
let wsReady       = false;
let pendingChunks = [];             // buffered if ws not open yet

const BACKEND_WS_URL = 'ws://localhost:3001';  // ← backend will run here

// ── Message Router ───────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    switch (message.type) {

        // ── Popup requests start ──────────────────────────────
        case 'START_CAPTURE':
            startCapture()
                .then(() => sendResponse({ success: true, meetingId }))
                .catch(err => {
                    console.error('[BG] startCapture error:', err);
                    sendResponse({ success: false, error: err.message });
                });
            return true;   // keep channel open for async sendResponse

        // ── Popup requests stop ───────────────────────────────
        case 'STOP_CAPTURE':
            stopCapture()
                .then(() => sendResponse({ success: true }))
                .catch(err => sendResponse({ success: false, error: err.message }));
            return true;

        // ── Offscreen sends an audio chunk ────────────────────
        case 'AUDIO_CHUNK':
            handleAudioChunk(message.chunk, message.mimeType);
            sendResponse({ received: true });
            return false;

        // ── Content script sends speaker update ───────────────
        case 'SPEAKER_UPDATE':
            handleSpeakerUpdate(message.speaker, message.timestamp);
            sendResponse({ received: true });
            return false;

        // ── Popup queries current state ───────────────────────
        case 'GET_STATE':
            sendResponse({ recording, meetingId, wsReady });
            return false;
    }
});

// ── Tab Lifecycle Listeners ──────────────────────────────────
// Automatically stop capture if the Google Meet tab is closed or navigated away
chrome.tabs.onRemoved.addListener((tabId) => {
    if (recording && targetTabId === tabId) {
        console.log('[BG] Google Meet tab closed, stopping capture');
        stopCapture();
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (recording && targetTabId === tabId && changeInfo.url && !changeInfo.url.startsWith('https://meet.google.com/')) {
        console.log('[BG] Google Meet tab navigated away, stopping capture');
        stopCapture();
    }
});

// ── Start Capture ─────────────────────────────────────────────
async function startCapture() {

    if (recording) return;

    // Identify the active Google Meet tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) throw new Error('No active tab found');
    if (!tab.url?.startsWith('https://meet.google.com/')) {
        throw new Error('Please open Google Meet first');
    }

    targetTabId = tab.id;
    meetingId = generateMeetingId();

    console.log('[BG] Meeting ID:', meetingId, 'Tab ID:', targetTabId);

    // Connect WebSocket BEFORE starting audio
    await connectWebSocket();

    // Tell backend a meeting is starting
    wsSend({ type: 'meeting_start', meetingId, tabUrl: tab.url });

    // Get tab audio stream
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });

    // Launch offscreen document (audio recorder lives there)
    await ensureOffscreenDocument();

    // Tell offscreen doc to start recording
    await chrome.runtime.sendMessage({
        type: 'START_RECORDING',
        streamId,
        meetingId
    });

    // Tell content script to start watching for speakers
    await chrome.tabs.sendMessage(tab.id, {
        type: 'START_SPEAKER_WATCH',
        meetingId
    });

    recording = true;
    console.log('[BG] Recording started, meeting:', meetingId);
}

// ── Stop Capture ──────────────────────────────────────────────
async function stopCapture() {

    if (!recording) return;

    // Tell offscreen to stop
    await chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });

    // Tell content script to stop watching
    if (targetTabId) {
        chrome.tabs.sendMessage(targetTabId, { type: 'STOP_SPEAKER_WATCH' }).catch(() => {});
    }

    // Tell backend meeting ended
    wsSend({ type: 'meeting_end', meetingId });

    recording = false;
    meetingId = null;
    targetTabId = null;

    console.log('[BG] Recording stopped');
}

// ── Audio chunk handler ───────────────────────────────────────
function handleAudioChunk(base64Audio, mimeType) {

    wsSend({
        type:      'audio_chunk',
        meetingId,
        timestamp: new Date().toISOString(),
        audio:     base64Audio,
        mimeType:  mimeType || 'audio/webm'
    });
}

// ── Speaker update handler ────────────────────────────────────
function handleSpeakerUpdate(speaker, timestamp) {

    wsSend({
        type:      'speaker_update',
        meetingId,
        speaker,
        timestamp
    });
}

// ── WebSocket helpers ─────────────────────────────────────────
function connectWebSocket() {

    return new Promise((resolve, reject) => {

        if (ws && wsReady) {
            resolve();
            return;
        }

        console.log('[WS] Connecting to', BACKEND_WS_URL);

        ws = new WebSocket(BACKEND_WS_URL);

        ws.onopen = () => {
            console.log('[WS] Connected');
            wsReady = true;

            // Flush any buffered chunks
            pendingChunks.forEach(payload => ws.send(payload));
            pendingChunks = [];

            resolve();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleBackendMessage(data);
            } catch (e) {
                console.warn('[WS] Non-JSON message:', event.data);
            }
        };

        ws.onerror = (err) => {
            console.error('[WS] Error:', err);
            wsReady = false;
            reject(new Error('WebSocket connection failed. Is the backend running on port 3001?'));
        };

        ws.onclose = (event) => {
            console.log('[WS] Closed:', event.code, event.reason);
            wsReady = false;
            ws = null;

            // Auto-stop recording if backend disconnects
            if (recording) {
                recording = false;
                console.warn('[BG] WebSocket closed during recording. Stopped.');
            }
        };

        // Timeout if backend not reachable
        setTimeout(() => {
            if (!wsReady) {
                reject(new Error('WebSocket timeout. Is the backend running on port 3001?'));
            }
        }, 5000);
    });
}

function wsSend(data) {
    const payload = JSON.stringify(data);
    if (ws && wsReady) {
        ws.send(payload);
    } else {
        // Buffer small metadata messages; drop large audio if not connected
        if (data.type !== 'audio_chunk') {
            pendingChunks.push(payload);
        } else {
            console.warn('[WS] Not connected — dropping audio chunk');
        }
    }
}

// ── Handle messages from backend ──────────────────────────────
function handleBackendMessage(data) {

    console.log('[BG] Backend message:', data.type);

    // Forward transcript/AI updates to the content script (for overlay)
    if (['transcript_update', 'ai_update', 'status'].includes(data.type)) {
        chrome.tabs.query({ url: 'https://meet.google.com/*' }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'BACKEND_UPDATE', data }).catch(() => {});
            });
        });
    }
}

// ── Offscreen document management ─────────────────────────────
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

    console.log('[BG] Offscreen document created');
}