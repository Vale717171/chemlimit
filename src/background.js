const CONTEXT_MENU_ID = "chemlimit-search-selection";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Cerca con ChemLimit",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !info.selectionText) {
    return;
  }

  const query = info.selectionText.trim();

  try {
    await chrome.storage.session.set({
      pendingSearch: {
        query,
        createdAt: Date.now()
      }
    });

    if (tab?.windowId) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  } catch (error) {
    console.error("ChemLimit: impossibile aprire il side panel", error);
  }
});
