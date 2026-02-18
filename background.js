chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "quick-copy-text",
    title: "Copy Text (direct only)",
    contexts: ["selection", "page", "editable", "link", "image"],
  });

  chrome.contextMenus.create({
    id: "quick-copy-full-text",
    title: "Copy Full Text (with children)",
    contexts: ["selection", "page", "editable", "link", "image"],
  });

  chrome.storage.sync.get("whitelist", (data) => {
    if (!data.whitelist) {
      chrome.storage.sync.set({ whitelist: [] });
    }
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const mode =
    info.menuItemId === "quick-copy-text" ? "direct" :
    info.menuItemId === "quick-copy-full-text" ? "full" : null;
  if (!mode) return;

  isUrlWhitelisted(tab.url).then((allowed) => {
    if (!allowed) {
      showBadge("OFF", "#888", tab.id);
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyTextFromContextMenu,
      args: [mode],
    });
  });
});

function copyTextFromContextMenu(mode) {
  const store = window.__textQuickCopy || {};
  const text = mode === "full" ? (store.fullText || "") : (store.directText || "");
  if (!text) return;

  navigator.clipboard.writeText(text).then(() => {
    showCopiedToast(text);
  });

  function showCopiedToast(copied) {
    let toast = document.getElementById("__tqc-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "__tqc-toast";
      Object.assign(toast.style, {
        position: "fixed",
        bottom: "24px",
        right: "24px",
        background: "#1a1a2e",
        color: "#e0e0e0",
        padding: "10px 18px",
        borderRadius: "8px",
        fontSize: "13px",
        fontFamily: "system-ui, sans-serif",
        zIndex: "2147483647",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        transition: "opacity 0.3s ease",
        maxWidth: "320px",
        wordBreak: "break-word",
        border: "1px solid #333",
      });
      document.body.appendChild(toast);
    }
    const preview = copied.length > 60 ? copied.slice(0, 60) + "…" : copied;
    toast.textContent = `Copied: "${preview}"`;
    toast.style.opacity = "1";
    clearTimeout(toast.__timer);
    toast.__timer = setTimeout(() => {
      toast.style.opacity = "0";
    }, 2000);
  }
}

function showBadge(text, color, tabId) {
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color, tabId });
  setTimeout(() => chrome.action.setBadgeText({ text: "", tabId }), 2000);
}

function wildcardToRegex(pattern) {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp("^" + escaped + "$", "i");
}

async function isUrlWhitelisted(url) {
  return new Promise((resolve) => {
    chrome.storage.sync.get("whitelist", (data) => {
      const whitelist = data.whitelist || [];
      if (whitelist.length === 0) {
        resolve(false);
        return;
      }
      const match = whitelist.some((pattern) =>
        wildcardToRegex(pattern).test(url)
      );
      resolve(match);
    });
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "check-whitelist") {
    isUrlWhitelisted(msg.url).then((allowed) => {
      sendResponse({ allowed });
    });
    return true;
  }
});
