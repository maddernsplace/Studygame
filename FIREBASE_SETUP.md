# Firebase Sync Setup

This dashboard keeps working locally without Firebase. To sync student profiles and progress across a laptop, tablet, and future Android app, connect it to Firebase Authentication and Cloud Firestore.

## 1. Create the Firebase project

1. Go to https://console.firebase.google.com/
2. Create a project.
3. Add a Web app.
4. Copy the Firebase config object.
5. Paste the values into `data/firebase-config.js`.

## 2. Enable sign-in

1. In Firebase Console, open Authentication.
2. Enable the Google provider.
3. Add your local testing domain if needed, such as `127.0.0.1` or `localhost`.

## 3. Enable Firestore

1. Open Firestore Database.
2. Create a database.
3. Use production mode.
4. Add the rules from `firestore.rules`:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /schoolQuestProgress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 4. Use it

1. Open the dashboard.
2. Choose `Sign in with Google`.
3. Choose `Save to Cloud` to upload current local progress.
4. On another device, sign in with the same Google account and choose `Load from Cloud`.

The synced document stores all student profiles, worksheet attempt counts, completed days, and scores for that signed-in Google account.

## Optional CLI deploy

Firebase CLI is not required for local testing, but it is useful for deploying the site and rules.

```powershell
npm install -g firebase-tools
firebase login
cd "C:\Users\madde\Documents\New project\school-dashboard"
Copy-Item .firebaserc.example .firebaserc
notepad .firebaserc
firebase deploy
```

In `.firebaserc`, replace `your-firebase-project-id` with the project ID from Firebase Console.
