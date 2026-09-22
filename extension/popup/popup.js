// ============================================================
// Echo Extension — Popup Script
// ============================================================

// ── DOM References ────────────────────────────────────────────
const statusPill    = document.getElementById('statusPill');
const statusText    = document.getElementById('statusText');
const startBtn      = document.getElementById('startBtn');
const stopBtn       = document.getElementById('stopBtn');
const meetingInfo   = document.getElementById('meetingInfo');
const meetingIdText = document.getElementById('meetingIdText');
const durationText  = document.getElementById('durationText');
const errorBox      = document.getElementById('errorBox');
const errorText     = document.getElementById('errorText');
const footerHint    = document.getElementById('footerHint');

// ── Local state ───────────────────────────────────────────────
let durationInterval = null;
let startTime        = null;

// ── Init: read current state from background ──────────────────
(async () => {
    try {
        const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
        if (state?.recording) {
            // Pass the original start time so the timer continues, not resets
            setRecordingUI(state.meetingId, state.recordingStartTime);
        } else {
            setIdleUI();
        }
    } catch {
        setIdleUI();
    }
})();

// ── Start button ──────────────────────────────────────────────
startBtn.addEventListener('click', async () => {

    hideError();
    startBtn.disabled = true;
    setPill('Connecting…', 'idle');   // stay "idle" visually while connecting
    footerHint.textContent = 'Connecting to backend…';

    try {

        const resp = await chrome.runtime.sendMessage({ type: 'START_CAPTURE' });

        if (resp?.success) {
            setRecordingUI(resp.meetingId);
        } else {
            showError(resp?.error || 'Unknown error');
            setIdleUI();
        }

    } catch (err) {
        showError(err.message || 'Could not start recording');
        setIdleUI();
    }
});

// ── Stop button ───────────────────────────────────────────────
stopBtn.addEventListener('click', async () => {

    stopBtn.disabled = true;
    setPill('Stopping…', 'idle');

    try {
        await chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' });
    } catch {
        // ignore
    }

    setIdleUI();
});

// ── UI helpers ────────────────────────────────────────────────

function setRecordingUI(mId, startTimeMs) {

    // Buttons
    startBtn.style.display = 'none';
    startBtn.disabled      = false;
    stopBtn.style.display  = 'block';
    stopBtn.disabled       = false;

    // Pill
    setPill('Recording…', 'active');

    // Meeting info
    meetingIdText.textContent = mId || '—';
    meetingInfo.style.display = 'block';

    // Duration timer — use background's original start time if available
    // This keeps the timer continuous when the popup is closed and reopened
    startTime = startTimeMs || Date.now();
    clearInterval(durationInterval);
    durationInterval = setInterval(updateDuration, 1000);
    updateDuration();

    footerHint.textContent = 'Echo is capturing your meeting.';
}

function setIdleUI() {

    // Buttons
    startBtn.style.display = 'block';
    startBtn.disabled      = false;
    stopBtn.style.display  = 'none';
    stopBtn.disabled       = false;

    // Pill
    setPill('Ready', 'idle');

    // Hide meeting info
    meetingInfo.style.display = 'none';
    meetingIdText.textContent = '—';

    // Stop timer
    clearInterval(durationInterval);
    durationInterval = null;
    startTime        = null;
    durationText.textContent = '00:00';

    footerHint.textContent = 'Open Google Meet, then click Start.';
}

function setPill(text, state) {
    statusText.textContent = text;
    statusPill.className = `pill pill-${state}`;
}

function updateDuration() {
    if (!startTime) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(elapsed % 60).padStart(2, '0');
    durationText.textContent = `${mm}:${ss}`;
}

function showError(msg) {
    errorText.textContent  = msg;
    errorBox.style.display = 'block';
}

function hideError() {
    errorBox.style.display = 'none';
}