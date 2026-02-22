(() => {
  const el = {
    mermaidInput: document.getElementById("mermaidInput"),
    mermaidOutput: document.getElementById("mermaidOutput"),
    fileStatus: document.getElementById("fileStatus"),
    renderStatus: document.getElementById("renderStatus"),
    loadGithubBtn: document.getElementById("loadGithubBtn"),
    loadDiskBtn: document.getElementById("loadDiskBtn"),
    saveGithubBtn: document.getElementById("saveGithubBtn"),
    saveDiskBtn: document.getElementById("saveDiskBtn"),
    copyShareBtn: document.getElementById("copyShareBtn"),
    diskFileInput: document.getElementById("diskFileInput"),
    githubModal: document.getElementById("githubModal"),
    closeGithubModalBtn: document.getElementById("closeGithubModalBtn"),
    ghToken: document.getElementById("ghToken"),
    ghOwner: document.getElementById("ghOwner"),
    ghRepo: document.getElementById("ghRepo"),
    ghBranch: document.getElementById("ghBranch"),
    connectGithubBtn: document.getElementById("connectGithubBtn"),
    githubCurrentPath: document.getElementById("githubCurrentPath"),
    goUpBtn: document.getElementById("goUpBtn"),
    githubFileList: document.getElementById("githubFileList"),
    githubStatus: document.getElementById("githubStatus")
  };

  const state = {
    fileLoaded: false,
    currentFile: null,
    githubSettings: {
      token: "",
      owner: "",
      repo: "",
      branch: APP_CONST.defaultBranch
    },
    browserPath: ""
  };

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "default"
  });

  function init() {
    bindEvents();
    restoreGithubSettings();
    loadInitialEditorState();
  }

  function bindEvents() {
    el.mermaidInput.addEventListener("input", debounce(onEditorChange, 250));
    el.loadDiskBtn.addEventListener("click", () => el.diskFileInput.click());
    el.diskFileInput.addEventListener("change", onDiskFilePicked);
    el.loadGithubBtn.addEventListener("click", openGithubModal);
    el.closeGithubModalBtn.addEventListener("click", closeGithubModal);
    el.githubModal.addEventListener("click", (event) => {
      if (event.target === el.githubModal) {
        closeGithubModal();
      }
    });
    el.connectGithubBtn.addEventListener("click", connectGithub);
    el.goUpBtn.addEventListener("click", navigateUpGithub);
    el.saveDiskBtn.addEventListener("click", saveToDisk);
    el.saveGithubBtn.addEventListener("click", saveToGithub);
    el.copyShareBtn.addEventListener("click", copyShareUrl);
  }

  function loadInitialEditorState() {
    const codeFromUrl = getCodeFromUrl();
    if (codeFromUrl) {
      el.mermaidInput.value = codeFromUrl;
      renderAndPersist();
      setFileLoaded(false);
      setFileStatus(APP_CONST.labels.noFileLoaded);
      return;
    }

    const persistedCode = localStorage.getItem(APP_CONST.storage.code);
    if (persistedCode) {
      el.mermaidInput.value = persistedCode;
      const persistedMeta = getPersistedFileMeta();
      if (persistedMeta) {
        state.currentFile = persistedMeta;
        setFileLoaded(true);
        setFileStatus(formatFileStatus(persistedMeta));
      }
      renderAndPersist();
      return;
    }

    el.mermaidInput.value = APP_CONST.defaultMermaidCode;
    renderAndPersist();
  }

  function getPersistedFileMeta() {
    const raw = localStorage.getItem(APP_CONST.storage.fileMeta);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function onEditorChange() {
    renderAndPersist();
  }

  async function renderAndPersist() {
    const code = el.mermaidInput.value;
    localStorage.setItem(APP_CONST.storage.code, code);
    updateUrlWithCode(code);

    if (!code.trim()) {
      el.mermaidOutput.innerHTML = "";
      setRenderStatus(APP_CONST.labels.renderReady, "");
      return;
    }

    try {
      const id = `mmd-${Date.now()}`;
      const { svg } = await mermaid.render(id, code);
      el.mermaidOutput.innerHTML = svg;
      setRenderStatus(APP_CONST.labels.renderOk, "success");
    } catch (error) {
      el.mermaidOutput.innerHTML = `<pre>${escapeHtml(String(error))}</pre>`;
      setRenderStatus(APP_CONST.labels.renderError, "error");
    }
  }

  function openGithubModal() {
    el.githubModal.classList.remove("hidden");
    setGithubStatus(APP_CONST.messages.authHint, "");
  }

  function closeGithubModal() {
    el.githubModal.classList.add("hidden");
  }

  function connectGithub() {
    const settings = {
      token: el.ghToken.value.trim(),
      owner: el.ghOwner.value.trim(),
      repo: el.ghRepo.value.trim(),
      branch: el.ghBranch.value.trim() || APP_CONST.defaultBranch
    };

    if (!settings.token || !settings.owner || !settings.repo) {
      setGithubStatus("Token, owner, and repository are required.", "error");
      return;
    }

    state.githubSettings = settings;
    localStorage.setItem(APP_CONST.storage.github, JSON.stringify(settings));
    listGithubDirectory("");
  }

  async function listGithubDirectory(path) {
    try {
      setGithubStatus(APP_CONST.messages.loading, "");
      const encodedPath = encodePath(path);
      const endpoint = `/repos/${state.githubSettings.owner}/${state.githubSettings.repo}/contents/${encodedPath}?ref=${encodeURIComponent(state.githubSettings.branch)}`;
      const data = await githubRequest(endpoint);

      if (!Array.isArray(data)) {
        setGithubStatus("Selected path is not a directory.", "error");
        return;
      }

      state.browserPath = path;
      el.githubCurrentPath.textContent = `/${path}`.replace(/\/$/, "") || "/";
      renderFileList(data);
      setGithubStatus("Connected.", "success");
    } catch (error) {
      setGithubStatus(String(error), "error");
    }
  }

  function renderFileList(items) {
    el.githubFileList.innerHTML = "";

    const directories = items
      .filter((item) => item.type === "dir")
      .sort((a, b) => a.name.localeCompare(b.name));

    const files = items
      .filter((item) => item.type === "file" && hasAllowedExtension(item.name))
      .sort((a, b) => a.name.localeCompare(b.name));

    const rows = [...directories, ...files];

    if (!rows.length) {
      const li = document.createElement("li");
      li.className = "file-item";
      li.textContent = "No matching files in this directory.";
      el.githubFileList.appendChild(li);
      return;
    }

    rows.forEach((item) => {
      const li = document.createElement("li");
      li.className = "file-item";

      const left = document.createElement("span");
      left.className = item.type === "dir" ? "dir" : "file";
      left.textContent = item.type === "dir" ? `?? ${item.name}` : item.name;

      const action = document.createElement("button");
      if (item.type === "dir") {
        action.textContent = "Open";
        action.addEventListener("click", () => listGithubDirectory(item.path));
      } else {
        action.textContent = "Load";
        action.addEventListener("click", () => loadGithubFile(item.path));
      }

      li.append(left, action);
      el.githubFileList.appendChild(li);
    });
  }

  function navigateUpGithub() {
    if (!state.browserPath) {
      return;
    }
    const segments = state.browserPath.split("/").filter(Boolean);
    segments.pop();
    const parentPath = segments.join("/");
    listGithubDirectory(parentPath);
  }

  async function loadGithubFile(path) {
    try {
      setGithubStatus(APP_CONST.messages.loading, "");
      const endpoint = `/repos/${state.githubSettings.owner}/${state.githubSettings.repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(state.githubSettings.branch)}`;
      const data = await githubRequest(endpoint);
      const code = decodeContentFromGithub(data.content || "");

      el.mermaidInput.value = code;
      state.currentFile = {
        source: "github",
        name: data.name,
        path: data.path,
        sha: data.sha
      };

      persistFileMeta();
      setFileLoaded(true);
      setFileStatus(formatFileStatus(state.currentFile));
      closeGithubModal();
      renderAndPersist();
    } catch (error) {
      setGithubStatus(String(error), "error");
    }
  }

  async function saveToGithub() {
    if (!state.fileLoaded) {
      alert(APP_CONST.messages.noFileForSave);
      return;
    }

    if (!isGithubConfigured()) {
      openGithubModal();
      setGithubStatus(APP_CONST.messages.connectFirst, "error");
      return;
    }

    let targetPath = state.currentFile?.source === "github" ? state.currentFile.path : "";

    if (!targetPath) {
      const defaultName = ensureExtension(state.currentFile?.name || "diagram.mmd");
      const chosen = prompt(APP_CONST.messages.pickPath, defaultName);
      if (!chosen) {
        return;
      }
      targetPath = chosen.trim();
    }

    if (!hasAllowedExtension(targetPath)) {
      alert(APP_CONST.messages.invalidExt);
      return;
    }

    try {
      setRenderStatus(APP_CONST.messages.saving, "");
      const existingSha = await tryGetFileSha(targetPath);
      const code = el.mermaidInput.value;

      const payload = {
        message: `Update ${targetPath} from Mermaid Editor`,
        content: encodeBase64Unicode(code),
        branch: state.githubSettings.branch
      };

      if (existingSha) {
        payload.sha = existingSha;
      }

      const endpoint = `/repos/${state.githubSettings.owner}/${state.githubSettings.repo}/contents/${encodePath(targetPath)}`;
      const result = await githubRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      state.currentFile = {
        source: "github",
        name: targetPath.split("/").pop(),
        path: targetPath,
        sha: result?.content?.sha || existingSha || null
      };

      persistFileMeta();
      setFileLoaded(true);
      setFileStatus(formatFileStatus(state.currentFile));
      setRenderStatus(APP_CONST.messages.saved, "success");
    } catch (error) {
      setRenderStatus(String(error), "error");
    }
  }

  async function tryGetFileSha(path) {
    try {
      const endpoint = `/repos/${state.githubSettings.owner}/${state.githubSettings.repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(state.githubSettings.branch)}`;
      const result = await githubRequest(endpoint);
      return result.sha || null;
    } catch (error) {
      if (String(error).includes("404")) {
        return null;
      }
      throw error;
    }
  }

  function onDiskFilePicked(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!hasAllowedExtension(file.name)) {
      alert(APP_CONST.messages.invalidExt);
      el.diskFileInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      el.mermaidInput.value = text;
      state.currentFile = {
        source: "disk",
        name: file.name,
        path: "",
        sha: null
      };
      persistFileMeta();
      setFileLoaded(true);
      setFileStatus(formatFileStatus(state.currentFile));
      renderAndPersist();
      el.diskFileInput.value = "";
    };
    reader.readAsText(file);
  }

  function saveToDisk() {
    if (!state.fileLoaded) {
      alert(APP_CONST.messages.noFileForSave);
      return;
    }

    const filename = ensureExtension(state.currentFile?.name || "diagram.mmd");
    const blob = new Blob([el.mermaidInput.value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();

    URL.revokeObjectURL(url);
    setRenderStatus(APP_CONST.messages.saved, "success");
  }

  async function copyShareUrl() {
    try {
      const shareUrl = buildShareUrl(el.mermaidInput.value);
      await navigator.clipboard.writeText(shareUrl);
      setRenderStatus(APP_CONST.messages.copied, "success");
    } catch {
      setRenderStatus(APP_CONST.messages.copyFailed, "error");
    }
  }

  function restoreGithubSettings() {
    const raw = localStorage.getItem(APP_CONST.storage.github);
    if (!raw) {
      el.ghBranch.value = APP_CONST.defaultBranch;
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      state.githubSettings = {
        token: parsed.token || "",
        owner: parsed.owner || "",
        repo: parsed.repo || "",
        branch: parsed.branch || APP_CONST.defaultBranch
      };
      el.ghToken.value = state.githubSettings.token;
      el.ghOwner.value = state.githubSettings.owner;
      el.ghRepo.value = state.githubSettings.repo;
      el.ghBranch.value = state.githubSettings.branch;
    } catch {
      el.ghBranch.value = APP_CONST.defaultBranch;
    }
  }

  function setFileLoaded(loaded) {
    state.fileLoaded = loaded;
    el.saveDiskBtn.disabled = !loaded;
    el.saveGithubBtn.disabled = !loaded;
  }

  function persistFileMeta() {
    if (state.currentFile) {
      localStorage.setItem(APP_CONST.storage.fileMeta, JSON.stringify(state.currentFile));
    }
  }

  function setFileStatus(text) {
    el.fileStatus.textContent = text;
  }

  function setRenderStatus(text, className) {
    el.renderStatus.textContent = text;
    el.renderStatus.className = `status-text ${className}`.trim();
  }

  function setGithubStatus(text, className) {
    el.githubStatus.textContent = text;
    el.githubStatus.className = `status-text ${className}`.trim();
  }

  function formatFileStatus(fileMeta) {
    if (!fileMeta) {
      return APP_CONST.labels.noFileLoaded;
    }
    if (fileMeta.source === "github") {
      return `${APP_CONST.labels.loadedFromGithub} ${fileMeta.path}`;
    }
    return `${APP_CONST.labels.loadedFromDisk} ${fileMeta.name}`;
  }

  function isGithubConfigured() {
    return Boolean(
      state.githubSettings.token &&
      state.githubSettings.owner &&
      state.githubSettings.repo &&
      state.githubSettings.branch
    );
  }

  async function githubRequest(endpoint, options = {}) {
    if (!isGithubConfigured()) {
      throw new Error(APP_CONST.messages.connectFirst);
    }

    const response = await fetch(`${APP_CONST.githubApiBase}${endpoint}`, {
      method: options.method || "GET",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${state.githubSettings.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: options.body
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GitHub API ${response.status}: ${text}`);
    }

    return response.json();
  }

  function getCodeFromUrl() {
    if (!window.location.hash) {
      return null;
    }

    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;

    const params = new URLSearchParams(hash);
    const encoded = params.get(APP_CONST.share.paramName);
    if (!encoded) {
      return null;
    }

    try {
      return decodeBase64Unicode(encoded);
    } catch {
      return null;
    }
  }

  function updateUrlWithCode(code) {
    const url = new URL(window.location.href);
    const encoded = encodeBase64Unicode(code);
    url.hash = `${APP_CONST.share.paramName}=${encodeURIComponent(encoded)}`;
    window.history.replaceState({}, "", url);
  }

  function buildShareUrl(code) {
    const url = new URL(window.location.href);
    const encoded = encodeBase64Unicode(code);
    url.hash = `${APP_CONST.share.paramName}=${encodeURIComponent(encoded)}`;
    return url.toString();
  }

  function hasAllowedExtension(name) {
    const lower = name.toLowerCase();
    return APP_CONST.allowedExtensions.some((ext) => lower.endsWith(ext));
  }

  function ensureExtension(filename) {
    if (hasAllowedExtension(filename)) {
      return filename;
    }
    return `${filename}.mmd`;
  }

  function encodePath(path) {
    return path
      .split("/")
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join("/");
  }

  function decodeContentFromGithub(content) {
    const normalized = content.replace(/\n/g, "");
    return decodeBase64Unicode(normalized);
  }

  function encodeBase64Unicode(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  function decodeBase64Unicode(value) {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function debounce(fn, delayMs) {
    let timerId = null;
    return (...args) => {
      if (timerId) {
        clearTimeout(timerId);
      }
      timerId = setTimeout(() => fn(...args), delayMs);
    };
  }

  init();
})();
