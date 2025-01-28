function saveOptions() {
  const whitelist = document.getElementById("whitelist").value.split("\n");
  const settings = {
    whitelistedDomains: {},
    statusIndicators: document.getElementById("status_indicators").checked,
  };

  whitelist.forEach((line) => {
    line = line
      .trim()
      .replace(/^\w*\:?\/+/i, "")
      .replace(/^w{2,3}\d*\./i, "")
      .split("/")[0]
      .split(":")[0];

    if (line.length > 0 && line.length < 100) {
      settings.whitelistedDomains[line] = true;
    }
  });

  chrome.storage.local.set({ settings }, () => {
    document.getElementById("status_saved").style.display = "inline";

    setTimeout(function () {
      document.getElementById("status_saved").style.display = "none";
    }, 2000);

    chrome.runtime.sendMessage("update_settings");
  });
}

function restoreOptions() {
  chrome.storage.local.get(
    { settings: { whitelistedDomains: {}, statusIndicators: true } },
    ({ settings }) => {
      document.getElementById("whitelist").value = Object.keys(
        settings.whitelistedDomains
      )
        .sort()
        .join("\n");
      document.getElementById("status_indicators").checked =
        settings.statusIndicators;
    }
  );
}

document.title = document.getElementById("title").textContent =
  chrome.i18n.getMessage("optionsTitle") +
  " - " +
  chrome.i18n.getMessage("extensionName");
document.getElementById("whitelist_label").textContent =
  chrome.i18n.getMessage("optionsWhitelist");
document.getElementById("status_indicators_label").textContent =
  chrome.i18n.getMessage("optionStatusIndicators");

document
  .getElementById("save")
  .setAttribute("value", chrome.i18n.getMessage("optionsButton"));
document.getElementById("status_saved").textContent =
  chrome.i18n.getMessage("optionsSaved");

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);

document.getElementById("help_description").textContent = chrome.i18n.getMessage("helpDescription");
document.getElementById("getting_started_title").textContent = chrome.i18n.getMessage("gettingStartedTitle");
document.getElementById("getting_started_desc").textContent = chrome.i18n.getMessage("gettingStartedDesc");
document.getElementById("config_guide_title").textContent = chrome.i18n.getMessage("configGuideTitle");
document.getElementById("config_guide_desc").textContent = chrome.i18n.getMessage("configGuideDesc");
document.getElementById("troubleshooting_title").textContent = chrome.i18n.getMessage("troubleshootingTitle");
document.getElementById("troubleshooting_desc").textContent = chrome.i18n.getMessage("troubleshootingDesc");
document.getElementById("best_practices_title").textContent = chrome.i18n.getMessage("bestPracticesTitle");
document.getElementById("best_practices_desc").textContent = chrome.i18n.getMessage("bestPracticesDesc");
document.getElementById("faq_title").textContent = chrome.i18n.getMessage("faqTitle");
document.getElementById("faq_domains_title").textContent = chrome.i18n.getMessage("faqDomainsTitle");
document.getElementById("faq_domains_desc").textContent = chrome.i18n.getMessage("faqDomainsDesc");
document.getElementById("faq_indicators_title").textContent = chrome.i18n.getMessage("faqIndicatorsTitle");
document.getElementById("faq_indicators_desc").textContent = chrome.i18n.getMessage("faqIndicatorsDesc");
document.getElementById("faq_bug_title").textContent = chrome.i18n.getMessage("faqBugTitle");
document.getElementById("faq_bug_desc").textContent = chrome.i18n.getMessage("faqBugDesc");
document.getElementById("support_title").textContent = chrome.i18n.getMessage("supportTitle");
document.getElementById("report_issue_title").textContent = chrome.i18n.getMessage("reportIssueTitle");
document.getElementById("report_issue_desc").textContent = chrome.i18n.getMessage("reportIssueDesc");
document.getElementById("submit_issue_link").textContent = chrome.i18n.getMessage("submitIssueLink");
document.getElementById("community_support_title").textContent = chrome.i18n.getMessage("communitySupportTitle");
document.getElementById("community_support_desc").textContent = chrome.i18n.getMessage("communitySupportDesc");
document.getElementById("visit_forum_link").textContent = chrome.i18n.getMessage("visitForumLink");
document.getElementById("documentation_title").textContent = chrome.i18n.getMessage("documentationTitle");
document.getElementById("documentation_desc").textContent = chrome.i18n.getMessage("documentationDesc");
document.getElementById("view_docs_link").textContent = chrome.i18n.getMessage("viewDocsLink");