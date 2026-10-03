// ============================================================
// Echo Extension — Content Script (runs on meet.google.com)
// Responsibilities:
//   • Watch the Google Meet page for the active speaker
//   • Send speaker + timestamp to background.js periodically
//   • Show nothing on the Meet page (no overlay, no live transcript)
// ============================================================

console.log('[Echo] Content script loaded');

// Remove any overlay left behind by an older version of the extension
document.getElementById('echo-overlay')?.remove();

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
            sendResponse({ ok: true });
            break;

        case 'STOP_SPEAKER_WATCH':
            stopSpeakerWatch();
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
// Echo shows nothing on the Meet page: transcripts and notes live on the
// dashboard only, so updates from the backend are intentionally ignored here.
function handleBackendUpdate() {}