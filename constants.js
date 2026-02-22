const APP_CONST = {
  title: "Mermaid Editor",
  defaultBranch: "main",
  defaultMermaidCode: [
    "flowchart TD",
    "  A[Start] --> B{Choose Source}",
    "  B -->|GitHub| C[Load from Repo]",
    "  B -->|Disk| D[Load from Disk]",
    "  C --> E[Edit & Save]",
    "  D --> E",
    "  E --> F[Share URL]"
  ].join("\n"),
  allowedExtensions: [".mmd", ".mermaid"],
  storage: {
    code: "mmd_code",
    fileMeta: "mmd_file_meta",
    github: "mmd_github"
  },
  githubApiBase: "https://api.github.com",
  labels: {
    noFileLoaded: "No file loaded",
    loadedFromGithub: "Loaded from GitHub:",
    loadedFromDisk: "Loaded from Disk:",
    renderReady: "Ready",
    renderError: "Render error",
    renderOk: "Rendered"
  },
  share: {
    paramName: "code"
  },
  messages: {
    connectFirst: "Connect to GitHub first.",
    noFileForSave: "Load a file before saving.",
    copied: "Share URL copied to clipboard.",
    copyFailed: "Copy failed. You can copy from your address bar.",
    loading: "Loading...",
    saving: "Saving...",
    saved: "Saved.",
    invalidExt: "Selected file is not .mmd or .mermaid",
    pickPath: "Enter repository path (for example: diagrams/flow.mmd):",
    authHint: "Create a fine-grained PAT with repo contents read/write access."
  }
};
