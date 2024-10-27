// Essential elements
const options = document.getElementById("options");
const pauseToggle = document.getElementById("pauseToggle");
let currentTab = false;

// Settings button handler
options.addEventListener("click", function(e) {
    chrome.runtime.sendMessage(
        {
            command: "open_options_page"
        },
        () => window.close()
    );
});

// Toggle switch handler
pauseToggle.addEventListener("change", function(e) {
    chrome.runtime.sendMessage(
        {
            command: "toggle_extension",
            tabId: currentTab.id,
            enabled: this.checked
        },
        () => reloadMenu()
    );
});

// Initialize menu
function reloadMenu() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.runtime.sendMessage(
            {
                command: "get_active_tab",
                tabId: tabs[0].id
            },
            function(message) {
                message = message || {};
                currentTab = message.tab ? message.tab : false;

                // Update toggle state based on current tab
                if (currentTab && currentTab.hostname) {
                    pauseToggle.checked = currentTab.whitelisted ? true : false;
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