(() => {
    console.log('[Echo Sync] Dashboard sync script loaded.');

    let syncInterval = null;

    function syncUser() {
        const uid = localStorage.getItem('echo_user_id');
        if (uid) {
            try {
                chrome.runtime.sendMessage({ type: 'SYNC_USER', userId: uid }, (response) => {
                    if (chrome.runtime.lastError) return;
                    // console.log('[Echo Sync] Successfully synced user ID to extension.');
                });
            } catch (e) {
                if (e.message.includes('Extension context invalidated')) {
                    console.warn(
                        '[Echo Sync] Extension reloaded. ' +
                        'Please refresh this page to reconnect.'
                    );
                    if (syncInterval) clearInterval(syncInterval);
                }
            }
        }
    }

    // Initial sync on load
    syncUser();

    // Poll occasionally in case they just logged in
    syncInterval = setInterval(syncUser, 3000);
})();
