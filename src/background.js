const MENU_ID = "chemlimit-search-selection";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.remove(MENU_ID, () => {
    chrome.runtime.lastError;
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "Cerca con ChemLimit",
      contexts: ["selection"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) {
    return;
  }

  const query = String(info.selectionText || "").trim();
  const tabId = tab && tab.id;
  const queryAt = Date.now();

  if (!tabId) {
    console.error("ChemLimit: tabId non disponibile.");
    return;
  }

  chrome.storage.local
    .set({
      chemlimitLastQuery: query,
      chemlimitLastQueryAt: queryAt
    })
    .catch((error) => {
      console.error("ChemLimit: impossibile salvare la query.", error);
    });

  chrome.sidePanel.open({ tabId }).catch((error) => {
    console.error("ChemLimit: impossibile aprire il side panel.", error);
  });

  chrome.runtime
    .sendMessage({
      type: "CHEMLIMIT_SEARCH",
      query,
      queryAt
    })
    .catch(() => {
      // Il side panel potrebbe non essere ancora caricato.
    });
});
