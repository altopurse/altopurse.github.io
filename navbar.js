// navbar.js — auth-aware navbar for all pages
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const auth       = window.firebaseAuth;
const navAuth    = document.getElementById("nav-auth");
const menuToggle = document.getElementById("menuToggle");

function renderGuest() {
  if (!navAuth) return;
  navAuth.innerHTML = `
    <a href="login.html"  class="nav-link">Log in</a>
    <a href="signup.html" class="nav-link btn-signup">Sign up</a>
  `;
}

function renderUser() {
  if (!navAuth) return;
  navAuth.innerHTML = `
    <a href="index.html"      class="nav-link">Dashboard</a>
    <a href="buy-credits.html" class="nav-link">Buy Credits</a>
    <button id="nav-logout-btn" class="btn-logout">Logout</button>
  `;
}

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    navAuth?.classList.toggle("open");
  });
}

onAuthStateChanged(auth, (user) => {
  user ? renderUser() : renderGuest();
});

document.addEventListener("click", async (e) => {
  if (e.target.id === "nav-logout-btn") {
    await signOut(auth);
    window.location.href = "index.html";
  }
});
