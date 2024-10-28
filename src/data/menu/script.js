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

pauseButton.addEventListener("click", function (e) {
    isPaused = !isPaused;
    updatePauseButtonLable()

    chrome.runtime.sendMessage({
            command: "toggle_pause",
            tabId: currentTab.id,
            enabled: !isPaused
        }, () => reloadMenu());
});

function updatePauseButtonLable() {
    pauseButton.textContent = isPaused ? chrome.i18n.getMessage("Enable") : chrome.i18n.getMessage("Disable");
}

// Initialize menu
function reloadMenu() {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.runtime.sendMessage(
            {
                command: "get_active_tab",
                tabId: tabs[0].id
            },
            function (message) {
                message = message || {};
                currentTab = message.tab ? message.tab : false;

                // Update pause state based on current tab
                if (currentTab) {
                    isPaused = !currentTab.whitelisted;
                    updatePauseButtonLable();
                }
            }
        );
    });
}

// Translation function (we'll need this for language support later)
function translate() {
    document.querySelectorAll("[data-translate]").forEach(element => {
        element.textContent = chrome.i18n.getMessage(element.dataset.translate);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    translate();
    reloadMenu();
});