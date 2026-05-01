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

  if (!tab?.id) {
    console.error("ChemLimit: tab non disponibile per aprire il side panel.");
    return;
  }

  const tabId = tab.id;

  try {
    chrome.sidePanel
      .setOptions({
        tabId,
        path: "src/sidepanel.html",
        enabled: true
      })
      .catch((error) => {
        console.error("ChemLimit: errore in sidePanel.setOptions.", error);
      });

    chrome.sidePanel.open({ tabId }).catch((error) => {
      console.error("ChemLimit: errore in sidePanel.open.", error);
    });

    chrome.storage.local.set({
      chemlimitLastQuery: query,
      chemlimitLastQueryAt: Date.now()
    });

    chrome.runtime
      .sendMessage({
        type: "CHEMLIMIT_SEARCH",
        query
      })
      .catch(() => {
        // Il side panel potrebbe non essere ancora pronto: non è bloccante.
      });
  } catch (error) {
    console.error("ChemLimit: errore apertura side panel dal menu contestuale.", error);
  }
});
