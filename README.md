# Mermaid Editor

Client-side Mermaid editor with:
- Split layout (source + live preview)
- Load from GitHub repo (file browser modal)
- Load from disk (`.mmd`, `.mermaid`)
- Save to GitHub and Save to disk
- localStorage persistence
- Shareable URL with base64-encoded Mermaid source in hash

## Run locally
Open `index.html` in a browser.

## GitHub token setup (one-time)
1. In GitHub, create a fine-grained Personal Access Token.
2. Grant repository **Contents: Read and Write** permission.
3. In app UI: `Load from GitHub Repo`.
4. Paste token + owner + repo + branch and click `Connect`.
5. The app stores these values in localStorage in your browser.

## Notes
- This is fully client-side. No backend is used.
- Storing token in localStorage is convenient but less secure on shared devices.

## Connect local folder to remote repo
After creating a remote repository in GitHub, run:

```powershell
cd "c:\Users\Hemant Virmani\github\mmd"
git remote add origin https://github.com/<YOUR_USER_OR_ORG>/<YOUR_REPO>.git
git branch -M main
git add .
git commit -m "Initial Mermaid Editor"
git push -u origin main
```
