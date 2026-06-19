// main.js
// Frontend for JobLeadHub – UK leads marketplace
// Uses Firebase (Firestore) for jobs and calls a Cloud Function for Stripe Checkout

// 1. Firebase config (replace with your real Firebase project config)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "backend-for-my-web.firebaseapp.com",
  projectId: "backend-for-my-web",
  storageBucket: "backend-for-my-web.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Smooth scroll from hero button to job form
const ctaBtn = document.getElementById("cta-post-job");
const postJobSection = document.getElementById("post-job");

if (ctaBtn && postJobSection) {
  ctaBtn.addEventListener("click", () => {
    postJobSection.scrollIntoView({ behavior: "smooth" });
  });
}

// 3. Job form handling – save jobs to Firestore
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
    const description = document
      .getElementById("job-description")
      .value.trim();

    if (!name || !email || !location || !type || !description) {
      jobMsg.textContent = "Please fill in all fields.";
      jobMsg.className = "msg err";
      return;
    }

    try {
      await addDoc(collection(db, "jobs"), {
        name,
        email,
        location,
        type,
        description,
        status: "new",
        createdAt: serverTimestamp(),
      });

      jobMsg.textContent =
        "Your job has been submitted. A tradesperson will contact you shortly.";
      jobMsg.className = "msg ok";
      jobForm.reset();
    } catch (err) {
      console.error(err);
      jobMsg.textContent =
        "There was an error submitting your job. Please try again.";
      jobMsg.className = "msg err";
    }
  });
}

// 4. Buy lead button – call Firebase Cloud Function to create Stripe Checkout Session
const leadsList = document.getElementById("leads-list");
const leadMsg = document.getElementById("lead-message");

// Change this URL to your real Cloud Function endpoint
const CREATE_CHECKOUT_SESSION_URL =
  "https://us-central1-backend-for-my-web.cloudfunctions.net/createCheckoutSession";

if (leadsList) {
  leadsList.addEventListener("click", async (e) => {
    const btn = e.target.closest(".buy-lead-btn");
    if (!btn) return;

    const leadId = btn.dataset.leadId;
    leadMsg.textContent = "Creating payment session...";
    leadMsg.className = "msg";

    try {
      const res = await fetch(CREATE_CHECKOUT_SESSION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          amount: 5, // £5 per lead – adjust as needed
        }),
      });

      if (!res.ok) {
        throw new Error("HTTP error");
      }

      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkoutUrl returned");
      }
    } catch (err) {
      console.error(err);
      leadMsg.textContent =
        "There was an error starting the payment. Please try again.";
      leadMsg.className = "msg err";
    }
  });
}
