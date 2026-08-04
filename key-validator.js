/* ============================================
   KEY VALIDATOR - VALIDAÇÃO DE KEYS
   Integração com Firebase Firestore
   ============================================ */

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCm76d4664vWn4RTYAusVDHwj2V4RSNRcs",
  authDomain: "gerador-de-sensi-perm.firebaseapp.com",
  projectId: "gerador-de-sensi-perm",
  storageBucket: "gerador-de-sensi-perm.firebasestorage.app",
  messagingSenderId: "1071178355222",
  appId: "1:1071178355222:web:fe0aed57ad2f324a631b37",
  measurementId: "G-39CEBHZH8F"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// State
let validationInProgress = false;
let liveTimeInterval = null;

/**
 * Formata tempo restante em formato legível
 */
function formatTimeLeft(ms) {
  if (ms <= 0) return "Expirada";
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

/**
 * Formata duração da key
 */
function formatDuration(amount, duration) {
  if (duration === "permanente") return "Permanente";
  const labels = {
    minuto: ["minuto", "minutos"],
    hora: ["hora", "horas"],
    dia: ["dia", "dias"],
    mes: ["mês", "meses"],
    ano: ["ano", "anos"]
  };
  const [singular, plural] = labels[duration] || ["", ""];
  return `${amount} ${amount === 1 ? singular : plural}`;
}

/**
 * Anima a barra de progresso
 */
function animateProgressBar() {
  const progressContainer = document.getElementById('key-progress-container');
  const progressFill = document.getElementById('key-progress-fill');
  
  progressContainer.classList.remove('hidden');
  progressFill.style.width = '0%';
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 20;
    if (progress >= 90) {
      clearInterval(interval);
      progressFill.style.width = '90%';
    } else {
      progressFill.style.width = progress + '%';
    }
  }, 100);
  
  return interval;
}

/**
 * Completa a barra de progresso
 */
function completeProgressBar() {
  const progressFill = document.getElementById('key-progress-fill');
  progressFill.style.width = '100%';
  
  setTimeout(() => {
    document.getElementById('key-progress-container').classList.add('hidden');
  }, 500);
}

/**
 * Valida uma key no Firebase
 */
async function validateKeyFromInput() {
  const keyInput = document.getElementById('key-input');
  const keyStr = keyInput.value.trim().toUpperCase();
  
  if (!keyStr) {
    showKeyResult(false, "⚠️ Digite uma key válida");
    return;
  }
  
  if (validationInProgress) return;
  validationInProgress = true;
  
  const progressInterval = animateProgressBar();
  
  try {
    const snapshot = await db.collection('keys')
      .where('key', '==', keyStr)
      .limit(1)
      .get();
    
    clearInterval(progressInterval);
    completeProgressBar();
    
    if (snapshot.empty) {
      showKeyResult(false, "❌ Key não encontrada no sistema");
      validationInProgress = false;
      return;
    }
    
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    
    // Check if expired
    if (data.status === 'expirada') {
      showKeyResult(false, "❌ Esta key já expirou", data);
      validationInProgress = false;
      return;
    }
    
    // Check if active and time left
    if (data.status === 'ativa' && data.expiresAt) {
      const expiry = data.expiresAt.toMillis();
      const now = Date.now();
      
      if (expiry < now) {
        await db.collection('keys').doc(docSnap.id).update({ status: 'expirada' });
        showKeyResult(false, "❌ Esta key já expirou", data);
        validationInProgress = false;
        return;
      }
      
      const timeLeft = expiry - now;
      showKeyResult(true, "✅ Key válida e ativa!", data, timeLeft);
      
      // Start live countdown
      startLiveCountdown(timeLeft, data);
    } else if (data.status === 'inativa') {
      showKeyResult(true, "⚠️ Key válida mas ainda não foi ativada", data);
    } else {
      showKeyResult(true, "✅ Key válida!", data);
    }
    
    validationInProgress = false;
  } catch (err) {
    console.error('Validation error:', err);
    clearInterval(progressInterval);
    completeProgressBar();
    showKeyResult(false, "⚠️ Erro ao validar. Tente novamente");
    validationInProgress = false;
  }
}

/**
 * Mostra resultado da validação
 */
function showKeyResult(valid, message, keyData = null, timeLeft = null) {
  const resultDiv = document.getElementById('key-result');
  const resultContent = document.getElementById('key-result-content');
  
  let html = `
    <div class="key-result-message ${valid ? 'success' : 'error'}">
      ${message}
    </div>
  `;
  
  if (keyData) {
    html += `
      <div class="key-result-info">
        <div class="key-info-row">
          <span class="key-info-label">Key:</span>
          <span class="key-info-value">${keyData.key}</span>
        </div>
        <div class="key-info-row">
          <span class="key-info-label">Duração:</span>
          <span class="key-info-value">${formatDuration(keyData.durationAmount, keyData.duration)}</span>
        </div>
        <div class="key-info-row">
          <span class="key-info-label">Status:</span>
          <span class="key-info-value status-${keyData.status}">${keyData.status}</span>
        </div>
    `;
    
    if (timeLeft && keyData.status === 'ativa') {
      html += `
        <div class="key-info-row">
          <span class="key-info-label">Tempo restante:</span>
          <span class="key-info-value time-left" id="live-time">${formatTimeLeft(timeLeft)}</span>
        </div>
      `;
    }
    
    if (keyData.duration === 'permanente' && keyData.status === 'ativa') {
      html += `
        <div class="key-info-row">
          <span class="key-info-label">Tipo:</span>
          <span class="key-info-value">Vitalícia ♾️</span>
        </div>
      `;
    }
    
    html += `</div>`;
  }
  
  resultContent.innerHTML = html;
  resultDiv.classList.remove('hidden');
}

/**
 * Inicia contagem regressiva ao vivo
 */
function startLiveCountdown(initialTimeLeft, keyData) {
  if (liveTimeInterval) clearInterval(liveTimeInterval);
  
  let timeLeft = initialTimeLeft;
  const liveTimeElement = document.getElementById('live-time');
  
  if (!liveTimeElement) return;
  
  liveTimeInterval = setInterval(() => {
    timeLeft -= 1000;
    
    if (timeLeft <= 0) {
      clearInterval(liveTimeInterval);
      if (liveTimeElement) {
        liveTimeElement.textContent = 'Expirada';
        liveTimeElement.style.color = '#ff6a00';
      }
    } else {
      if (liveTimeElement) {
        liveTimeElement.textContent = formatTimeLeft(timeLeft);
      }
    }
  }, 1000);
}

// Event listener para Enter no input
document.addEventListener('DOMContentLoaded', () => {
  const keyInput = document.getElementById('key-input');
  if (keyInput) {
    keyInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        validateKeyFromInput();
      }
    });
  }
});
