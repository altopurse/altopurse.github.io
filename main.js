// -----------------------------
// Load Available Leads When Logged In
// -----------------------------
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-functions.js";

onAuthStateChanged(auth, async (user) => {
    const leadsSection = document.getElementById("available-leads");
    const leadsList = document.getElementById("leads-list");

    if (!user) {
        if (leadsSection) leadsSection.style.display = "none";
        return;
    }

    // Show leads section
    leadsSection.style.display = "block";

    // Load leads from Firestore
    const leadsRef = collection(db, "leads");
    const snapshot = await getDocs(leadsRef);

    leadsList.innerHTML = "";

    snapshot.forEach(doc => {
        const lead = doc.data();

        const item = document.createElement("div");
        item.classList.add("lead-item");

        item.innerHTML = `
            <h3>${lead.title}</h3>
            <p>${lead.description}</p>
            <p><strong>Price:</strong> ${lead.price} credits</p>
            <button class="buy-lead-btn" data-lead-id="${doc.id}">
                Buy Lead
            </button>
        `;

        leadsList.appendChild(item);
    });
});

// -----------------------------
// Buy Lead With Credits
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

    try {
        const buyLead = httpsCallable(functions, "buyLeadWithCredits");
        const result = await buyLead({ leadId });

        if (result.data.success) {
            alert("Lead purchased successfully!");
            console.log("Job details:", result.data.job);
        } else {
            alert("Could not unlock this lead.");
        }
    } catch (err) {
        console.error(err);
        alert("Error buying lead.");
    }
});
// -----------------------------
// Dashboard Logic (FINAL VERSION)
// -----------------------------
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const auth = window.firebaseAuth;
const db = window.firebaseDB;

const landing = document.getElementById("landing");
const dashboard = document.getElementById("dashboard");
const dashUser = document.getElementById("dash-username");
const dashCredits = document.getElementById("dash-credits");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    landing.style.display = "none";
    dashboard.style.display = "block";

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      dashUser.textContent = `Hola ${data.username} 👋`;
      dashCredits.textContent = `💰 Créditos: ${data.credits}`;
    }

  } else {
    landing.style.display = "block";
    dashboard.style.display = "none";
  }
});

