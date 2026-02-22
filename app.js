(() => {
  const el = {
    mermaidInput: document.getElementById("mermaidInput"),
    mermaidOutput: document.getElementById("mermaidOutput"),
    fileStatus: document.getElementById("fileStatus"),
    renderStatus: document.getElementById("renderStatus"),
    loadDiskBtn: document.getElementById("loadDiskBtn"),
    saveDiskBtn: document.getElementById("saveDiskBtn"),
    copyShareBtn: document.getElementById("copyShareBtn"),
    diskFileInput: document.getElementById("diskFileInput")
  };

  const state = {
    fileLoaded: false,
    currentFile: null
  };

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "default"
  });

  function init() {
    bindEvents();
    loadInitialEditorState();
  }

  function bindEvents() {
    el.mermaidInput.addEventListener("input", debounce(onEditorChange, 250));
    el.loadDiskBtn.addEventListener("click", () => el.diskFileInput.click());
    el.diskFileInput.addEventListener("change", onDiskFilePicked);
    el.saveDiskBtn.addEventListener("click", saveToDisk);
    el.copyShareBtn.addEventListener("click", copyShareUrl);
  }

  function loadInitialEditorState() {
    const codeFromUrl = getCodeFromUrl();
    if (codeFromUrl) {
      el.mermaidInput.value = codeFromUrl;
      setFileLoaded(false);
      setFileStatus(APP_CONST.labels.noFileLoaded);
      renderAndPersist();
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
    setFileStatus(APP_CONST.labels.noFileLoaded);
    renderAndPersist();
  }

  function getPersistedFileMeta() {
    const raw = localStorage.getItem(APP_CONST.storage.fileMeta);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw);
      return parsed?.source === "disk" ? parsed : null;
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
        name: file.name
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

  function setFileLoaded(loaded) {
    state.fileLoaded = loaded;
    el.saveDiskBtn.disabled = !loaded;
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

  function formatFileStatus(fileMeta) {
    if (!fileMeta) {
      return APP_CONST.labels.noFileLoaded;
    }
    return `${APP_CONST.labels.loadedFromDisk} ${fileMeta.name}`;
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
