console.log("[Echo Sync] Dashboard sync script loaded.");

function syncUser() {
    const uid = localStorage.getItem('echo_user_id');
    if (uid) {
        chrome.runtime.sendMessage({ type: 'SYNC_USER', userId: uid }, (response) => {
            if (chrome.runtime.lastError) return;
            console.log("[Echo Sync] Successfully synced user ID to extension.");
        });
    }
}

// Initial sync on load
syncUser();

// Poll occasionally in case they just logged in
setInterval(syncUser, 3000);
