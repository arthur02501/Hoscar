import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// SUAS CREDENCIAIS DO FIREBASE CONECTADAS:
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

// Perfis de Usuários/Amigos
const profilesData = [
  { id: 'geral', name: 'Perfil Geral (Grupo)', img: '', desc: 'Perfil oficial do grupo para seleções e reviews coletivas.' },
  { id: 'arthur', name: 'Arthur', img: '', desc: 'Perfil do Administrador.' },
  { id: 'clarissa', name: 'Clarissa', img: '', desc: 'Recomendações da Clarissa.' },
  { id: 'dudu', name: 'Dudu', img: '', desc: 'Recomendações do Dudu.' },
  { id: 'alice', name: 'Alice', img: '', desc: 'Recomendações da Alice.' },
  { id: 'edu', name: 'Edu', img: '', desc: 'Recomendações do Edu.' },
  { id: 'zeca1', name: 'Zeca', img: '', desc: 'Recomendações do Zeca.' },
  { id: 'pedro', name: 'Pedro', img: '', desc: 'Recomendações do Pedro.' },
  { id: 'igor', name: 'Igor', img: '', desc: 'Recomendações do Igor.' },
  { id: 'gabriel', name: 'Gabriel', img: '', desc: 'Recomendações do Gabriel.' },
  { id: 'leonardo', name: 'Leonardo', img: '', desc: 'Recomendações do Leonardo.' },
  { id: 'gustavo', name: 'Gustavo', img: '', desc: 'Recomendações do Gustavo.' },
  { id: 'arthurbodevan', name: 'Arthur Bodevan', img: '', desc: 'Recomendações do Arthur Bodevan.' }
];

let profiles = JSON.parse(localStorage.getItem('hoscar_profiles')) || profilesData;
let movies = JSON.parse(localStorage.getItem('hoscar_movies')) || [
  {
    id: '1',
    profileId: 'arthur',
    title: 'Exemplo de Filme Com Titulo Bastante Longo Para Demonstrar o Loop Infinito',
    cover: '', 
    rating: '9.5',
    awards: 'Prêmio Hoscar de Melhor Filme',
    desc: 'Descrição de exemplo do filme.'
  }
];

let currentSelection = 'catalogo_geral'; 
let selectedMovieId = null;
let currentUser = null;
let loggedUsername = null;
let isAdmin = false;

// Observador de Sessão
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  const loginBtnNav = document.getElementById('loginBtnNav');
  const userStatusText = document.getElementById('userStatusText');
  
  if (user) {
    loggedUsername = user.email.replace('@hoscar.local', '').trim().toLowerCase();
    isAdmin = (loggedUsername === "arthur"); // Apenas o Arthur é Admin

    userStatusText.textContent = `Olá, ${loggedUsername}!`;
    loginBtnNav.textContent = "Sair";
    loginBtnNav.onclick = () => signOut(auth);
  } else {
    loggedUsername = null;
    isAdmin = false;
    userStatusText.textContent = "Visitante";
    loginBtnNav.textContent = "Entrar";
    loginBtnNav.onclick = () => window.openLoginModal();
  }
  selectView(currentSelection);
});

function init() {
  renderNav();
  selectView('catalogo_geral');
}

function renderNav() {
  const list = document.getElementById('profileList');
  list.innerHTML = '';

  const liGeral = document.createElement('li');
  liGeral.innerHTML = '<strong>🎬 Catálogo Geral (Todos)</strong>';
  liGeral.style.borderBottom = '2px solid rgba(0,0,0,0.2)';
  liGeral.onclick = () => { selectView('catalogo_geral'); toggleNav(false); };
  list.appendChild(liGeral);

  profiles.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p.name;
    li.onclick = () => { selectView(p.id); toggleNav(false); };
    list.appendChild(li);
  });
}

