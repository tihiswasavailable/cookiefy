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
    console.log("Toggling pause button from:", isPaused, "to:", !isPaused)
    isPaused = !isPaused;
    console.log("Pause button state: ", isPaused);
    updatePauseButtonState()

    chrome.runtime.sendMessage({
            command: "toggle_pause",
            tabId: currentTab.id,
            isDisabled: isPaused
        }, () => {
        console.log("Extension state updated to:", isPaused ? "Disabled" : "Enabled")
        reloadMenu()
    });
});

function updatePauseButtonState() {
    const buttonText = isPaused ? "enable" : "disable";
    pauseButton.textContent = chrome.i18n.getMessage(buttonText.toLowerCase());
    pauseButton.classList.toggle("enabled", !isPaused);
}

chrome.storage.sync.get("disabled", function (data) {
    isPaused = data.disabled ?? false;
    console.log("Loaded initial state:", isPaused ? "Disabled" : "Enabled");
    updatePauseButtonState();
})
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
                    isPaused = currentTab.whitelisted;
                    console.log("Current tab is whitelisted ", currentTab.whitelisted);
                    updatePauseButtonState();
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