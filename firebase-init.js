// firebase-init.js — initialise Firebase once and expose globals
// Include this as the FIRST <script type="module"> on every page.

import { initializeApp }  from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { getFunctions }   from "https://www.gstatic.com/firebasejs/12.15.0/firebase-functions.js";

const firebaseConfig = {
  apiKey:            "AIzaSyBbC2njj5kAfv_Vn-q8bMJBVofvBTFTtuk",
  authDomain:        "backend-for-my-web.firebaseapp.com",
  projectId:         "backend-for-my-web",
  storageBucket:     "backend-for-my-web.firebasestorage.app",
  messagingSenderId: "401686560458",
  appId:             "1:401686560458:web:9182e39977b60e97547e33",
};

const app = initializeApp(firebaseConfig);

window.firebaseAuth      = getAuth(app);
window.firebaseDB        = getFirestore(app);   // 🔥 ahora apunta a (default)
window.firebaseFunctions = getFunctions(app);
