// navbar.js – handles navbar rendering and logout

const auth = window.firebaseAuth;

const navAuth = document.getElementById("nav-auth");
const logo = document.getElementById("logo");
const menuToggle = document.getElementById("menuToggle");

function renderLoggedOutNav() {
  navAuth.innerHTML = `
    <a href="login.html" class="nav-link">Log in</a>
    <a href="signup.html" class="nav-link">Sign up</a>
  `;
}

function renderLoggedInNav() {
  navAuth.innerHTML = `
    <a href="#" class="nav-link" id="nav-dashboard-link">Dashboard</a>
    <button id="nav-logout-btn" class="btn small danger">Logout</button>
  `;
}

if (logo) {
  logo.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    navAuth.classList.toggle("open");
  });
}

import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (user) {
    renderLoggedInNav();
  } else {
    renderLoggedOutNav();
  }
});

document.addEventListener("click", async (e) => {
  if (e.target.id === "nav-logout-btn") {
    await signOut(auth);
    window.location.href = "index.html";
  }
  if (e.target.id === "nav-dashboard-link") {
    const dashboard = document.getElementById("dashboard");
    const landing = document.getElementById("landing");
    if (dashboard && landing) {
      dashboard.scrollIntoView({ behavior: "smooth" });
    }
  }
});
