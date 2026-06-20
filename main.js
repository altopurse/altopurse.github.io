// main.js — core app logic for JobLeadHub

import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  collection, addDoc, getDocs, doc, getDoc, query, where,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-functions.js";

const auth      = window.firebaseAuth;
const db        = window.firebaseDB;
const functions = window.firebaseFunctions;

// Views
const landingView   = document.getElementById("landing-view");
const dashboardView = document.getElementById("dashboard-view");

function showView(view) {
  landingView?.classList.add("hidden");
  dashboardView?.classList.add("hidden");
  view?.classList.remove("hidden");
}

function setMsg(el, text, type = "") {
  if (!el) return;
  el.textContent = text;
  el.className   = "msg" + (type ? ` ${type}` : "");
}

// ── Auth observer ──────────────────────────────────────────────
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

// ── Logout ─────────────────────────────────────────────────────
async function handleLogout() {
  try { await signOut(auth); window.location.href = "index.html"; }
  catch (err) { console.error("Logout error:", err); }
}
document.getElementById("logout-btn")?.addEventListener("click", handleLogout);

// ── User profile ───────────────────────────────────────────────
async function loadUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return;
    const d = snap.data();
    const el = document.getElementById("user-username");
    const cr = document.getElementById("user-credits");
    if (el) el.textContent = d.username || "there";
    if (cr) cr.textContent = d.credits  ?? 0;
  } catch (err) { console.error("Profile error:", err); }
}

// ── Available leads ────────────────────────────────────────────
async function loadAvailableLeads() {
  const list  = document.getElementById("leads-list");
  const empty = document.getElementById("leads-empty");
  if (!list) return;
  list.innerHTML = "";

  try {
    const snap = await getDocs(collection(db, "leads"));
    if (snap.empty) { if (empty) empty.style.display = "block"; return; }
    if (empty) empty.style.display = "none";

    snap.forEach((docSnap) => {
      const lead = docSnap.data();
      const card = document.createElement("div");
      card.className = "lead";
      card.innerHTML = `
        <h3>${lead.title || "Lead"}</h3>
        <p>${lead.description || ""}</p>
        <p><strong>Location:</strong> ${lead.location || "N/A"}</p>
        <p><strong>Cost:</strong> ${lead.price ?? 1} credit${(lead.price ?? 1) !== 1 ? "s" : ""}</p>
        <button class="buy-lead-btn" data-lead-id="${docSnap.id}">Unlock Lead</button>
      `;
      list.appendChild(card);
    });
  } catch (err) {
    console.error("Leads error:", err);
    list.innerHTML = "<p class='msg err'>Could not load leads. Please refresh.</p>";
  }
}

// ── Buy lead (event delegation) ────────────────────────────────
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".buy-lead-btn");
  if (!btn) return;

  const user = auth.currentUser;
  if (!user) { alert("You must be signed in to buy leads."); return; }

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
      btn.textContent = "Unlock Lead";
    }
  } catch (err) {
    console.error("Buy lead error:", err);
    alert(err.code === "failed-precondition"
      ? "Not enough credits. Top up to continue."
      : "Error buying lead. Please try again.");
    btn.disabled    = false;
    btn.textContent = "Unlock Lead";
  }
});

// ── Purchased leads ────────────────────────────────────────────
async function loadPurchasedLeads(uid) {
  const list  = document.getElementById("purchased-list");
  const empty = document.getElementById("purchased-empty");
  if (!list) return;
  list.innerHTML = "";

  try {
    const q    = query(collection(db, "purchased"), where("userId", "==", uid));
    const snap = await getDocs(q);
    if (snap.empty) { if (empty) empty.style.display = "block"; return; }
    if (empty) empty.style.display = "none";

    snap.forEach((docSnap) => {
      const lead = docSnap.data();
      const card = document.createElement("div");
      card.className = "lead purchased";
      card.innerHTML = `
        <h3>${lead.title || "Lead"}</h3>
        <p>${lead.description || ""}</p>
        <p><strong>Location:</strong>  ${lead.location     || "N/A"}</p>
        <p><strong>Name:</strong>      ${lead.contactName  || "N/A"}</p>
        <p><strong>Email:</strong>     <a href="mailto:${lead.contactEmail}">${lead.contactEmail || "N/A"}</a></p>
        <p><strong>Phone:</strong>     <a href="tel:${lead.contactPhone}">${lead.contactPhone || "N/A"}</a></p>
      `;
      list.appendChild(card);
    });
  } catch (err) {
    console.error("Purchased leads error:", err);
    list.innerHTML = "<p class='msg err'>Could not load purchased leads.</p>";
  }
}

