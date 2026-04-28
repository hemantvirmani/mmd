(() => {
  const el = {
    splitLayout: document.querySelector(".split-layout"),
    splitter: document.getElementById("splitter"),
    mermaidInput: document.getElementById("mermaidInput"),
    mermaidOutput: document.getElementById("mermaidOutput"),
    fileStatus: document.getElementById("fileStatus"),
    renderStatus: document.getElementById("renderStatus"),
    loadDiskBtn: document.getElementById("loadDiskBtn"),
    saveDiskBtn: document.getElementById("saveDiskBtn"),
    copyShareBtn: document.getElementById("copyShareBtn"),
    diskFileInput: document.getElementById("diskFileInput"),
    prismHighlight: document.getElementById("prismHighlight"),
    prismPre: document.querySelector(".prism-editor-wrap pre"),
    downloadSvgBtn: document.getElementById("downloadSvgBtn"),
    themeSelect: document.getElementById("themeSelect")
  };

  const state = {
    fileLoaded: false,
    currentFile: null,
    splitRatio: APP_CONST.layout.defaultSplitRatio,
    isResizing: false,
    theme: "default"
  };

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "default"
  });

  if (typeof Prism !== "undefined" && Prism.plugins?.autoloader) {
    Prism.plugins.autoloader.languages_path =
      "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/";
  }

  function init() {
    restoreSplitPreference();
    restoreThemePreference();
    bindEvents();
    loadInitialEditorState();
  }

  function bindEvents() {
    el.mermaidInput.addEventListener("keydown", onEditorKeyDown);
    el.mermaidInput.addEventListener("input", updateHighlight);
    el.mermaidInput.addEventListener("input", markDraftFromEditor);
    el.mermaidInput.addEventListener("input", debounce(onEditorChange, 250));
    el.mermaidInput.addEventListener("scroll", syncEditorScroll);
    el.loadDiskBtn.addEventListener("click", () => el.diskFileInput.click());
    el.diskFileInput.addEventListener("change", onDiskFilePicked);
    el.saveDiskBtn.addEventListener("click", saveToDisk);
    el.copyShareBtn.addEventListener("click", copyShareUrl);
    el.downloadSvgBtn.addEventListener("click", downloadSvg);
    el.themeSelect.addEventListener("change", onThemeChange);
    el.splitter.addEventListener("pointerdown", onSplitterPointerDown);
    el.splitter.addEventListener("keydown", onSplitterKeyDown);
    window.addEventListener("resize", applySplitRatioForCurrentViewport);
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
      if (parsed?.source === "disk" || parsed?.source === "draft") {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  function onEditorChange() {
    renderAndPersist();
  }

  function markDraftFromEditor() {
    if (state.currentFile?.source === "disk") {
      return;
    }

    const hasText = el.mermaidInput.value.trim().length > 0;
    if (!hasText) {
      return;
    }

    if (!state.fileLoaded) {
      setFileLoaded(true);
    }

    state.currentFile = {
      source: "draft",
      name: ensureExtension(state.currentFile?.name || "diagram.mmd")
    };
    persistFileMeta();
    setFileStatus(APP_CONST.labels.unsavedDraft);
  }

  async function renderAndPersist() {
    updateHighlight();
    const code = el.mermaidInput.value;
    localStorage.setItem(APP_CONST.storage.code, code);
    updateUrlWithCode(code);

    if (!code.trim()) {
      el.mermaidOutput.innerHTML = "";
      el.downloadSvgBtn.disabled = true;
      setRenderStatus(APP_CONST.labels.renderReady, "");
      return;
    }

    const id = `mmd-${Date.now()}`;
    const scratchpad = document.createElement("div");
    scratchpad.style.cssText = "visibility:hidden;position:fixed;top:0;left:0;pointer-events:none;";
    document.body.appendChild(scratchpad);
    try {
      const { svg } = await mermaid.render(id, code, scratchpad);
      el.mermaidOutput.innerHTML = svg;
      el.downloadSvgBtn.disabled = false;
      setRenderStatus(APP_CONST.labels.renderOk, "success");
    } catch (err) {
      const msg = getMermaidErrorText(err);
      el.mermaidOutput.innerHTML = `<pre class="render-error-msg">${escapeHtml(msg)}</pre>`;
      el.downloadSvgBtn.disabled = true;
      setRenderStatus(APP_CONST.labels.renderError, "error");
    } finally {
      scratchpad.remove();
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

  function downloadSvg() {
    const svgEl = el.mermaidOutput.querySelector("svg");
    if (!svgEl) return;
    const svgStr = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const baseName = state.currentFile?.name?.replace(/\.(mmd|mermaid)$/i, "") || "diagram";
    anchor.download = `${baseName}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
    setRenderStatus(APP_CONST.messages.downloadedSvg, "success");
  }

  function onThemeChange() {
    state.theme = el.themeSelect.value;
    localStorage.setItem(APP_CONST.storage.theme, state.theme);
    mermaid.initialize({ startOnLoad: false, securityLevel: "loose", theme: state.theme });
    renderAndPersist();
  }

  function restoreThemePreference() {
    const saved = localStorage.getItem(APP_CONST.storage.theme);
    if (saved && APP_CONST.themes.includes(saved)) {
      state.theme = saved;
      el.themeSelect.value = saved;
      mermaid.initialize({ startOnLoad: false, securityLevel: "loose", theme: saved });
    }
  }

  function getMermaidErrorText(err) {
    if (!err) return "Unknown render error";
    const msg = err.message || err.str || String(err);
    return typeof msg === "string" && !msg.includes("<") ? msg : "Syntax error — check your diagram";
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

  function restoreSplitPreference() {
    const raw = localStorage.getItem(APP_CONST.storage.splitRatio);
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      applySplitRatio(APP_CONST.layout.defaultSplitRatio, false);
      return;
    }
    applySplitRatio(parsed, false);
  }

  function applySplitRatioForCurrentViewport() {
    applySplitRatio(state.splitRatio, false);
  }

  function onSplitterPointerDown(event) {
    if (isMobileViewport()) {
      return;
    }
    state.isResizing = true;
    document.body.classList.add("is-resizing");
    el.splitter.setPointerCapture(event.pointerId);

    updateSplitRatioFromPointer(event.clientX);

    window.addEventListener("pointermove", onSplitterPointerMove);
    window.addEventListener("pointerup", onSplitterPointerUp);
  }

  function onSplitterPointerMove(event) {
    if (!state.isResizing) {
      return;
    }
    updateSplitRatioFromPointer(event.clientX);
  }

  function onSplitterPointerUp() {
    if (!state.isResizing) {
      return;
    }
    state.isResizing = false;
    document.body.classList.remove("is-resizing");
    localStorage.setItem(APP_CONST.storage.splitRatio, String(state.splitRatio));

    window.removeEventListener("pointermove", onSplitterPointerMove);
    window.removeEventListener("pointerup", onSplitterPointerUp);
  }

  function onSplitterKeyDown(event) {
    if (isMobileViewport()) {
      return;
    }

    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    const delta = event.key === "ArrowLeft"
      ? -APP_CONST.layout.keyboardStep
      : APP_CONST.layout.keyboardStep;
    applySplitRatio(state.splitRatio + delta, true);
  }

  function updateSplitRatioFromPointer(clientX) {
    const rect = el.splitLayout.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }
    const ratio = (clientX - rect.left) / rect.width;
    applySplitRatio(ratio, true);
  }

  function applySplitRatio(ratio, persistPreference) {
    const clamped = clamp(
      ratio,
      APP_CONST.layout.minSplitRatio,
      APP_CONST.layout.maxSplitRatio
    );
    state.splitRatio = clamped;

    if (isMobileViewport()) {
      el.splitLayout.style.removeProperty("--left-pane-width");
      el.splitLayout.style.removeProperty("--right-pane-width");
      return;
    }

    const leftWidth = `${(clamped * 100).toFixed(2)}fr`;
    const rightWidth = `${((1 - clamped) * 100).toFixed(2)}fr`;
    el.splitLayout.style.setProperty("--left-pane-width", leftWidth);
    el.splitLayout.style.setProperty("--right-pane-width", rightWidth);

    if (persistPreference) {
      localStorage.setItem(APP_CONST.storage.splitRatio, String(clamped));
    }
  }

  function isMobileViewport() {
    return window.innerWidth <= APP_CONST.layout.mobileBreakpoint;
  }

  function formatFileStatus(fileMeta) {
    if (!fileMeta) {
      return APP_CONST.labels.noFileLoaded;
    }
    if (fileMeta.source === "draft") {
      return APP_CONST.labels.unsavedDraft;
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

  function debounce(fn, delayMs) {
    let timerId = null;
    return (...args) => {
      if (timerId) {
        clearTimeout(timerId);
      }
      timerId = setTimeout(() => fn(...args), delayMs);
    };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function onEditorKeyDown(event) {
    const ta = el.mermaidInput;

    if (event.key === "Tab") {
      event.preventDefault();
      if (!event.shiftKey && ta.selectionStart === ta.selectionEnd) {
        document.execCommand("insertText", false, "    ");
      } else {
        indentLines(ta, event.shiftKey);
      }
      ta.dispatchEvent(new Event("input"));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const start = ta.selectionStart;
      const currentLine = ta.value.slice(0, start).split("\n").pop();
      const indent = currentLine.match(/^(\s*)/)[1];
      document.execCommand("insertText", false, "\n" + indent);
      ta.dispatchEvent(new Event("input"));
    }
  }

  function indentLines(ta, dedent) {
    const value = ta.value;
    const selStart = ta.selectionStart;
    const selEnd = ta.selectionEnd;

    const lineStart = value.lastIndexOf("\n", selStart - 1) + 1;
    const selEndAdj = selEnd > selStart && value[selEnd - 1] === "\n" ? selEnd - 1 : selEnd;
    const lineEndIdx = value.indexOf("\n", selEndAdj);
    const blockEnd = lineEndIdx === -1 ? value.length : lineEndIdx;

    const lines = value.slice(lineStart, blockEnd).split("\n");
    let newSelStart = selStart;
    let newSelEnd = selEnd;

    const newLines = lines.map((line, i) => {
      if (dedent) {
        const spaces = Math.min(4, line.match(/^ */)[0].length);
        if (i === 0) newSelStart = Math.max(lineStart, selStart - spaces);
        newSelEnd -= spaces;
        return line.slice(spaces);
      } else {
        if (i === 0) newSelStart += 4;
        newSelEnd += 4;
        return "    " + line;
      }
    });

    ta.value = value.slice(0, lineStart) + newLines.join("\n") + value.slice(blockEnd);
    ta.selectionStart = Math.max(0, newSelStart);
    ta.selectionEnd = Math.max(newSelStart, newSelEnd);
  }

  function updateHighlight() {
    if (!el.prismHighlight) return;
    // Trailing newline prevents the last line from collapsing in height
    el.prismHighlight.textContent = el.mermaidInput.value + "\n";
    if (typeof Prism !== "undefined") {
      Prism.highlightElement(el.prismHighlight);
    }
  }

  function syncEditorScroll() {
    if (!el.prismPre) return;
    el.prismPre.scrollTop = el.mermaidInput.scrollTop;
    el.prismPre.scrollLeft = el.mermaidInput.scrollLeft;
  }

  init();
})();
