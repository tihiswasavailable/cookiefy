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

async function updateCookieStatusDisplay(cookieStatus) {
    console.log('Updating cookie status display with:', cookieStatus);
    if (!cookieStatus) {
        console.log('No cookie status provided');
        return;
    }

    // Get status display elements for each category
    const technicalStatus = document.querySelector('[data-category="technical"] .status-indicator');
    const statisticsStatus = document.querySelector('[data-category="statistics"] .status-indicator');
    const marketingStatus = document.querySelector('[data-category="marketing"] .status-indicator');

    // Get array lengths, ensuring we handle both array and number inputs
    const getCookieCount = (category) => {
        if (Array.isArray(category)) return category.length;
        if (typeof category === 'number') return category;
        return 0;
    };

    const technicalCount = getCookieCount(cookieStatus.technical);
    const statisticsCount = getCookieCount(cookieStatus.statistics);
    const marketingCount = getCookieCount(cookieStatus.marketing);

    console.log('Cookie counts:', {
        technical: technicalCount,
        statistics: statisticsCount,
        marketing: marketingCount
    });

    // Update status displays for all categories including technical
    if (technicalStatus) {
        technicalStatus.textContent = technicalCount > 0 ? 'Accepted' : 'Rejected';
        technicalStatus.className = 'status-indicator ' + (technicalCount > 0 ? 'status-accepted' : 'status-rejected');
        console.log('Technical status updated:', technicalCount > 0 ? 'Accepted' : 'Rejected');
    }

    if (statisticsStatus) {
        statisticsStatus.textContent = statisticsCount > 0 ? 'Accepted' : 'Rejected';
        statisticsStatus.className = 'status-indicator ' + (statisticsCount > 0 ? 'status-accepted' : 'status-rejected');
        console.log('Statistics status updated:', statisticsCount > 0 ? 'Accepted' : 'Rejected');
    }

    if (marketingStatus) {
        marketingStatus.textContent = marketingCount > 0 ? 'Accepted' : 'Rejected';
        marketingStatus.className = 'status-indicator ' + (marketingCount > 0 ? 'status-accepted' : 'status-rejected');
        console.log('Marketing status updated:', marketingCount > 0 ? 'Accepted' : 'Rejected');
    }

    console.log('Final status states:', {
        technical: technicalCount > 0 ? 'Accepted' : 'Rejected',
        statistics: statisticsCount > 0 ? 'Accepted' : 'Rejected',
        marketing: marketingCount > 0 ? 'Accepted' : 'Rejected'
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
                    updateCookieStatusDisplay({
                        technical: [],
                        statistics: [],
                        marketing: []
                    });
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

        if (!tab) {
            console.warn('No active tab found');
            return;
        }

        // Request cookie status with tabId
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
                command: "get_cookie_status",
                tabId: tab.id
            }, (response) => {
                resolve(response);
            });
        });

        console.log('Received response:', response);

        if (response && response.cookieStatus) {
            console.log('Processing cookie status:', response.cookieStatus);
            await updateCookieStatusDisplay(response.cookieStatus);
        } else {
            console.log('No cookie status in response');
            await updateCookieStatusDisplay({
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
    console.log('Popup loaded, analyzing cookies')
    analyzeCookieStatus();
});