function selectView(id) {
  currentSelection = id;
  const pHeader = document.getElementById('profileHeader');
  const catalogTitle = document.getElementById('catalogTitle');

  if (id === 'catalogo_geral') {
    pHeader.classList.remove('active');
    catalogTitle.textContent = "Catálogo Geral (Todos os Filmes do Grupo)";
  } else {
    const p = profiles.find(item => item.id === id);
    pHeader.classList.add('active');
    document.getElementById('pImg').src = p.img || 'https://via.placeholder.com/120/000000/ffd700?text=Sem+Foto';
    document.getElementById('pName').textContent = p.name;
    document.getElementById('pDesc').textContent = p.desc || 'Sem descrição.';
    catalogTitle.textContent = `Filmes Exclusivos de ${p.name}`;
  }

  // Comparação sem diferenciar maiúsculas e minúsculas
  const isOwner = loggedUsername && (loggedUsername === id.trim().toLowerCase());
  const canEditProfile = isAdmin || isOwner;

  document.getElementById('adminEditBtn').style.display = (canEditProfile && id !== 'catalogo_geral') ? 'inline-block' : 'none';
  
  // Apenas Admin adiciona filmes
  document.getElementById('adminAddMovieBtn').style.display = isAdmin ? 'inline-block' : 'none';

  renderCatalog();
}

