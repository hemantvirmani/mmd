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
    splitRatio: "mmd_split_ratio",
    theme: "mmd_theme"
  },
  themes: ["default", "dark", "forest", "neutral", "base"],
  layout: {
    defaultSplitRatio: 0.4,
    minSplitRatio: 0.25,
    maxSplitRatio: 0.75,
    keyboardStep: 0.03,
    mobileBreakpoint: 980,
    minZoom: 0.25,
    maxZoom: 4,
    zoomStep: 0.25
  },
  labels: {
    noFileLoaded: "No file loaded",
    loadedFromDisk: "Loaded from Disk:",
    unsavedDraft: "Unsaved draft",
    renderReady: "Ready",
    renderError: "Render error",
    renderOk: "Rendered"
  },
  samples: [
    {
      label: "Flowchart",
      code: [
        "flowchart TD",
        "  A[Start] --> B{Decision?}",
        "  B -->|Yes| C[Action A]",
        "  B -->|No| D[Action B]",
        "  C --> E[End]",
        "  D --> E"
      ].join("\n")
    },
    {
      label: "Sequence",
      code: [
        "sequenceDiagram",
        "  Alice->>Bob: Hello, how are you?",
        "  Bob-->>Alice: Great, thanks!",
        "  Alice->>Bob: See you later!"
      ].join("\n")
    },
    {
      label: "Class",
      code: [
        "classDiagram",
        "  Animal <|-- Dog",
        "  Animal <|-- Cat",
        "  Animal : +String name",
        "  Animal : +speak()",
        "  Dog : +fetch()",
        "  Cat : +purr()"
      ].join("\n")
    },
    {
      label: "Entity Relationship",
      code: [
        "erDiagram",
        "  CUSTOMER ||--o{ ORDER : places",
        "  ORDER ||--|{ LINE-ITEM : contains",
        "  CUSTOMER {",
        "    string name",
        "    string email",
        "  }",
        "  ORDER {",
        "    int id",
        "    date created",
        "  }"
      ].join("\n")
    },
    {
      label: "Gantt",
      code: [
        "gantt",
        "  title Project Plan",
        "  dateFormat YYYY-MM-DD",
        "  section Phase 1",
        "  Design      :a1, 2024-01-01, 7d",
        "  Build       :a2, after a1, 14d",
        "  section Phase 2",
        "  Testing     :a3, after a2, 7d",
        "  Deploy      :a4, after a3, 3d"
      ].join("\n")
    },
    {
      label: "Pie Chart",
      code: [
        "pie title Browser Share",
        "  \"Chrome\" : 65",
        "  \"Safari\" : 19",
        "  \"Firefox\" : 4",
        "  \"Edge\" : 4",
        "  \"Other\" : 8"
      ].join("\n")
    },
    {
      label: "Git Graph",
      code: [
        "gitGraph",
        "  commit",
        "  branch feature",
        "  checkout feature",
        "  commit",
        "  commit",
        "  checkout main",
        "  merge feature",
        "  commit"
      ].join("\n")
    },
    {
      label: "State Diagram",
      code: [
        "stateDiagram-v2",
        "  [*] --> Idle",
        "  Idle --> Running : start",
        "  Running --> Done : complete",
        "  Running --> Error : fail",
        "  Error --> Idle : retry",
        "  Done --> [*]"
      ].join("\n")
    },
    {
      label: "Mind Map",
      code: [
        "mindmap",
        "  root((Topic))",
        "    Subtopic A",
        "      Item 1",
        "      Item 2",
        "    Subtopic B",
        "      Item 3",
        "      Item 4"
      ].join("\n")
    },
    {
      label: "User Journey",
      code: [
        "journey",
        "  title Shopping Experience",
        "  section Browse",
        "    Visit site: 5: User",
        "    Search product: 4: User",
        "  section Purchase",
        "    Add to cart: 5: User",
        "    Checkout: 3: User, System",
        "    Payment: 4: User, System"
      ].join("\n")
    }
  ],
  share: {
    paramName: "code"
  },
  messages: {
    noFileForSave: "Load a file before saving.",
    copied: "Share URL copied to clipboard.",
    copyFailed: "Copy failed. You can copy from your address bar.",
    saved: "Saved.",
    invalidExt: "Selected file is not .mmd or .mermaid",
    downloadedSvg: "SVG downloaded.",
    downloadedPng: "PNG downloaded."
  }
};
