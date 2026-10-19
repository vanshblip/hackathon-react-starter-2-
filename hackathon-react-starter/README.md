# HackLab — React Hackathon Starter

A beginner-friendly React + JavaScript starter for a short hackathon. The prototype lab is intentionally a local input/output placeholder. Replace its demo logic with the requirements from the official problem statement.

## Requirements
- Node.js 20.19+ or 22.12+ recommended
- VS Code
- Internet for the first dependency install (the app itself runs locally after installation)

## Run on Windows (PowerShell)
1. Extract this folder somewhere convenient, for example `D:\hackathon-react-starter`.
2. Open that folder in VS Code (`File > Open Folder`).
3. Open the integrated terminal (`Terminal > New Terminal`).
4. Run:

   ```powershell
   npm install
   npm run dev
   ```

5. Open the local URL Vite prints, usually `http://localhost:5173/`.

## Verify before the event
Run:

```powershell
npm run build
```

A successful build creates the production files in `dist/`.

## Main files
- `src/App.jsx` — page, interactions, checklist, and the placeholder `runDemo()` function.
- `src/styles.css` — responsive styling.
- `src/main.jsx` — React entry point.
- `index.html` — page metadata.

## When the problem statement arrives
1. Save the exact statement and judging criteria.
2. List mandatory features and constraints.
3. Replace the placeholder input/output behavior in `runDemo()` with the real required logic.
4. Update the labels and interface so they describe the actual problem.
5. Build and test the main user journey, empty input, invalid input, and an edge case.
6. Keep a working version before asking an AI coding tool to make large changes.

## Important
- This starter does not contain the final hackathon solution or any AI model/API integration.
- The starter demo only echoes the submitted text and explains where to replace it.
- Do not claim that a feature, API, model, or test works unless you have run and verified it.
- The Google Fonts import is optional; if offline, the interface uses fallback fonts.
