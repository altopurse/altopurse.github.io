// main.js – core app logic for JobLeadHub

const auth = window.firebaseAuth;
const db = window.firebaseDB;
const functions = window.firebaseFunctions;

// Firebase imports
import {
  onAuthStateChanged,
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

// DOM references
const landing = document.getElementById("landing");
const dashboard = document.getElementById("dashboard");

const dashUsername = document.getElementById("dash-username");
const dashCredits = document.getElementById("dash-credits");

const availableLeadsList = document.getElementById("available-leads-list");
const availableLeadsMsg = document.getElementById("available-leads-message");

const purchasedLeadsList = document.getElementById("purchased-leads-list");
const purchasedLeadsMsg = document.getElementById("purchased-leads-message");

const myJobsList = document.getElementById("my-jobs-list");
const myJobsMsg = document.getElementById("my-jobs-message");

const logoutBtnDash = document.getElementById("logoutBtnDash");
const scrollToPostJobBtn = document.getElementById("scrollToPostJob");

// Smooth scroll from hero to landing post job
const ctaBtn = document.getElementById("cta-post-job");
const landingPostJobSection = document.getElementById("landing-post-job");

if (ctaBtn && landingPostJobSection) {
  ctaBtn.addEventListener("click", () => {
    landingPostJobSection.scrollIntoView({ behavior: "smooth" });
  });
}

if (scrollToPostJobBtn) {
  const postJobSection = document.getElementById("post-job");
  scrollToPostJobBtn.addEventListener("click", () => {
    if (postJobSection) {
      postJobSection.scrollIntoView({ behavior: "smooth" });
    }
  });
}

// Logout from dashboard
import { signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

if (logoutBtnDash) {
  logoutBtnDash.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}

// -----------------------------
// Auth state → toggle landing/dashboard + load data
// -----------------------------
onAuthStateChanged(auth, async (user) => {
  if (!landing || !dashboard) return;

  if (user) {
    landing.style.display = "none";
    dashboard.style.display = "block";

    await loadUserProfile(user.uid);
    await Promise.all([
      loadAvailableLeads(),
      loadPurchasedLeads(user.uid),
      loadMyJobs(user.uid),
    ]);
  } else {
    landing.style.display = "block";
    dashboard.style.display = "none";
  }
});

// -----------------------------
// Load user profile (username + credits)
// -----------------------------
async function loadUserProfile(uid) {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    if (dashUsername) {
      dashUsername.textContent = `Welcome, ${data.username || "tradesperson"}`;
    }
    if (dashCredits) {
      dashCredits.textContent = `Credits: ${data.credits ?? 0}`;
    }
  } catch (err) {
    console.error("Error loading user profile:", err);
  }
}

// -----------------------------
// Load available leads
// -----------------------------
async function loadAvailableLeads() {
  if (!availableLeadsList) return;

  availableLeadsList.innerHTML = "";
  if (availableLeadsMsg) availableLeadsMsg.textContent = "";

  try {
    const leadsRef = collection(db, "leads");
    const snap = await getDocs(leadsRef);

    if (snap.empty) {
      availableLeadsList.innerHTML = "<p>No leads available yet.</p>";
      return;
    }

    snap.forEach((docSnap) => {
      const lead = docSnap.data();
      const div = document.createElement("div");
      div.className = "lead card-small";
      div.innerHTML = `
        <h4>${lead.title || "Lead"}</h4>
        <p>${lead.description || ""}</p>
        <p><strong>Location:</strong> ${lead.location || "N/A"}</p>
        <p><strong>Price:</strong> ${lead.price ?? 0} credits</p>
        <button class="btn small buy-lead-btn" data-lead-id="${docSnap.id}">
          Buy lead
        </button>
      `;
      availableLeadsList.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading leads:", err);
    if (availableLeadsMsg) {
      availableLeadsMsg.textContent = "Error loading leads.";
      availableLeadsMsg.className = "msg err";
    }
  }
}

// -----------------------------
// Buy lead with credits
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

  try {
    const buyLead = httpsCallable(functions, "buyLeadWithCredits");
    const result = await buyLead({ leadId });

    if (result.data && result.data.success) {
      alert("Lead purchased successfully.");
      await loadUserProfile(user.uid);
      await loadPurchasedLeads(user.uid);
    } else {
      alert("Could not unlock this lead.");
    }
  } catch (err) {
    console.error("Error buying lead:", err);
    if (err.code === "failed-precondition") {
      alert("Not enough credits.");
    } else {
      alert("Error buying lead.");
    }
  }
});

// -----------------------------
// Load purchased leads
// -----------------------------
async function loadPurchasedLeads(uid) {
  if (!purchasedLeadsList) return;

  purchasedLeadsList.innerHTML = "";
  if (purchasedLeadsMsg) purchasedLeadsMsg.textContent = "";

  try:
    const q = query(
      collection(db, "purchased"),
      where("userId", "==", uid)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      purchasedLeadsList.innerHTML = "<p>You have not purchased any leads yet.</p>";
      return;
    }

    snap.forEach((docSnap) => {
      const lead = docSnap.data();
      const div = document.createElement("div");
      div.className = "lead card-small";
      div.innerHTML = `
        <h4>${lead.title || "Lead"}</h4>
        <p>${lead.description || ""}</p>
        <p><strong>Location:</strong> ${lead.location || "N/A"}</p>
        <p><strong>Contact name:</strong> ${lead.contactName || "N/A"}</p>
        <p><strong>Contact email:</strong> ${lead.contactEmail || "N/A"}</p>
      `;
      purchasedLeadsList.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading purchased leads:", err);
    if (purchasedLeadsMsg) {
      purchasedLeadsMsg.textContent = "Error loading purchased leads.";
      purchasedLeadsMsg.className = "msg err";
    }
  }
}

// -----------------------------
// Load my posted jobs
// -----------------------------
async function loadMyJobs(uid) {
  if (!myJobsList) return;

  myJobsList.innerHTML = "";
  if (myJobsMsg) myJobsMsg.textContent = "";

  try {
    const q = query(
      collection(db, "jobs"),
      where("userId", "==", uid)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      myJobsList.innerHTML = "<p>You have not posted any jobs yet.</p>";
      return;
    }

    snap.forEach((docSnap) => {
      const job = docSnap.data();
      const div = document.createElement("div");
      div.className = "card-small";
      div.innerHTML = `
        <h4>${job.type || "Job"}</h4>
        <p>${job.description || ""}</p>
        <p><strong>Location:</strong> ${job.location || "N/A"}</p>
      `;
      myJobsList.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading jobs:", err);
    if (myJobsMsg) {
      myJobsMsg.textContent = "Error loading your jobs.";
      myJobsMsg.className = "msg err";
    }
  }
}

// -----------------------------
// Post job (dashboard version)
// -----------------------------
const jobForm = document.getElementById("job-form");
const jobMsg = document.getElementById("job-message");

if (jobForm && jobMsg) {
  jobForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

    jobMsg.textContent = "Submitting your job...";
    jobMsg.className = "msg";

    const name = document.getElementById("client-name").value.trim();
    const email = document.getElementById("client-email").value.trim();
    const location = document.getElementById("client-location").value.trim();
    const type = document.getElementById("job-type").value;
    const description = document.getElementById("job-description").value.trim();

    if (!name || !email || !location || !type || !description) {
      jobMsg.textContent = "Please fill in all fields.";
      jobMsg.className = "msg err";
      return;
    }

    try {
      await addDoc(collection(db, "jobs"), {
        userId: user ? user.uid : null,
        name,
        email,
        location,
        type,
        description,
        createdAt: new Date(),
      });

      jobMsg.textContent = "Job submitted successfully.";
      jobMsg.className = "msg ok";
      jobForm.reset();

      if (user) {
        await loadMyJobs(user.uid);
      }
    } catch (err) {
      console.error("Error submitting job:", err);
      jobMsg.textContent = "Error submitting job. Try again.";
      jobMsg.className = "msg err";
    }
  });
}

// -----------------------------
// Post job (landing version – public)
// -----------------------------
const landingJobForm = document.getElementById("landing-job-form");
const landingJobMsg = document.getElementById("landing-job-message");

if (landingJobForm && landingJobMsg) {
  landingJobForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    landingJobMsg.textContent = "Submitting your job...";
    landingJobMsg.className = "msg";

    const name = document.getElementById("landing-client-name").value.trim();
    const email = document.getElementById("landing-client-email").value.trim();
    const location = document.getElementById("landing-client-location").value.trim();
    const type = document.getElementById("landing-job-type").value;
    const description = document.getElementById("landing-job-description").value.trim();

    if (!name || !email || !location || !type || !description) {
      landingJobMsg.textContent = "Please fill in all fields.";
      landingJobMsg.className = "msg err";
      return;
    }

    try {
      await addDoc(collection(db, "jobs"), {
        userId: null,
        name,
        email,
        location,
        type,
        description,
        createdAt: new Date(),
      });

      landingJobMsg.textContent = "Job submitted successfully.";
      landingJobMsg.className = "msg ok";
      landingJobForm.reset();
    } catch (err) {
      console.error("Error submitting job:", err);
      landingJobMsg.textContent = "Error submitting job. Try again.";
      landingJobMsg.className = "msg err";
    }
  });
}
