# Detailed setup guide (Windows PowerShell)

## A. Prerequisites
Install current Node.js LTS from https://nodejs.org/ and Git from https://git-scm.com/downloads. Check:
```powershell
node --version
npm --version
git --version
```

## B. Firebase setup
1. Create a project at https://console.firebase.google.com/.
2. Enable Authentication → Sign-in method → Email/Password.
3. Create Firestore Database.
4. Register a Web App in Project Settings and copy the web config into `frontend/.env`.
5. Create an Authentication user manually for your first admin.
6. For local backend development, download a service account JSON only if needed and store it OUTSIDE this repository, such as `C:\Users\YOUR_USER\secure\firebase-admin.json`.
7. Set `FIREBASE_PROJECT_ID` and `GOOGLE_APPLICATION_CREDENTIALS` in `backend/.env`.
8. Publish the restrictive rules from `docs/firestore.rules` using the Firebase console or Firebase CLI.

## C. Environment files
Copy examples:
```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```
Fill in real values locally. Never commit `.env`.

## D. Assign role
From `backend/`:
```powershell
npm install
npm run set-role -- --uid FIREBASE_AUTH_UID --role admin
```
The UID is in Firebase Console → Authentication → Users. Log out and log back in after changing claims.

## E. Start locally
Terminal 1:
```powershell
cd backend
npm install
npm run dev
```
Terminal 2:
```powershell
cd frontend
npm install
npm run dev
```
Open the URL printed by Vite. Backend health check: `http://localhost:4000/api/health`.

## F. Seed fictional records
After setting up credentials and an admin role:
```powershell
cd backend
npm run seed
```
This creates deterministic fictional sample documents. Do not use real patient information.

## G. Common issues
- `auth/invalid-api-key`: verify frontend `.env` values and restart Vite.
- `Firebase ID token has no role`: assign the custom claim, then sign out/in.
- `Could not load default credentials`: verify `GOOGLE_APPLICATION_CREDENTIALS` points to a readable file outside the repo.
- CORS error: ensure `FRONTEND_ORIGIN` exactly matches the frontend origin, including scheme and port.
- `Missing or insufficient permissions`: the backend uses Admin SDK; check credentials/project ID. Browser Firestore writes are intentionally denied.
- Vite env changes: stop and restart `npm run dev`.
