const form = document.querySelector("#popupForm");
const input = document.querySelector("#popupSearch");
const status = document.querySelector("#popupStatus");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const query = input.value.trim();

  try {
    if (query) {
      await chrome.storage.session.set({
        pendingSearch: {
          query,
          createdAt: Date.now()
        }
      });
    }

    const currentWindow = await chrome.windows.getCurrent();
    await chrome.sidePanel.open({ windowId: currentWindow.id });
    window.close();
  } catch (error) {
    console.error("ChemLimit: impossibile aprire il side panel", error);
    status.textContent = "Impossibile aprire il side panel.";
  }
});
