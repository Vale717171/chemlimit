const MENU_ID = "chemlimit-search-selection";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
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

  if (!tabId) {
    console.error("ChemLimit: tabId non disponibile.");
    return;
  }

  chrome.sidePanel.open({ tabId }).catch((error) => {
    console.error("ChemLimit: impossibile aprire il side panel.", error);
  });

  chrome.storage.local
    .set({
      chemlimitLastQuery: query,
      chemlimitLastQueryAt: Date.now()
    })
    .catch((error) => {
      console.error("ChemLimit: impossibile salvare la query.", error);
    });

  chrome.runtime
    .sendMessage({
      type: "CHEMLIMIT_SEARCH",
      query
    })
    .catch(() => {
      // Il side panel potrebbe non essere ancora caricato.
    });
});
