const urlInput = document.getElementById("url-input");
const addBtn = document.getElementById("add-btn");
const addCurrentBtn = document.getElementById("add-current-btn");
const whitelistEl = document.getElementById("whitelist");
const emptyState = document.getElementById("empty-state");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const refreshNotice = document.getElementById("refresh-notice");

let currentTabUrl = "";
let listChanged = false;

function showRefreshNotice() {
  listChanged = true;
  refreshNotice.style.display = "block";
}

function wildcardToRegex(pattern) {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp("^" + escaped + "$", "i");
}

function checkStatus(whitelist) {
  if (!currentTabUrl) {
    statusDot.className = "dot";
    statusText.textContent = "No tab detected";
    return;
  }

  if (whitelist.length === 0) {
    statusDot.className = "dot inactive";
    statusText.textContent = "Disabled — add a URL to enable";
    return;
  }

  const match = whitelist.some((p) => wildcardToRegex(p).test(currentTabUrl));
  if (match) {
    statusDot.className = "dot active";
    statusText.textContent = "Active on this site";
  } else {
    statusDot.className = "dot inactive";
    statusText.textContent = "Not active on this site";
  }
}

function render(whitelist) {
  whitelistEl.innerHTML = "";

  if (whitelist.length === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
    whitelist.forEach((pattern, i) => {
      const li = document.createElement("li");

      const span = document.createElement("span");
      span.className = "pattern";
      span.textContent = pattern;

      const actions = document.createElement("span");
      actions.className = "actions";

      const editBtn = document.createElement("button");
      editBtn.className = "action-btn edit-btn";
      editBtn.textContent = "✎";
      editBtn.title = "Edit";
      editBtn.addEventListener("click", () => enterEditMode(li, i, pattern));

      const removeBtn = document.createElement("button");
      removeBtn.className = "action-btn remove-btn";
      removeBtn.textContent = "×";
      removeBtn.title = "Remove";
      removeBtn.addEventListener("click", () => removePattern(i));

      actions.appendChild(editBtn);
      actions.appendChild(removeBtn);

      li.appendChild(span);
      li.appendChild(actions);
      whitelistEl.appendChild(li);
    });
  }

  checkStatus(whitelist);
}

function enterEditMode(li, index, currentValue) {
  li.innerHTML = "";

  const input = document.createElement("input");
  input.className = "pattern-input";
  input.type = "text";
  input.value = currentValue;
  input.spellcheck = false;

  const actions = document.createElement("span");
  actions.className = "actions";

  const saveBtn = document.createElement("button");
  saveBtn.className = "action-btn save-btn";
  saveBtn.textContent = "✓";
  saveBtn.title = "Save";
  saveBtn.addEventListener("click", () => saveEdit(index, input.value));

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "action-btn cancel-btn";
  cancelBtn.textContent = "↩";
  cancelBtn.title = "Cancel";
  cancelBtn.addEventListener("click", () => loadWhitelist());

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveEdit(index, input.value);
    if (e.key === "Escape") loadWhitelist();
  });

  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);

  li.appendChild(input);
  li.appendChild(actions);
  input.focus();
  input.select();
}

function saveEdit(index, newValue) {
  newValue = newValue.trim();
  if (!newValue) return;

  chrome.storage.sync.get("whitelist", (data) => {
    const list = data.whitelist || [];
    if (index >= list.length) return;
    list[index] = newValue;
    chrome.storage.sync.set({ whitelist: list }, () => {
      render(list);
      showRefreshNotice();
    });
  });
}

function loadWhitelist() {
  chrome.storage.sync.get("whitelist", (data) => {
    render(data.whitelist || []);
  });
}

function addPattern(pattern) {
  pattern = pattern.trim();
  if (!pattern) return;

  chrome.storage.sync.get("whitelist", (data) => {
    const list = data.whitelist || [];
    if (list.includes(pattern)) {
      urlInput.value = "";
      return;
    }
    list.push(pattern);
    chrome.storage.sync.set({ whitelist: list }, () => {
      urlInput.value = "";
      render(list);
      showRefreshNotice();
    });
  });
}

function removePattern(index) {
  chrome.storage.sync.get("whitelist", (data) => {
    const list = data.whitelist || [];
    list.splice(index, 1);
    chrome.storage.sync.set({ whitelist: list }, () => {
      render(list);
      showRefreshNotice();
    });
  });
}

addBtn.addEventListener("click", () => addPattern(urlInput.value));

urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addPattern(urlInput.value);
});

addCurrentBtn.addEventListener("click", () => {
  if (!currentTabUrl) return;

  try {
    const url = new URL(currentTabUrl);
    const pattern = url.origin + "/*";
    addPattern(pattern);
  } catch {
    addPattern(currentTabUrl);
  }
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]?.url) {
    currentTabUrl = tabs[0].url;
  }
  loadWhitelist();
});
