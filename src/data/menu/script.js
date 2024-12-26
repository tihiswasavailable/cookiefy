// Essential elements
const options = document.getElementById("options");
const pauseButton = document.getElementById("pause");
let currentTab = false;
let isPaused = false;

// Settings button handler
options.addEventListener("click", function (e) {
    chrome.runtime.sendMessage(
        {
            command: "open_options_page"
        },
        () => window.close()
    );
});


pauseButton.addEventListener("click", async function (e) {
    // Toggle state
    isPaused = !isPaused;
    console.log("Toggling pause button from:", !isPaused, "to:", isPaused);

    // Update UI first
    updatePauseButtonState();

    // Save state
    const newState = isPaused ? "Disabled" : "Enabled";
    console.log("Setting global state to:", newState);

    try {
        // Save to storage
        await chrome.storage.sync.set({globallyDisabled: isPaused});
        console.log("Saved global state as:", newState);

        // Notify background
        await chrome.runtime.sendMessage({
            command: "toggle_pause",
            isDisabled: isPaused
        });

        console.log("Extension state updated to:", newState);

        // Reload menu after all operations
        await reloadMenu();
        updatePauseButtonState();
    } catch (error) {
        console.error("Error updating state:", error);
    }
    console.log("Extension state updated, checking cookies");
});

// Load initialen Status
chrome.storage.sync.get("globallyDisabled", function (data) {
    isPaused = data.globallyDisabled ?? false;
    console.log("Loaded initial state:", isPaused ? "Disabled" : "Enabled");
    updatePauseButtonState();
});

function updatePauseButtonState() {
    console.log("Current isPaused state:", isPaused);
    const buttonText = isPaused ? "enable" : "disable";
    pauseButton.textContent = chrome.i18n.getMessage(buttonText);

    // Toggle die enabled Klasse basierend auf isPaused
    if (isPaused) {
        pauseButton.classList.add('enabled');  // Weißer Rahmen, transparenter Hintergrund
    } else {
        pauseButton.classList.remove('enabled');  // Weißer Hintergrund, violette Schrift
    }

    console.log("Updated button text to:", buttonText, "and class:", isPaused ? "enabled" : "default");
}

// Update cookie status display
function updateCookieStatusDisplay(cookieStatus) {
    document.getElementById('technicalCookies').textContent =
        cookieStatus?.technical?.length || 0;
    document.getElementById('marketingCookies').textContent =
        cookieStatus?.marketing?.length || 0;
}

// Initialize menu
function reloadMenu() {
    return new Promise((resolve) => {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.runtime.sendMessage(
                {
                    command: "get_active_tab",
                    tabId: tabs[0].id
                },
                function (message) {
                    message = message || {};
                    currentTab = message.tab ? message.tab : false;
                    updateCookieStatusDisplay();
                    // Don't update isPaused from tab state
                    console.log("Current tab whitelisted:", currentTab?.whitelisted);
                    resolve();
                }
            );
        });
    });
}

// Translation function (we'll need this for language support later)
function translate() {
    document.querySelectorAll("[data-translate]").forEach(element => {
        element.textContent = chrome.i18n.getMessage(element.dataset.translate);
    });
}

async function analyzeCookieStatus() {
    try {
        // Get cookie status from background
        const response = await chrome.runtime.sendMessage({
            command: "get_cookie_status"
        });

        if (response && response.cookieStatus) {
            await chrome.storage.local.set({ currentCookieStatus: response.cookieStatus });
            updateCookieStatusDisplay(response.cookieStatus);
        }
    } catch (error) {
        console.error('Error in analyzeCookieStatus:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    translate();
    reloadMenu();
    updatePauseButtonState();
    updateCookieStatusDisplay();
    analyzeCookieStatus();
});