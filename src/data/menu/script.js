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


pauseButton.addEventListener("click", async function(e) {
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
        await chrome.storage.sync.set({ globallyDisabled: isPaused });
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
    debugCookieStatus();
});

// Lade initialen Status
chrome.storage.sync.get("globallyDisabled", function(data) {
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
function updateCookieStatusDisplay() {
    // Add the cookie status display element if it doesn't exist
    let cookieStatusSection = document.querySelector('.cookie-info-section');
    if (!cookieStatusSection) {
        cookieStatusSection = document.createElement('div');
        cookieStatusSection.className = 'cookie-info-section';
        cookieStatusSection.innerHTML = `
            <div class="status-section">
                <div class="status-label">COOKIES</div>
                <div class="status-value" id="cookieStatusDisplay"></div>
            </div>
        `;
        // Insert before the toggle button
        pauseButton.parentElement.insertBefore(cookieStatusSection, pauseButton);
    }

    const cookieStatusDisplay = document.getElementById('cookieStatusDisplay');

    // Get current status based on isPaused
    chrome.storage.sync.get("globallyDisabled", function(data) {
        if (data.globallyDisabled) {
            cookieStatusDisplay.textContent = "All cookies allowed";
        } else {
            if (currentTab && currentTab.whitelisted) {
                cookieStatusDisplay.textContent = "Site whitelisted";
            } else {
                cookieStatusDisplay.textContent = "Cookies blocked";
            }
        }
    });
}

// Initialize menu
function reloadMenu() {
    return new Promise((resolve) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.runtime.sendMessage(
                {
                    command: "get_active_tab",
                    tabId: tabs[0].id
                },
                function(message) {
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


// Debug function
function debugCookieStatus() {
    chrome.cookies.getAll({}, function(cookies) {
        console.log('Current cookies:', cookies);

        // Group cookies by type/status
        let cookieStatus = {
            blocked: [],
            allowed: [],
            technical: []
        };

        cookies.forEach(cookie => {
            // Check against your blocking rules
            if (shouldBlockCookie(cookie)) {
                cookieStatus.blocked.push(cookie.name);
            } else if (isTechnicalCookie(cookie)) {
                cookieStatus.technical.push(cookie.name);
            } else {
                cookieStatus.allowed.push(cookie.name);
            }
        });

        console.log('Cookie Status:', cookieStatus);
    });
}

// Helper function
function shouldBlockCookie(cookie) {
    // Check against your blockUrls rules
    return blockUrls.common.some(rule =>
        cookie.domain.includes(rule.r) ||
        cookie.name.includes(rule.r)
    );
}

function isTechnicalCookie(cookie) {
    // Define technical cookie patterns (session, csrf, etc)
    const technicalPatterns = ['session', 'csrf', 'token', 'auth'];
    return technicalPatterns.some(pattern =>
        cookie.name.toLowerCase().includes(pattern)
    );
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    translate();
    reloadMenu();
    updatePauseButtonState();
});