// ==========================================
// 1. IMPORTAÇÕES DO FIREBASE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc, 
  getDoc, 
  deleteDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 2. CONFIGURAÇÃO DO FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyC8JW1yI4SQxsj23HpIF3wX2pv9MdRdgVE",
  authDomain: "hoscar-42f90.firebaseapp.com",
  projectId: "hoscar-42f90",
  storageBucket: "hoscar-42f90.firebasestorage.app",
  messagingSenderId: "916853635964",
  appId: "1:916853635964:web:d87e88a9c499969f5b82f9",
  measurementId: "G-PXKFSZR7W5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = "arthur@hoscar.local";
let currentSelectedMovieId = null;

// ==========================================
// 3. AUTENTICAÇÃO E NAVEGAÇÃO
// ==========================================
window.handleLogin = async function() {
  const usuario = document.getElementById("loginUsername").value;
  const senha = document.getElementById("loginPassword").value;

  if (!usuario || !senha) return alert("Preencha usuário e senha!");

  try {
    const emailCompleto = usuario.includes("@") ? usuario : `${usuario}@hoscar.local`;
    await signInWithEmailAndPassword(auth, emailCompleto, senha);
    alert("Login realizado com sucesso!");
    closeModal("loginModal");
  } catch (erro) {
    console.error("Erro no login:", erro);
    alert("Erro ao fazer login. Verifique as credenciais.");
  }
};

window.handleLogout = async function() {
  try {
    await signOut(auth);
    alert("Você saiu da conta.");
    window.location.reload();
  } catch (erro) {
    console.error("Erro ao sair:", erro);
  }
};

onAuthStateChanged(auth, async (user) => {
  const statusText = document.getElementById("userStatusText");
  const loginBtn = document.getElementById("loginBtnNav");
  const adminAddBtn = document.getElementById("adminAddMovieBtn");
  const adminEditBtn = document.getElementById("adminEditBtn");

  if (user) {
    if (statusText) statusText.innerText = user.email.split('@')[0];
    if (loginBtn) {
      loginBtn.innerText = "Sair";
      loginBtn.onclick = window.handleLogout;
    }
    const eAdmin = user.email === ADMIN_EMAIL;
    if (adminAddBtn) adminAddBtn.style.display = eAdmin ? "inline-block" : "none";
    if (adminEditBtn) adminEditBtn.style.display = eAdmin ? "inline-block" : "none";
  } else {
    if (statusText) statusText.innerText = "Visitante";
    if (loginBtn) {
      loginBtn.innerText = "Entrar";
      loginBtn.onclick = () => openModal("loginModal");
    }
    if (adminAddBtn) adminAddBtn.style.display = "none";
    if (adminEditBtn) adminEditBtn.style.display = "none";
  }
  await carregarFilmes();
});

// ==========================================
// 4. GERENCIAMENTO DE FILMES
// ==========================================
async function carregarFilmes() {
  const container = document.getElementById("movieGrid");
  if (!container) return;

  container.innerHTML = "<p>Carregando filmes...</p>";

  try {
    const q = query(collection(db, "filmes"), orderBy("criadoEm", "desc"));
    const querySnapshot = await getDocs(q);
    
    container.innerHTML = "";

    if (querySnapshot.empty) {
      container.innerHTML = "<p>Nenhum filme cadastrado ainda.</p>";
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const filme = docSnap.data();
      const id = docSnap.id;

      const card = document.createElement("div");
      card.className = "movie-card";
      if (filme.capa) {
        card.style.backgroundImage = `url('${filme.capa}')`;
      }

      card.innerHTML = `
        <div class="rating-badge">★ ${filme.nota || 0}/10</div>
        <div class="movie-card-info">
          <span class="marquee-text">${filme.titulo}</span>
        </div>
      `;

      card.onclick = () => exibirDetalhesFilme(id, filme);
      container.appendChild(card);
    });
  } catch (erro) {
    console.error("Erro ao carregar filmes:", erro);
    container.innerHTML = "<p>Erro ao carregar os filmes.</p>";
  }
}

function exibirDetalhesFilme(id, filme) {
  currentSelectedMovieId = id;
  document.getElementById("mModalImg").src = filme.capa || "";
  document.getElementById("mModalTitle").innerText = filme.titulo || "";
  document.getElementById("mModalRating").innerText = filme.nota || "0";
  document.getElementById("mModalAwards").innerText = filme.premios || "Nenhum";
  document.getElementById("mModalDesc").innerText = filme.review || "Sem descrição.";

  const mAdminActions = document.getElementById("mAdminActions");
  const eAdmin = auth.currentUser && auth.currentUser.email === ADMIN_EMAIL;
  if (mAdminActions) mAdminActions.style.display = eAdmin ? "block" : "none";

  openModal("movieModal");
}

window.saveMovie = async function() {
  const user = auth.currentUser;
  if (!user || user.email !== ADMIN_EMAIL) {
    return alert("Apenas o Admin pode adicionar filmes!");
  }

  const titulo = document.getElementById("fTitle").value;
  const capa = document.getElementById("fImg").value;
  const nota = parseFloat(document.getElementById("fRating").value) || 0;
  const premios = document.getElementById("fAwards").value;
  const review = document.getElementById("fDesc").value;

  if (!titulo) return alert("Insira pelo menos o título do filme!");

  try {
    await addDoc(collection(db, "filmes"), {
      titulo,
      capa,
      nota,
      premios,
      review,
      criadoEm: new Date()
    });
    alert("Filme adicionado com sucesso!");
    closeModal("addMovieModal");
    carregarFilmes();
  } catch (erro) {
    console.error("Erro ao salvar filme:", erro);
    alert("Erro ao salvar o filme.");
  }
};

window.deleteCurrentMovie = async function() {
  if (!currentSelectedMovieId) return;
  const user = auth.currentUser;
  if (!user || user.email !== ADMIN_EMAIL) return alert("Ação não permitida!");

  if (confirm("Tem certeza que deseja excluir este filme?")) {
    try {
      await deleteDoc(doc(db, "filmes", currentSelectedMovieId));
      alert("Filme removido!");
      closeModal("movieModal");
      carregarFilmes();
    } catch (erro) {
      console.error("Erro ao excluir filme:", erro);
      alert("Erro ao excluir filme.");
    }
  }
};

// ==========================================
// 5. CONTROLE DE MODAIS E INTERFACE
// ==========================================
window.openModal = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
};

window.closeModal = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("active");
};

window.openLoginModal = () => openModal("loginModal");
window.openAddMovieModal = () => openModal("addMovieModal");
window.openSecretModal = () => openModal("secretModal");
window.openEditProfileModal = () => openModal("editProfileModal");

document.addEventListener("DOMContentLoaded", () => {
  const openNav = document.getElementById("openNav");
  const navDrawer = document.getElementById("navDrawer");
  const overlay = document.getElementById("overlay");

  if (openNav && navDrawer && overlay) {
    openNav.addEventListener("click", () => {
      navDrawer.classList.toggle("active");
      overlay.classList.toggle("active");
    });

    overlay.addEventListener("click", () => {
      navDrawer.classList.remove("active");
      overlay.classList.remove("active");
    });
  }
});
