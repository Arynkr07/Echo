// ============================================================
// Echo Extension — Content Script (runs on meet.google.com)
// Responsibilities:
//   • Watch the Google Meet page for the active speaker
//   • Send speaker + timestamp to background.js periodically
//   • Show a small status overlay on the Meet page
//   • Relay backend updates (transcript, AI notes) to the overlay
// ============================================================

console.log('[Echo] Content script loaded');

// ── State ─────────────────────────────────────────────────────
let speakerWatchInterval = null;
let lastSpeaker          = null;
let meetingId            = null;

// ── Message listener ──────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    switch (message.type) {

        case 'START_SPEAKER_WATCH':
            meetingId = message.meetingId;
            startSpeakerWatch();
            showOverlay('🔴 Echo: Recording', 'active');
            sendResponse({ ok: true });
            break;

        case 'STOP_SPEAKER_WATCH':
            stopSpeakerWatch();
            showOverlay('⚫ Echo: Stopped', 'idle');
            sendResponse({ ok: true });
            break;

        case 'BACKEND_UPDATE':
            handleBackendUpdate(message.data);
            sendResponse({ ok: true });
            break;
    }

    return true;
});

// ── Speaker Detection ─────────────────────────────────────────
//
// Google Meet marks the currently speaking participant with:
//   • A data-requested-participant-id attribute on the video tile
//   • A visible "speaking" indicator / name label on the active tile
//
// We try multiple selector strategies in order of reliability.
// Because Meet's DOM can change, we use a best-effort approach.

function getActiveSpeaker() {

    // Strategy 1: data-speaking attribute or aria-label on active tile
    const speakingTile = document.querySelector('[data-speaking="true"]');
    if (speakingTile) {
        const nameEl = speakingTile.querySelector('[data-self-name], [class*="name"], [class*="Name"]');
        if (nameEl?.textContent?.trim()) return nameEl.textContent.trim();
    }

    // Strategy 2: The pinned / large video tile shows the speaker's name
    // Meet puts a label like "You", "Aryan Kumar" etc. at the bottom of the large tile
    const pinnedLabel = document.querySelector(
        '[jsname="r4nke"] [class*="name"],' +       // active speaker name chip
        '[data-participant-id] [class*="Mute"],' +  // fallback
        '.NlEcpe'                                   // older Meet class
    );
    if (pinnedLabel?.textContent?.trim()) return pinnedLabel.textContent.trim();

    // Strategy 3: Any element with "speaking" in class and a visible name sibling
    const anyActiveEl = document.querySelector('[class*="speaking"] [class*="name"]');
    if (anyActiveEl?.textContent?.trim()) return anyActiveEl.textContent.trim();

    // Strategy 4: aria-label on video elements (fallback)
    const videos = document.querySelectorAll('video[aria-label]');
    for (const v of videos) {
        const label = v.getAttribute('aria-label');
        if (label && !label.includes('camera')) return label;
    }

    return null;
}

function startSpeakerWatch() {

    if (speakerWatchInterval) return;

    console.log('[Echo] Speaker watch started');

    speakerWatchInterval = setInterval(() => {

        const speaker   = getActiveSpeaker();
        const timestamp = new Date().toISOString();

        if (!speaker) return;

        // Only send if speaker changed (reduces noise)
        if (speaker === lastSpeaker) return;

        lastSpeaker = speaker;

        console.log('[Echo] Speaker change →', speaker, '@', timestamp);

        chrome.runtime.sendMessage({
            type: 'SPEAKER_UPDATE',
            speaker,
            timestamp
        });

    }, 1500);   // check every 1.5 seconds
}

function stopSpeakerWatch() {

    if (speakerWatchInterval) {
        clearInterval(speakerWatchInterval);
        speakerWatchInterval = null;
    }

    lastSpeaker = null;
    meetingId   = null;

    console.log('[Echo] Speaker watch stopped');
}

// ── Backend Update Handler ─────────────────────────────────────
function handleBackendUpdate(data) {

    switch (data.type) {

        case 'transcript_update':
            // Show the latest transcript line in the overlay tooltip
            updateOverlayTranscript(data.text, data.speaker);
            break;

        case 'status':
            if (data.message) updateOverlayStatus(data.message);
            break;
    }
}

// ── Status Overlay ────────────────────────────────────────────
// A small floating badge on the Meet page so the user knows Echo is active.

let overlayEl = null;

function createOverlay() {

    overlayEl = document.createElement('div');
    overlayEl.id = 'echo-overlay';

    Object.assign(overlayEl.style, {
        position:     'fixed',
        top:          '12px',
        right:        '12px',
        zIndex:       '2147483647',
        background:   '#1a1a2e',
        color:        '#e0e0e0',
        fontFamily:   'system-ui, sans-serif',
        fontSize:     '13px',
        padding:      '8px 14px',
        borderRadius: '20px',
        boxShadow:    '0 4px 12px rgba(0,0,0,0.4)',
        maxWidth:     '320px',
        cursor:       'default',
        userSelect:   'none',
        transition:   'opacity 0.3s ease'
    });

    overlayEl.innerHTML = `
        <span id="echo-status-icon">⚫</span>
        <span id="echo-status-text" style="margin-left:6px;">Echo: Ready</span>
        <div id="echo-transcript-line" style="
            margin-top:4px;
            font-size:11px;
            color:#aaa;
            display:none;
            max-width:280px;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
        "></div>
    `;

    document.body.appendChild(overlayEl);
}

function showOverlay(text, state) {

    if (!overlayEl) createOverlay();

    const statusEl = document.getElementById('echo-status-text');
    const iconEl   = document.getElementById('echo-status-icon');

    if (statusEl) statusEl.textContent = text;
    if (iconEl) {
        iconEl.textContent = state === 'active' ? '🔴' : '⚫';
    }
}

function updateOverlayStatus(text) {
    const statusEl = document.getElementById('echo-status-text');
    if (statusEl) statusEl.textContent = text;
}

function updateOverlayTranscript(text, speaker) {

    const lineEl = document.getElementById('echo-transcript-line');
    if (!lineEl) return;

    lineEl.style.display = 'block';
    lineEl.textContent   = speaker ? `${speaker}: ${text}` : text;
}