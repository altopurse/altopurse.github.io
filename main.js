// main.js — core app logic for JobLeadHub
// DO NOT add Firebase config here. Auth/DB/Functions come from window globals set in firebase-init.js

import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import {
  httpsCallable,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-functions.js";

// -----------------------------
// Globals from firebase-init.js
// -----------------------------
const auth      = window.firebaseAuth;
const db        = window.firebaseDB;
const functions = window.firebaseFunctions;

// -----------------------------
// DOM — views
// -----------------------------
const landingView   = document.getElementById("landing-view");
const dashboardView = document.getElementById("dashboard-view");

// -----------------------------
// DOM — welcome strip
// -----------------------------
const userUsername = document.getElementById("user-username");
const userCredits  = document.getElementById("user-credits");

// -----------------------------
// DOM — leads
// -----------------------------
const leadsList    = document.getElementById("leads-list");
const leadsEmpty   = document.getElementById("leads-empty");

const purchasedList  = document.getElementById("purchased-list");
const purchasedEmpty = document.getElementById("purchased-empty");

// -----------------------------
// DOM — jobs
// -----------------------------
const jobsList  = document.getElementById("jobs-list");
const jobsEmpty = document.getElementById("jobs-empty");

// -----------------------------
// DOM — logout buttons
// -----------------------------
const logoutBtn    = document.getElementById("logout-btn");      // dashboard card
const navLogoutBtn = document.getElementById("nav-logout-btn");  // navbar

// -----------------------------
// DOM — dashboard job form
// -----------------------------
const dashboardJobForm    = document.getElementById("dashboard-job-form");
const dashboardJobMessage = document.getElementById("dashboard-job-message");

// -----------------------------
// DOM — landing job form
// -----------------------------
const landingJobForm    = document.getElementById("landing-job-form");
const landingJobMessage = document.getElementById("landing-job-message");

// -----------------------------
// Helpers
// -----------------------------
function showView(view) {
  if (landingView)   landingView.classList.add("hidden");
  if (dashboardView) dashboardView.classList.add("hidden");
  if (view)          view.classList.remove("hidden");
}

function setMessage(el, text, type = "") {
  if (!el) return;
  el.textContent = text;
  el.className   = "form-message" + (type ? ` msg-${type}` : "");
}

// -----------------------------
// Auth state observer
// -----------------------------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    showView(dashboardView);
    await loadUserProfile(user.uid);
    await Promise.all([
      loadAvailableLeads(),
      loadPurchasedLeads(user.uid),
      loadMyJobs(user.uid),
    ]);
  } else {
    showView(landingView);
  }
});

// -----------------------------
// Logout
// -----------------------------
async function handleLogout() {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (err) {
    console.error("Logout error:", err);
  }
}

if (logoutBtn)    logoutBtn.addEventListener("click", handleLogout);
if (navLogoutBtn) navLogoutBtn.addEventListener("click", handleLogout);

// -----------------------------
// Load user profile
// -----------------------------
async function loadUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return;

    const data = snap.data();
    if (userUsername) userUsername.textContent = data.username || "there";
    if (userCredits)  userCredits.textContent  = data.credits  ?? 0;
  } catch (err) {
    console.error("Error loading user profile:", err);
  }
}

// -----------------------------
// Load available leads
// -----------------------------
async function loadAvailableLeads() {
  if (!leadsList) return;

  leadsList.innerHTML = "";

  try {
    const snap = await getDocs(collection(db, "leads"));

    if (snap.empty) {
      if (leadsEmpty) leadsEmpty.style.display = "block";
      return;
    }

    if (leadsEmpty) leadsEmpty.style.display = "none";

    snap.forEach((docSnap) => {
      const lead = docSnap.data();
      const card = document.createElement("div");
      card.className = "lead-card";
      card.innerHTML = `
        <h4>${lead.title || "Lead"}</h4>
        <p>${lead.description || ""}</p>
        <p><strong>Location:</strong> ${lead.location || "N/A"}</p>
        <p><strong>Cost:</strong> ${lead.price ?? 0} credits</p>
        <button class="btn btn-primary btn-sm buy-lead-btn" data-lead-id="${docSnap.id}">
          Buy Lead
        </button>
      `;
      leadsList.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading leads:", err);
    if (leadsList) leadsList.innerHTML = "<p class='error-text'>Could not load leads. Please refresh.</p>";
  }
}

// -----------------------------
// Buy lead (event delegation)
// -----------------------------
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".buy-lead-btn");
  if (!btn) return;

  const user = auth.currentUser;
  if (!user) {
    alert("You must be signed in to buy leads.");
    return;
  }

  const leadId = btn.dataset.leadId;
  if (!leadId) return;

  btn.disabled    = true;
  btn.textContent = "Processing…";

  try {
    const buyLead = httpsCallable(functions, "buyLeadWithCredits");
    const result  = await buyLead({ leadId });

    if (result.data?.success) {
      await loadUserProfile(user.uid);
      await loadPurchasedLeads(user.uid);
    } else {
      alert("Could not unlock this lead. Please try again.");
      btn.disabled    = false;
      btn.textContent = "Buy Lead";
    }
  } catch (err) {
    console.error("Error buying lead:", err);
    alert(err.code === "failed-precondition"
      ? "Not enough credits. Top up to continue."
      : "Error buying lead. Please try again."
    );
    btn.disabled    = false;
    btn.textContent = "Buy Lead";
  }
});

