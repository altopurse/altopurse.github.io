// main.js – JobLeadHub frontend logic
// Works with Firebase CDN SDK loaded in index.html

// Firebase objects passed from index.html
const auth = window.firebaseAuth;
const db = window.firebaseDB;
const functions = window.firebaseFunctions;

// -----------------------------
// Smooth scroll from hero button
// -----------------------------
const ctaBtn = document.getElementById("cta-post-job");
const postJobSection = document.getElementById("post-job");

if (ctaBtn && postJobSection) {
  ctaBtn.addEventListener("click", () => {
    postJobSection.scrollIntoView({ behavior: "smooth" });
  });
}

// -----------------------------
// Post Job Form
// -----------------------------
const jobForm = document.getElementById("job-form");
const jobMsg = document.getElementById("job-message");

if (jobForm) {
  jobForm.addEventListener("submit", async (e) => {
    e.preventDefault();
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
      const docRef = await addDoc(collection(db, "jobs"), {
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
    } catch (err) {
      console.error(err);
      jobMsg.textContent = "Error submitting job. Try again.";
      jobMsg.className = "msg err";
    }
  });
}

// -----------------------------
// Buy Lead With Credits
// -----------------------------
const leadsList = document.getElementById("leads-list");
const leadMsg = document.getElementById("lead-message");
const jobDetailsBox = document.getElementById("job-details");

import {
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import {
  httpsCallable,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-functions.js";

if (leadsList) {
  leadsList.addEventListener("click", async (e) => {
    const btn = e.target.closest(".buy-lead-btn");
    if (!btn) return;

    const user = auth.currentUser;
    if (!user) {
      leadMsg.textContent = "You must be signed in to buy leads.";
      leadMsg.className = "msg err";
      return;
    }

    const leadId = btn.dataset.leadId;
    leadMsg.textContent = "Processing purchase...";
    leadMsg.className = "msg";

    try {
      const buyLead = httpsCallable(functions, "buyLeadWithCredits");
      const result = await buyLead({ leadId });

      if (result.data && result.data.success) {
        const j = result.data.job;

        jobDetailsBox.innerHTML = `
          <h3>Job Details</h3>
          <p><strong>Type:</strong> ${j.type}</p>
          <p><strong>Location:</strong> ${j.location}</p>
          <p><strong>Description:</strong> ${j.description}</p>
          <p><strong>Contact Name:</strong> ${j.contactName}</p>
          <p><strong>Contact Email:</strong> ${j.contactEmail}</p>
        `;

        leadMsg.textContent = "Lead purchased successfully.";
        leadMsg.className = "msg ok";
      } else {
        leadMsg.textContent = "Could not unlock this lead.";
        leadMsg.className = "msg err";
      }
    } catch (err) {
      console.error(err);
      if (err.code === "failed-precondition") {
        leadMsg.textContent = "Not enough credits.";
      } else {
        leadMsg.textContent = "Error buying lead.";
      }
      leadMsg.className = "msg err";
    }
  });
}
