import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCFY5Bt8t8n8dAWuP_frYRJYfGmUaWuC4k",
  authDomain: "techquantabadge.firebaseapp.com",
  projectId: "techquantabadge",
  storageBucket: "techquantabadge.firebasestorage.app",
  messagingSenderId: "63842432321",
  appId: "1:63842432321:web:9798d7270925e339fc5dc0",
  measurementId: "G-3YWSBBQ792"
};

// Main App (For Admin Login & Database writes)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Secondary App (Hack to create users without logging admin out)
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

// UI Elements
const loginSec = document.getElementById('loginSection');
const dashSec = document.getElementById('dashboardSection');
const logoutBtn = document.getElementById('logoutBtn');
const internSelect = document.getElementById('internSelect');

// Auth State
onAuthStateChanged(auth, (user) => {
    if (user && user.email === 'admin@techquanta.com') {
        loginSec.style.display = 'none';
        dashSec.style.display = 'block';
        logoutBtn.style.display = 'block';
        fetchInterns(); // Load dropdown
    } else {
        loginSec.style.display = 'block';
        dashSec.style.display = 'none';
        logoutBtn.style.display = 'none';
    }
});

// Login / Logout
document.getElementById('loginBtn').addEventListener('click', async () => {
    try {
        await signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value);
    } catch (e) { alert("Access Denied: " + e.message); }
});
logoutBtn.addEventListener('click', () => signOut(auth));

// 1. Create Intern Flow
document.getElementById('createInternBtn').addEventListener('click', async () => {
    const name = document.getElementById('newInternName').value;
    const email = document.getElementById('newInternEmail').value;
    const password = document.getElementById('newInternPassword').value;
    const status = document.getElementById('createStatus');

    if(!name || !email || !password) return alert("Fill all fields");

    try {
        status.innerText = "Creating account...";
        status.style.color = "yellow";
        
        // Create user using secondary app to prevent admin logout
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        await signOut(secondaryAuth); // Sign out the secondary instance immediately

        // Save profile to Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
            name: name,
            email: email,
            role: "employee",
            createdAt: Date.now()
        });

        status.innerText = "✅ Intern created successfully!";
        status.style.color = "#92FE9D";
        
        // Clear fields
        document.getElementById('newInternName').value = '';
        document.getElementById('newInternEmail').value = '';
        document.getElementById('newInternPassword').value = '';
        
        setTimeout(() => status.innerText = "", 4000);
    } catch (e) {
        status.innerText = "❌ Error: " + e.message;
        status.style.color = "red";
    }
});

// 2. Fetch Interns for Dropdown (Real-time)
function fetchInterns() {
    const q = query(collection(db, "users"), where("role", "==", "employee"));
    onSnapshot(q, (snapshot) => {
        internSelect.innerHTML = '<option value="">-- Select Intern --</option>';
        snapshot.forEach((doc) => {
            const intern = doc.data();
            internSelect.innerHTML += `<option value="${doc.id}">${intern.name} (${intern.email})</option>`;
        });
    });
}

// 3. Award Badge Flow
document.getElementById('awardBtn').addEventListener('click', async () => {
    const uid = internSelect.value;
    const badge = document.getElementById('badgeSelect').value;
    const msg = document.getElementById('customMessage').value;
    const status = document.getElementById('awardStatus');

    if(!uid || !msg) return alert("Select an intern and write a message.");

    try {
        status.innerText = "Awarding badge...";
        await addDoc(collection(db, "awards"), {
            userId: uid,
            badgeType: badge,
            message: msg,
            awardedBy: "TechQuanta Management",
            timestamp: Date.now()
        });

        status.innerText = "✅ Badge pushed live to intern!";
        status.style.color = "#92FE9D";
        document.getElementById('customMessage').value = '';
        setTimeout(() => status.innerText = "", 4000);
    } catch (e) {
        status.innerText = "❌ Error: " + e.message;
        status.style.color = "red";
    }
});