// -----------------------------
// Load purchased leads
// -----------------------------
async function loadPurchasedLeads(uid) {
  if (!purchasedList) return;

  purchasedList.innerHTML = "";

  try {
    const q    = query(collection(db, "purchased"), where("userId", "==", uid));
    const snap = await getDocs(q);

    if (snap.empty) {
      if (purchasedEmpty) purchasedEmpty.style.display = "block";
      return;
    }

    if (purchasedEmpty) purchasedEmpty.style.display = "none";

    snap.forEach((docSnap) => {
      const lead = docSnap.data();
      const card = document.createElement("div");
      card.className = "lead-card purchased";
      card.innerHTML = `
        <h4>${lead.title || "Lead"}</h4>
        <p>${lead.description || ""}</p>
        <p><strong>Location:</strong> ${lead.location || "N/A"}</p>
        <p><strong>Contact:</strong> ${lead.contactName || "N/A"}</p>
        <p><strong>Email:</strong> ${lead.contactEmail || "N/A"}</p>
      `;
      purchasedList.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading purchased leads:", err);
    if (purchasedList) purchasedList.innerHTML = "<p class='error-text'>Could not load purchased leads.</p>";
  }
}

// -----------------------------
// Load my posted jobs
// -----------------------------
async function loadMyJobs(uid) {
  if (!jobsList) return;

  jobsList.innerHTML = "";

  try {
    const q    = query(collection(db, "jobs"), where("userId", "==", uid));
    const snap = await getDocs(q);

    if (snap.empty) {
      if (jobsEmpty) jobsEmpty.style.display = "block";
      return;
    }

    if (jobsEmpty) jobsEmpty.style.display = "none";

    snap.forEach((docSnap) => {
      const job  = docSnap.data();
      const card = document.createElement("div");
      card.className = "job-card";
      card.innerHTML = `
        <h4>${job.jobTitle || "Job"}</h4>
        <p><strong>Category:</strong> ${job.jobCategory || "N/A"}</p>
        <p>${job.jobDescription || ""}</p>
        <p><strong>Location:</strong> ${job.jobLocation || "N/A"}</p>
      `;
      jobsList.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading jobs:", err);
    if (jobsList) jobsList.innerHTML = "<p class='error-text'>Could not load your jobs.</p>";
  }
}

// -----------------------------
// Dashboard — post job form
// -----------------------------
if (dashboardJobForm) {
  dashboardJobForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      setMessage(dashboardJobMessage, "You must be signed in to post a job.", "error");
      return;
    }

    setMessage(dashboardJobMessage, "Submitting…");

    const jobTitle       = document.getElementById("dashboard-job-title").value.trim();
    const jobCategory    = document.getElementById("dashboard-job-category").value;
    const jobDescription = document.getElementById("dashboard-job-description").value.trim();
    const jobLocation    = document.getElementById("dashboard-job-location").value.trim();

    if (!jobTitle || !jobCategory || !jobDescription || !jobLocation) {
      setMessage(dashboardJobMessage, "Please fill in all fields.", "error");
      return;
    }

    try {
      await addDoc(collection(db, "jobs"), {
        userId: user.uid,
        jobTitle,
        jobCategory,
        jobDescription,
        jobLocation,
        createdAt: new Date(),
      });

      setMessage(dashboardJobMessage, "Job posted successfully.", "success");
      dashboardJobForm.reset();
      await loadMyJobs(user.uid);
    } catch (err) {
      console.error("Error posting job:", err);
      setMessage(dashboardJobMessage, "Error posting job. Please try again.", "error");
    }
  });
}

// -----------------------------
// Landing — post job form (public)
// -----------------------------
if (landingJobForm) {
  landingJobForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    setMessage(landingJobMessage, "Submitting…");

    const jobTitle       = document.getElementById("landing-job-title").value.trim();
    const jobCategory    = document.getElementById("landing-job-category").value;
    const jobDescription = document.getElementById("landing-job-description").value.trim();
    const jobLocation    = document.getElementById("landing-job-location").value.trim();
    const jobContact     = document.getElementById("landing-job-contact").value.trim();

    if (!jobTitle || !jobCategory || !jobDescription || !jobLocation || !jobContact) {
      setMessage(landingJobMessage, "Please fill in all fields.", "error");
      return;
    }

    try {
      await addDoc(collection(db, "jobs"), {
        userId:      null,
        jobTitle,
        jobCategory,
        jobDescription,
        jobLocation,
        jobContact,
        createdAt: new Date(),
      });

      setMessage(landingJobMessage, "Job submitted successfully! We'll be in touch.", "success");
      landingJobForm.reset();
    } catch (err) {
      console.error("Error submitting job:", err);
      setMessage(landingJobMessage, "Error submitting job. Please try again.", "error");
    }
  });
}
