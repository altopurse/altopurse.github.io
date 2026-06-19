// navbar.js – Detecta login y actualiza la navbar

import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const auth = window.firebaseAuth;
const db = window.firebaseDB;

const nav = document.getElementById("nav-auth");

// Detectar login
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Obtener datos del usuario
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    let username = "User";
    if (snap.exists()) {
      username = snap.data().username;
    }

    // Navbar cuando está logeado
    nav.innerHTML = `
      <span class="nav-user">Hola, ${username}</span>
      <button id="logoutBtn" class="nav-btn">Logout</button>
    `;

    // Botón logout
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "index.html";
    });

  } else {
    // Navbar cuando NO está logeado
    nav.innerHTML = `
      <a href="login.html">Login</a>
      <a href="signup.html">Sign Up</a>
    `;
  }
});