// ── My posted jobs ─────────────────────────────────────────────
async function loadMyJobs(uid) {
  const list  = document.getElementById("jobs-list");
  const empty = document.getElementById("jobs-empty");
  if (!list) return;
  list.innerHTML = "";

  try {
    const q    = query(collection(db, "jobs"), where("userId", "==", uid));
    const snap = await getDocs(q);
    if (snap.empty) { if (empty) empty.style.display = "block"; return; }
    if (empty) empty.style.display = "none";

    snap.forEach((docSnap) => {
      const job  = docSnap.data();
      const card = document.createElement("div");
      card.className = "lead";
      card.innerHTML = `
        <h3>${job.jobTitle || "Job"}</h3>
        <p><strong>Category:</strong> ${job.jobCategory || "N/A"}</p>
        <p>${job.jobDescription || ""}</p>
        <p><strong>Location:</strong> ${job.jobLocation || "N/A"}</p>
      `;
      list.appendChild(card);
    });
  } catch (err) {
    console.error("Jobs error:", err);
    list.innerHTML = "<p class='msg err'>Could not load your jobs.</p>";
  }
}

// ── Dashboard job form ─────────────────────────────────────────
document.getElementById("dashboard-job-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  const msgEl = document.getElementById("dashboard-job-message");

  if (!user) { setMsg(msgEl, "You must be signed in to post a job.", "err"); return; }

  setMsg(msgEl, "Submitting…");

  const jobTitle       = document.getElementById("dashboard-job-title").value.trim();
  const jobCategory    = document.getElementById("dashboard-job-category").value;
  const jobDescription = document.getElementById("dashboard-job-description").value.trim();
  const jobLocation    = document.getElementById("dashboard-job-location").value.trim();

  if (!jobTitle || !jobCategory || !jobDescription || !jobLocation) {
    setMsg(msgEl, "Please fill in all fields.", "err"); return;
  }

  try {
    await addDoc(collection(db, "jobs"), {
      userId: user.uid, jobTitle, jobCategory, jobDescription, jobLocation,
      createdAt: new Date(),
    });
    setMsg(msgEl, "Job posted successfully!", "ok");
    document.getElementById("dashboard-job-form").reset();
    await loadMyJobs(user.uid);
  } catch (err) {
    console.error("Post job error:", err);
    setMsg(msgEl, "Error posting job. Please try again.", "err");
  }
});

// ── Landing job form (public) ──────────────────────────────────
document.getElementById("landing-job-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msgEl = document.getElementById("landing-job-message");
  setMsg(msgEl, "Submitting…");

  const jobTitle       = document.getElementById("landing-job-title").value.trim();
  const jobCategory    = document.getElementById("landing-job-category").value;
  const jobDescription = document.getElementById("landing-job-description").value.trim();
  const jobLocation    = document.getElementById("landing-job-location").value.trim();
  const jobContact     = document.getElementById("landing-job-contact").value.trim();

  if (!jobTitle || !jobCategory || !jobDescription || !jobLocation || !jobContact) {
    setMsg(msgEl, "Please fill in all fields.", "err"); return;
  }

  try {
    await addDoc(collection(db, "jobs"), {
      userId: null, jobTitle, jobCategory, jobDescription, jobLocation, jobContact,
      createdAt: new Date(),
    });
    setMsg(msgEl, "Job submitted! We'll be in touch.", "ok");
    document.getElementById("landing-job-form").reset();
  } catch (err) {
    console.error("Landing job error:", err);
    setMsg(msgEl, "Error submitting job. Please try again.", "err");
  }
});