function renderCatalog() {
  const grid = document.getElementById('movieGrid');
  grid.innerHTML = '';

  const filteredMovies = (currentSelection === 'catalogo_geral') 
    ? movies 
    : movies.filter(m => m.profileId === currentSelection);

  if(filteredMovies.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-dim); grid-column: 1/-1;">Nenhum filme cadastrado neste espaço.</p>';
    return;
  }

  filteredMovies.forEach(m => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.style.backgroundImage = `url('${m.cover || 'https://via.placeholder.com/300x450/000/ffd700?text=Sem+Capa'}')`;
    card.onclick = () => openMovieModal(m.id);

    const isLong = m.title.length > 18;
    const titleClass = isLong ? 'marquee-text' : '';

    card.innerHTML = `
      <div class="rating-badge">★ ${m.rating || 'N/A'}</div>
      <div class="movie-card-info">
        <div class="${titleClass}">${m.title}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// LOGIN
window.handleLogin = async function() {
  const usernameInput = document.getElementById('loginUsername').value.toLowerCase().trim();
  const pass = document.getElementById('loginPassword').value;

  if(!usernameInput || !pass) return alert("Preencha o usuário e a senha!");

  const formattedEmail = `${usernameInput}@hoscar.local`;

  try {
    await signInWithEmailAndPassword(auth, formattedEmail, pass);
    window.closeModal('loginModal');
  } catch (e) {
    alert("Usuário ou senha incorretos!");
  }
}

// CAIXA SECRETA COM FIRESTORE
window.openSecretModal = async function() {
  if (!currentUser) {
    alert("Você precisa estar logado para acessar as caixas secretas!");
    window.openLoginModal();
    return;
  }

  const targetProfileId = (currentSelection === 'catalogo_geral') ? 'geral' : currentSelection;

  if (!isAdmin && loggedUsername !== targetProfileId.trim().toLowerCase()) {
    alert("Você só tem acesso à sua própria caixa secreta!");
    return;
  }

  window.openModal('secretModal');
  const secretText = document.getElementById('secretText');
  secretText.textContent = "Carregando review secreta...";

  try {
    const docRef = doc(db, "secret_reviews", targetProfileId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      secretText.textContent = docSnap.data().review;
    } else {
      secretText.textContent = "Nenhuma review secreta registrada para este perfil ainda.";
    }
  } catch (e) {
    secretText.textContent = "Erro de permissão no servidor.";
  }

  document.getElementById('adminSecretEdit').style.display = isAdmin ? 'block' : 'none';
}

window.saveSecretReview = async function() {
  if(!isAdmin) return alert("Apenas o Admin pode alterar reviews secretas!");
  const text = document.getElementById('adminSecretInput').value;
  if (!text) return alert("Digite um texto antes de salvar.");

  const targetProfileId = (currentSelection === 'catalogo_geral') ? 'geral' : currentSelection;

  try {
    await setDoc(doc(db, "secret_reviews", targetProfileId), {
      review: text,
      updatedAt: new Date()
    });
    alert("Review secreta salva com sucesso!");
    window.openSecretModal();
  } catch (e) {
    alert("Erro ao salvar no banco de dados.");
  }
}

// EDITA O PERFIL SELECIONADO
window.openEditProfileModal = () => {
  const p = profiles.find(item => item.id === currentSelection);
  if(!p) return;
  document.getElementById('editName').value = p.name;
  document.getElementById('editImg').value = p.img;
  document.getElementById('editDesc').value = p.desc;
  
  // Se não for admin, desabilita a alteração do Nome
  document.getElementById('editName').disabled = !isAdmin;
  
  window.openModal('editProfileModal');
};

window.saveProfileChanges = () => {
  const p = profiles.find(item => item.id === currentSelection);
  if(!p) return;
  
  if (isAdmin) {
    p.name = document.getElementById('editName').value;
  }
  p.img = document.getElementById('editImg').value;
  p.desc = document.getElementById('editDesc').value;
  
  localStorage.setItem('hoscar_profiles', JSON.stringify(profiles));
  renderNav();
  selectView(currentSelection);
  window.closeModal('editProfileModal');
};

// ADICIONAR E EDITAR FILME (ADMIN)
window.openAddMovieModal = () => window.openModal('addMovieModal');

window.saveMovie = () => {
  const movieProfileOwner = (currentSelection === 'catalogo_geral') ? 'arthur' : currentSelection;

  const newMovie = {
    id: Date.now().toString(),
    profileId: movieProfileOwner,
    title: document.getElementById('fTitle').value,
    cover: document.getElementById('fImg').value,
    rating: document.getElementById('fRating').value,
    awards: document.getElementById('fAwards').value,
    desc: document.getElementById('fDesc').value
  };
  movies.push(newMovie);
  localStorage.setItem('hoscar_movies', JSON.stringify(movies));
  renderCatalog();
  window.closeModal('addMovieModal');
};

window.openMovieModal = (id) => {
  selectedMovieId = id;
  const m = movies.find(item => item.id === id);
  if(!m) return;
  document.getElementById('mModalImg').src = m.cover || 'https://via.placeholder.com/300x450/000/ffd700?text=Sem+Capa';
  document.getElementById('mModalTitle').textContent = m.title;
  document.getElementById('mModalRating').textContent = m.rating || 'N/A';
  document.getElementById('mModalAwards').textContent = m.awards || 'Nenhum';
  document.getElementById('mModalDesc').textContent = m.desc || 'Sem descrição.';
  
  document.getElementById('mAdminActions').style.display = isAdmin ? 'flex' : 'none';
  window.openModal('movieModal');
};

// EDITA O FILME ATUALMENTE ABERTO
window.openEditMovieModal = () => {
  const m = movies.find(item => item.id === selectedMovieId);
  if(!m) return;

  document.getElementById('editFTitle').value = m.title || '';
  document.getElementById('editFImg').value = m.cover || '';
  document.getElementById('editFRating').value = m.rating || '';
  document.getElementById('editFAwards').value = m.awards || '';
  document.getElementById('editFDesc').value = m.desc || '';

  window.openModal('editMovieModal');
};

window.saveMovieChanges = () => {
  const m = movies.find(item => item.id === selectedMovieId);
  if(!m) return;

  m.title = document.getElementById('editFTitle').value;
  m.cover = document.getElementById('editFImg').value;
  m.rating = document.getElementById('editFRating').value;
  m.awards = document.getElementById('editFAwards').value;
  m.desc = document.getElementById('editFDesc').value;

  localStorage.setItem('hoscar_movies', JSON.stringify(movies));
  renderCatalog();
  openMovieModal(m.id);
  window.closeModal('editMovieModal');
};

window.deleteCurrentMovie = () => {
  if(confirm("Excluir este filme do catálogo?")) {
    movies = movies.filter(m => m.id !== selectedMovieId);
    localStorage.setItem('hoscar_movies', JSON.stringify(movies));
    renderCatalog();
    window.closeModal('movieModal');
  }
};

// MODAIS & MENU
window.openLoginModal = () => window.openModal('loginModal');
window.openModal = (id) => document.getElementById(id).classList.add('active');
window.closeModal = (id) => document.getElementById(id).classList.remove('active');

const drawer = document.getElementById('navDrawer');
const overlay = document.getElementById('overlay');
function toggleNav(open) {
  if (open) { drawer.classList.add('active'); overlay.classList.add('active'); }
  else { drawer.classList.remove('active'); overlay.classList.remove('active'); }
}
document.getElementById('openNav').onclick = () => toggleNav(true);
overlay.onclick = () => toggleNav(false);

init();
