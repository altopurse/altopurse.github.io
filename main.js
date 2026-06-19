// main.js
// Versión frontend: preparado para conectar con Firebase y Stripe

// 1. Firebase config (rellena con tus datos de Firebase)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "XXX",
  appId: "XXX",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Scroll al formulario desde el botón del hero
const ctaBtn = document.getElementById("cta-post-job");
const postJobSection = document.getElementById("post-job");
if (ctaBtn && postJobSection) {
  ctaBtn.addEventListener("click", () => {
    postJobSection.scrollIntoView({ behavior: "smooth" });
  });
}

// 3. Manejo del formulario de trabajo
const jobForm = document.getElementById("job-form");
const jobMsg = document.getElementById("job-message");

if (jobForm) {
  jobForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    jobMsg.textContent = "Enviando trabajo...";
    jobMsg.className = "msg";

    const name = document.getElementById("client-name").value.trim();
    const email = document.getElementById("client-email").value.trim();
    const location = document.getElementById("client-location").value.trim();
    const type = document.getElementById("job-type").value;
    const description = document.getElementById("job-description").value.trim();

    if (!name || !email || !location || !type || !description) {
      jobMsg.textContent = "Por favor, rellena todos los campos.";
      jobMsg.className = "msg err";
      return;
    }

    try {
      // Guardar en Firestore
      await addDoc(collection(db, "jobs"), {
        name,
        email,
        location,
        type,
        description,
        status: "new",
        createdAt: serverTimestamp(),
      });

      jobMsg.textContent = "Trabajo enviado. Un profesional se pondrá en contacto contigo.";
      jobMsg.className = "msg ok";
      jobForm.reset();
    } catch (err) {
      console.error(err);
      jobMsg.textContent = "Error al enviar el trabajo. Inténtalo de nuevo.";
      jobMsg.className = "msg err";
    }
  });
}

// 4. Botón "Comprar lead" → aquí llamaremos a la Cloud Function de Stripe
const leadsList = document.getElementById("leads-list");
const leadMsg = document.getElementById("lead-message");

if (leadsList) {
  leadsList.addEventListener("click", async (e) => {
    const btn = e.target.closest(".buy-lead-btn");
    if (!btn) return;

    const leadId = btn.dataset.leadId;
    leadMsg.textContent = "Creando sesión de pago...";
    leadMsg.className = "msg";

    try {
      // Aquí luego llamaremos a tu Firebase Function:
      // const res = await fetch("https://us-central1-TU_PROYECTO.cloudfunctions.net/createCheckoutSession", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ leadId }),
      // });
      // const data = await res.json();
      // window.location.href = data.checkoutUrl;

      // De momento, demo:
      setTimeout(() => {
        leadMsg.textContent = "Demo: aquí te redirigiría a Stripe Checkout.";
        leadMsg.className = "msg ok";
      }, 800);
    } catch (err) {
      console.error(err);
      leadMsg.textContent = "Error al iniciar el pago.";
      leadMsg.className = "msg err";
    }
  });
}
