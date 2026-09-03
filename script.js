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
// Substitua pelas chaves reais do seu console do Firebase se necessário
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

// Usuário Admin do Sistema
const ADMIN_EMAIL = "arthur@hoscar.local";

// ==========================================
// 3. AUTENTICAÇÃO (LOGIN E LOGOUT)
// ==========================================
async function fazerLogin(usuario, senha) {
  try {
    // Adiciona o sufixo automaticamente se o usuário digitar apenas o apelido
    const emailCompleto = usuario.includes("@") ? usuario : `${usuario}@hoscar.local`;
    await signInWithEmailAndPassword(auth, emailCompleto, senha);
    alert("Login realizado com sucesso!");
    fecharModalLogin();
  } catch (erro) {
    console.error("Erro no login:", erro);
    alert("Erro ao fazer login. Verifique o usuário e a senha.");
  }
}

async function fazerLogout() {
  try {
    await signOut(auth);
    alert("Você saiu da conta.");
    window.location.reload();
  } catch (erro) {
    console.error("Erro ao sair:", erro);
  }
}

// Observador de Estado de Autenticação
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Usuário logado:", user.email);
    atualizarUIUsuarioLogado(user);
    await carregarPerfilUsuario(user.uid);
    await carregarFilmes();
  } else {
    console.log("Nenhum usuário logado.");
    atualizarUIUsuarioDeslogado();
  }
});

// ==========================================
// 4. GERENCIAMENTO DE FILMES (ADMIN)
// ==========================================

// Adicionar Filme
async function adicionarFilme(titulo, nota, capa, review) {
  const user = auth.currentUser;
  if (!user || user.email !== ADMIN_EMAIL) {
    return alert("Apenas o Admin pode adicionar filmes!");
  }

  try {
    await addDoc(collection(db, "filmes"), {
      titulo: titulo,
      nota: parseFloat(nota) || 0,
      capa: capa,
      review: review,
      criadoEm: new Date()
    });
    alert("Filme adicionado com sucesso!");
    carregarFilmes();
  } catch (erro) {
    console.error("Erro ao adicionar filme:", erro);
    alert("Erro ao salvar o filme.");
  }
}

// Carregar e Exibir Lista de Filmes
async function carregarFilmes() {
  const container = document.getElementById("lista-filmes");
  if (!container) return;

  container.innerHTML = "<p>Carregando filmes...</p>";

  try {
    const q = query(collection(db, "filmes"), orderBy("criadoEm", "desc"));
    const querySnapshot = await getDocs(q);
    
    container.innerHTML = ""; // Limpa o container

    if (querySnapshot.empty) {
      container.innerHTML = "<p>Nenhum filme cadastrado ainda.</p>";
      return;
    }

    const eAdmin = auth.currentUser && auth.currentUser.email === ADMIN_EMAIL;

    querySnapshot.forEach((docSnap) => {
      const filme = docSnap.data();
      const id = docSnap.id;

      // Criação do card do filme no HTML
      const card = document.createElement("div");
      card.className = "card-filme";
      card.innerHTML = `
        <img src="${filme.capa || 'img/default-cover.jpg'}" alt="${filme.titulo}" class="capa-filme">
        <div class="info-filme">
          <h3>${filme.titulo}</h3>
          <span class="nota">★ ${filme.nota}/10</span>
          <p class="review">${filme.review || ''}</p>
          ${eAdmin ? `
            <div class="acoes-admin">
              <button onclick="prepararEdicaoFilme('${id}', '${encodeURIComponent(JSON.stringify(filme))}')">Editar</button>
              <button onclick="excluirFilme('${id}')">Excluir</button>
            </div>
          ` : ''}
        </div>
      `;
      container.appendChild(card);
    });
  } catch (erro) {
    console.error("Erro ao carregar filmes:", erro);
    container.innerHTML = "<p>Erro ao carregar os filmes.</p>";
  }
}

// Editar Filme Existente
async function editarFilme(filmeId, novoTitulo, novaNota, novaCapa, novaReview) {
  const user = auth.currentUser;
  if (!user || user.email !== ADMIN_EMAIL) {
    return alert("Apenas o Admin pode editar filmes!");
  }

  try {
    const filmeRef = doc(db, "filmes", filmeId);
    await updateDoc(filmeRef, {
      titulo: novoTitulo,
      nota: parseFloat(novaNota) || 0,
      capa: novaCapa,
      review: novaReview,
      atualizadoEm: new Date()
    });

    alert("Filme atualizado com sucesso!");
    carregarFilmes();
  } catch (erro) {
    console.error("Erro ao editar filme:", erro);
    alert("Erro ao salvar as alterações do filme.");
  }
}

