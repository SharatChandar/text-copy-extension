(function () {
  let allowed = null;
  let copyModeActive = false;
  let hoveredEl = null;
  const COPY_KEY = "Alt";

  const HIGHLIGHT_STYLE = "outline: 2px solid rgba(91, 91, 255, 0.7); outline-offset: 1px; border-radius: 2px;";
  const COPY_CURSOR = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%235b5bff' stroke-width='2'%3E%3Crect x='9' y='9' width='13' height='13' rx='2'/%3E%3Cpath d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'/%3E%3C/svg%3E\") 10 10, copy";

  window.__textQuickCopy = { directText: "", fullText: "" };

  chrome.runtime.sendMessage(
    { type: "check-whitelist", url: window.location.href },
    (response) => {
      if (chrome.runtime.lastError) {
        allowed = false;
        return;
      }
      allowed = response?.allowed ?? false;
      if (allowed) init();
    }
  );

  function init() {
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", exitCopyMode);
    document.addEventListener("click", onCopyClick, true);
    document.addEventListener("mouseover", onHover, true);
    document.addEventListener("mouseout", onHoverOut, true);
    document.addEventListener("contextmenu", onRightClick, true);
  }

  function onKeyDown(e) {
    if (e.key === COPY_KEY && !copyModeActive) {
      copyModeActive = true;
      document.documentElement.style.cursor = COPY_CURSOR;
    }
  }

  function onKeyUp(e) {
    if (e.key === COPY_KEY) {
      exitCopyMode();
    }
  }

  function exitCopyMode() {
    if (!copyModeActive) return;
    copyModeActive = false;
    document.documentElement.style.cursor = "";
    clearHighlight();
  }

  function onHover(e) {
    if (!copyModeActive) return;
    const el = getClosestTextElement(e.target);
    if (el === hoveredEl) return;
    clearHighlight();
    hoveredEl = el;
    if (hoveredEl) {
      hoveredEl.dataset.__tqcPrevOutline = hoveredEl.style.cssText;
      hoveredEl.style.cssText += ";" + HIGHLIGHT_STYLE;
    }
  }

  function onHoverOut() {
    if (!copyModeActive) return;
    clearHighlight();
  }

  function clearHighlight() {
    if (hoveredEl) {
      hoveredEl.style.cssText = hoveredEl.dataset.__tqcPrevOutline || "";
      delete hoveredEl.dataset.__tqcPrevOutline;
      hoveredEl = null;
    }
  }

  function onCopyClick(e) {
    if (!copyModeActive) return;

    const el = getClosestTextElement(e.target);
    if (!el) return;

    e.preventDefault();
    e.stopPropagation();

    const text = getDirectText(el);
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      flashHighlight(el);
      showToast(text);
    });
  }

  function onRightClick(e) {
    const el = getClosestTextElement(e.target);
    if (!el) {
      window.__textQuickCopy = { directText: "", fullText: "" };
      return;
    }
    window.__textQuickCopy = {
      directText: getDirectText(el),
      fullText: getFullElementText(el),
    };
  }

  // --- Element resolution ---

  function getClosestTextElement(el) {
    if (!el) return null;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return el;

    let current = el;
    while (current && current !== document.body) {
      if (hasOwnTextContent(current)) return current;
      current = current.parentElement;
    }
    return el;
  }

  function hasOwnTextContent(el) {
    if (!el || !el.childNodes) return false;
    return Array.from(el.childNodes).some(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim()
    );
  }

  // --- Text extraction ---

  function getDirectText(el) {
    if (!el) return "";
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      return (el.value || "").trim();
    }
    let text = "";
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      }
    }
    return text.trim();
  }

  function getFullElementText(el) {
    if (!el) return "";
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      return (el.value || "").trim();
    }
    return (el.innerText || el.textContent || "").trim();
  }

  // --- Visual feedback ---

  function flashHighlight(el) {
    const prev = el.style.transition;
    const prevBg = el.style.backgroundColor;

    el.style.transition = "background-color 0.15s ease";
    el.style.backgroundColor = "rgba(66, 133, 244, 0.25)";

    setTimeout(() => {
      el.style.backgroundColor = prevBg;
      setTimeout(() => {
        el.style.transition = prev;
      }, 200);
    }, 300);
  }

  function showToast(text) {
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
    const preview = text.length > 60 ? text.slice(0, 60) + "…" : text;
    toast.textContent = `Copied: "${preview}"`;
    toast.style.opacity = "1";
    clearTimeout(toast.__timer);
    toast.__timer = setTimeout(() => {
      toast.style.opacity = "0";
    }, 2000);
  }
})();
