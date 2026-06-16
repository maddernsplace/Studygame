import { firebaseConfig } from "./data/firebase-config.js";

const configured = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId
].every((value) => value && !String(value).startsWith("YOUR_"));

let auth;
let db;
let currentUser = null;
let firebaseApi = null;
const listeners = new Set();

const cloud = {
  configured,
  status: configured ? "Ready to sign in" : "Firebase not configured",
  user: null,
  async signIn() {
    ensureConfigured();
    await ensureFirebase();
    setStatus("Opening Google sign-in");
    const provider = new firebaseApi.GoogleAuthProvider();
    const result = await firebaseApi.signInWithPopup(auth, provider);
    currentUser = result.user;
    cloud.user = publicUser(currentUser);
    setStatus(`Signed in as ${cloud.user.email || cloud.user.name}`);
    return cloud.user;
  },
  async signOut() {
    ensureConfigured();
    await ensureFirebase();
    await firebaseApi.signOut(auth);
    currentUser = null;
    cloud.user = null;
    setStatus("Signed out");
  },
  async load() {
    ensureSignedIn();
    setStatus("Loading cloud progress");
    const snapshot = await firebaseApi.getDoc(progressRef());
    if (!snapshot.exists()) {
      setStatus("No cloud progress yet");
      return null;
    }
    setStatus("Cloud progress loaded");
    return snapshot.data().state || null;
  },
  async save(state) {
    ensureSignedIn();
    setStatus("Saving cloud progress");
    await firebaseApi.setDoc(progressRef(), {
      state,
      updatedAt: firebaseApi.serverTimestamp()
    }, { merge: true });
    setStatus("Cloud progress saved");
  },
  onChange(callback) {
    listeners.add(callback);
    callback(snapshot());
    return () => listeners.delete(callback);
  },
  snapshot
};

window.SchoolCloud = cloud;
window.dispatchEvent(new CustomEvent("school-cloud-ready", { detail: snapshot() }));

if (configured) {
  ensureFirebase().catch((error) => setStatus(error.message));
}

async function ensureFirebase() {
  if (firebaseApi) return;

  const [
    appModule,
    authModule,
    firestoreModule
  ] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js")
  ]);

  const app = appModule.initializeApp(firebaseConfig);
  auth = authModule.getAuth(app);
  db = firestoreModule.getFirestore(app);

  firebaseApi = {
    GoogleAuthProvider: authModule.GoogleAuthProvider,
    doc: firestoreModule.doc,
    getDoc: firestoreModule.getDoc,
    onAuthStateChanged: authModule.onAuthStateChanged,
    serverTimestamp: firestoreModule.serverTimestamp,
    setDoc: firestoreModule.setDoc,
    signInWithPopup: authModule.signInWithPopup,
    signOut: authModule.signOut
  };

  firebaseApi.onAuthStateChanged(auth, (user) => {
    currentUser = user;
    cloud.user = publicUser(user);
    setStatus(user ? `Signed in as ${cloud.user.email || cloud.user.name}` : "Ready to sign in");
  });
}

function progressRef() {
  return firebaseApi.doc(db, "schoolQuestProgress", currentUser.uid);
}

function ensureConfigured() {
  if (!configured) {
    throw new Error("Firebase is not configured yet.");
  }
}

function ensureSignedIn() {
  ensureConfigured();
  if (!currentUser || !firebaseApi) {
    throw new Error("Sign in first.");
  }
}

function publicUser(user) {
  if (!user) return null;
  return {
    uid: user.uid,
    name: user.displayName || "Google account",
    email: user.email || ""
  };
}

function setStatus(status) {
  cloud.status = status;
  window.dispatchEvent(new CustomEvent("school-cloud-change", { detail: snapshot() }));
  listeners.forEach((listener) => listener(snapshot()));
}

function snapshot() {
  return {
    configured: cloud.configured,
    status: cloud.status,
    user: cloud.user
  };
}