// Auxiliar para chamar prompt de edição rápida do filme
function prepararEdicaoFilme(id, dadosCodificados) {
  const filme = JSON.parse(decodeURIComponent(dadosCodificados));
  
  const novoTitulo = prompt("Título do Filme:", filme.titulo);
  if (novoTitulo === null) return;

  const novaNota = prompt("Nota (0 a 10):", filme.nota);
  if (novaNota === null) return;

  const novaCapa = prompt("Caminho ou URL da Capa:", filme.capa);
  if (novaCapa === null) return;

  const novaReview = prompt("Sinopse / Review:", filme.review);
  if (novaReview === null) return;

  editarFilme(id, novoTitulo, novaNota, novaCapa, novaReview);
}

// Excluir Filme
async function excluirFilme(filmeId) {
  const user = auth.currentUser;
  if (!user || user.email !== ADMIN_EMAIL) {
    return alert("Apenas o Admin pode excluir filmes!");
  }

  if (confirm("Tem certeza que deseja excluir este filme?")) {
    try {
      await deleteDoc(doc(db, "filmes", filmeId));
      alert("Filme removido!");
      carregarFilmes();
    } catch (erro) {
      console.error("Erro ao excluir filme:", erro);
      alert("Erro ao excluir filme.");
    }
  }
}

// ==========================================
// 5. GERENCIAMENTO DE PERFIL DO USUÁRIO
// ==========================================

// Salvar / Editar Próprio Perfil
async function salvarPerfilUsuario(nome, foto, bio) {
  const user = auth.currentUser;
  if (!user) return alert("Você precisa estar logado!");

  try {
    const perfilRef = doc(db, "perfis", user.uid);
    await setDoc(perfilRef, {
      nome: nome,
      foto: foto,
      bio: bio,
      email: user.email,
      atualizadoEm: new Date()
    }, { merge: true });

    alert("Perfil atualizado com sucesso!");
    await carregarPerfilUsuario(user.uid);
  } catch (erro) {
    console.error("Erro ao salvar perfil:", erro);
    alert("Erro ao atualizar o perfil.");
  }
}

// Carregar Dados do Perfil
async function carregarPerfilUsuario(uid) {
  try {
    const perfilRef = doc(db, "perfis", uid);
    const docSnap = await getDoc(perfilRef);

    if (docSnap.exists()) {
      const dados = docSnap.data();
      
      const elNome = document.getElementById("user-display-name");
      const elFoto = document.getElementById("user-avatar");
      const elBio = document.getElementById("user-bio");

      if (elNome) elNome.innerText = dados.nome || "Usuário";
      if (elFoto) elFoto.src = dados.foto || "img/default-avatar.png";
      if (elBio) elBio.innerText = dados.bio || "Sem biografia cadastrada.";
    }
  } catch (erro) {
    console.error("Erro ao carregar perfil:", erro);
  }
}

// ==========================================
// 6. FUNÇÕES AUXILIARES DE INTERFACE
// ==========================================
function atualizarUIUsuarioLogado(user) {
  const btnLoginModal = document.getElementById("btn-abrir-login");
  const btnLogout = document.getElementById("btn-logout");
  const painelAdmin = document.getElementById("painel-admin");

  if (btnLoginModal) btnLoginModal.style.display = "none";
  if (btnLogout) btnLogout.style.display = "block";
  
  // Exibe painel administrativo se for o email do Arthur
  if (painelAdmin) {
    painelAdmin.style.display = (user.email === ADMIN_EMAIL) ? "block" : "none";
  }
}

function atualizarUIUsuarioDeslogado() {
  const btnLoginModal = document.getElementById("btn-abrir-login");
  const btnLogout = document.getElementById("btn-logout");
  const painelAdmin = document.getElementById("painel-admin");

  if (btnLoginModal) btnLoginModal.style.display = "block";
  if (btnLogout) btnLogout.style.display = "none";
  if (painelAdmin) painelAdmin.style.display = "none";
}

function fecharModalLogin() {
  const modal = document.getElementById("login-modal");
  if (modal) modal.style.display = "none";
}

// ==========================================
// 7. EXPOSIÇÃO GLOBAL DE FUNÇÕES (MÓDULO HTML)
// ==========================================
window.fazerLogin = fazerLogin;
window.fazerLogout = fazerLogout;
window.adicionarFilme = adicionarFilme;
window.editarFilme = editarFilme;
window.prepararEdicaoFilme = prepararEdicaoFilme;
window.excluirFilme = excluirFilme;
window.salvarPerfilUsuario = salvarPerfilUsuario;
