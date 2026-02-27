const APP_CONST = {
  title: "Mermaid Editor",
  defaultMermaidCode: [
    "flowchart TD",
    "  A[Start] --> B[Load from Disk]",
    "  B --> C[Edit Mermaid Code]",
    "  C --> D[Save to Disk]",
    "  D --> E[Share URL]"
  ].join("\n"),
  allowedExtensions: [".mmd", ".mermaid"],
  storage: {
    code: "mmd_code",
    fileMeta: "mmd_file_meta",
    splitRatio: "mmd_split_ratio"
  },
  layout: {
    defaultSplitRatio: 0.4,
    minSplitRatio: 0.4,
    maxSplitRatio: 0.4,
    keyboardStep: 0.03,
    mobileBreakpoint: 980
  },
  labels: {
    noFileLoaded: "No file loaded",
    loadedFromDisk: "Loaded from Disk:",
    unsavedDraft: "Unsaved draft",
    renderReady: "Ready",
    renderError: "Render error",
    renderOk: "Rendered"
  },
  share: {
    paramName: "code"
  },
  messages: {
    noFileForSave: "Load a file before saving.",
    copied: "Share URL copied to clipboard.",
    copyFailed: "Copy failed. You can copy from your address bar.",
    saved: "Saved.",
    invalidExt: "Selected file is not .mmd or .mermaid"
  }
};
