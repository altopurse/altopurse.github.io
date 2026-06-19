
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  // TU CONFIG AQUÍ
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const navAuth = document.getElementById("nav-auth");
const menuToggle = document.getElementById("menuToggle");

// Toggle menú móvil
menuToggle.addEventListener("click", () => {
  navAuth.classList.toggle("show");
});

// Detectar login
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    let username = user.email;
    if (snap.exists() && snap.data().username) {
      username = snap.data().username;
    }

    navAuth.innerHTML = `
      <span class="username">Hola, ${username}</span>
      <a href="#" id="logoutBtn">Logout</a>
    `;

    document.getElementById("logoutBtn").onclick = () => signOut(auth);

  } else {
    navAuth.innerHTML = `
      <a href="login.html" class="btn-login">Login</a>
      <a href="signup.html" class="btn-signup">Sign Up</a>
    `;
  }
});
