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

    if (isPaused) {
        pauseButton.classList.add('enabled');
    } else {
        pauseButton.classList.remove('enabled');
    }

    console.log("Updated button text to:", buttonText, "and class:", isPaused ? "enabled" : "default");
}

// Update cookie status display
function updateCookieStatusDisplay(cookieStatus) {
    console.log('Updating cookie status display with:', cookieStatus);

    if (!cookieStatus) {
        console.log('No cookie status provided');
        return;
    }

    // Update checkboxes
    const technicalCheckbox = document.getElementById('technical');
    const statisticsCheckbox = document.getElementById('statistics');
    const marketingCheckbox = document.getElementById('marketing');

    // Add debug logging for checkbox elements
    console.log('Checkbox elements found:', {
        technical: !!technicalCheckbox,
        statistics: !!statisticsCheckbox,
        marketing: !!marketingCheckbox
    });

    // Add debug logging for cookie counts
    console.log('Cookie counts:', {
        technical: cookieStatus.technical?.length || 0,
        statistics: cookieStatus.statistics?.length || 0,
        marketing: cookieStatus.marketing?.length || 0
    });

    if (technicalCheckbox) {
        technicalCheckbox.checked = Array.isArray(cookieStatus.technical) && cookieStatus.technical.length > 0;
    }
    if (statisticsCheckbox) {
        statisticsCheckbox.checked = Array.isArray(cookieStatus.statistics) && cookieStatus.statistics.length > 0;
    }
    if (marketingCheckbox) {
        marketingCheckbox.checked = Array.isArray(cookieStatus.marketing) && cookieStatus.marketing.length > 0;
    }

    // Log final checkbox states
    console.log('Final checkbox states:', {
        technical: technicalCheckbox?.checked,
        statistics: statisticsCheckbox?.checked,
        marketing: marketingCheckbox?.checked
    });
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

// Translation function
function translate() {
    document.querySelectorAll("[data-translate]").forEach(element => {
        element.textContent = chrome.i18n.getMessage(element.dataset.translate);
    });
}

async function analyzeCookieStatus() {
    console.log("Analyzing cookie status");
    try {
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Request cookie status with tabId
        const response = await chrome.runtime.sendMessage({
            command: "get_cookie_status",
            tabId: tab.id
        });

        console.log('Received cookie status:', response);

        // Add debug logging to see the exact structure
        if (response && response.cookieStatus) {
            console.log('Cookie status structure:', {
                technical: response.cookieStatus.technical,
                statistics: response.cookieStatus.statistics,
                marketing: response.cookieStatus.marketing
            });

            updateCookieStatusDisplay(response.cookieStatus);
        } else {
            console.log('No cookie status received, updating display with empty status');
            updateCookieStatusDisplay({
                technical: [],
                statistics: [],
                marketing: []
            });
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