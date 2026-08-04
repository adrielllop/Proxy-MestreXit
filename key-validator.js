/* ============================================
   KEY VALIDATOR - VALIDAÇÃO DE KEYS
   Integração com Firebase Firestore (Compat)
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

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// State
let validationInProgress = false;
let liveTimeInterval = null;

/**
 * Calcula data de expiração com base na duração
 */
function calculateExpiry(duration, amount) {
  if (duration === "permanente") return null;
  const now = new Date();
  const expiry = new Date(now);
  switch (duration) {
    case "minuto": expiry.setMinutes(expiry.getMinutes() + amount); break;
    case "hora": expiry.setHours(expiry.getHours() + amount); break;
    case "dia": expiry.setDate(expiry.getDate() + amount); break;
    case "mes": expiry.setMonth(expiry.getMonth() + amount); break;
    case "ano": expiry.setFullYear(expiry.getFullYear() + amount); break;
  }
  return firebase.firestore.Timestamp.fromDate(expiry);
}

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
  
  if (progressContainer) progressContainer.classList.remove('hidden');
  if (progressFill) progressFill.style.width = '0%';
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 90) {
      clearInterval(interval);
      if (progressFill) progressFill.style.width = '90%';
    } else {
      if (progressFill) progressFill.style.width = progress + '%';
    }
  }, 100);
  
  return interval;
}

/**
 * Completa a barra de progresso
 */
function completeProgressBar() {
  const progressFill = document.getElementById('key-progress-fill');
  if (progressFill) progressFill.style.width = '100%';
  
  setTimeout(() => {
    const progressContainer = document.getElementById('key-progress-container');
    if (progressContainer) progressContainer.classList.add('hidden');
  }, 500);
}

/**
 * Libera o acesso ao gerador de sensibilidade
 */
function unlockGenerator() {
  const tabs = document.getElementById('main-tabs');
  const panel = document.getElementById('panel-validar-key');
  
  if (panel) {
      panel.classList.add('unlock-animation');
  }

  if (tabs) {
    setTimeout(() => {
        tabs.classList.remove('hidden');
        tabs.style.animation = 'fadeInUp 0.5s ease forwards';
    }, 1000);
    
    // Mudar para a aba do gerador automaticamente após 2 segundos
    setTimeout(() => {
      if (window.switchTab) window.switchTab('ff-current');
    }, 2500);
  }
}

/**
 * Valida uma key no Firebase
 */
window.validateKeyFromInput = async function() {
  const keyInput = document.getElementById('key-input');
  if (!keyInput) return;
  
  const keyStr = keyInput.value.trim().toUpperCase();
  
  if (!keyStr) {
    showKeyResult(false, "⚠️ Digite uma key válida");
    return;
  }
  
  if (validationInProgress) return;
  validationInProgress = true;
  
  const progressInterval = animateProgressBar();
  const validateBtn = document.querySelector('.key-validate-btn');
  if (validateBtn) {
      validateBtn.disabled = true;
      validateBtn.textContent = "Validando...";
  }
  
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
      if (validateBtn) {
          validateBtn.disabled = false;
          validateBtn.textContent = "Validar";
      }
      return;
    }
    
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    const docId = docSnap.id;
    
    // Check if expired
    if (data.status === 'expirada') {
      showKeyResult(false, "❌ Esta key já expirou", data);
      validationInProgress = false;
      if (validateBtn) {
          validateBtn.disabled = false;
          validateBtn.textContent = "Validar";
      }
      return;
    }
    
    // Check and Activate if needed
    if (data.status === 'inativa') {
      const expiresAt = calculateExpiry(data.duration, data.durationAmount);
      await db.collection('keys').doc(docId).update({
        status: 'ativa',
        activatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt: expiresAt
      });
      
      const updatedSnap = await db.collection('keys').doc(docId).get();
      const updatedData = updatedSnap.data();
      const timeLeft = updatedData.expiresAt ? updatedData.expiresAt.toMillis() - Date.now() : null;
      
      showKeyResult(true, "✅ Key ativada! Acesso liberado.", updatedData, timeLeft);
      unlockGenerator();
      if (timeLeft) startLiveCountdown(timeLeft, updatedData);
      
    } else if (data.status === 'ativa') {
      const expiry = data.expiresAt ? data.expiresAt.toMillis() : Infinity;
      const now = Date.now();
      
      if (expiry < now) {
        await db.collection('keys').doc(docId).update({ status: 'expirada' });
        showKeyResult(false, "❌ Esta key já expirou", data);
      } else {
        const timeLeft = expiry === Infinity ? null : expiry - now;
        showKeyResult(true, "✅ Key ativa! Acesso liberado.", data, timeLeft);
        unlockGenerator();
        if (timeLeft) startLiveCountdown(timeLeft, data);
      }
    }
    
    validationInProgress = false;
    if (validateBtn) {
        validateBtn.textContent = "Validado!";
    }
  } catch (err) {
    console.error('Validation error:', err);
    clearInterval(progressInterval);
    completeProgressBar();
    showKeyResult(false, "⚠️ Erro ao validar. Tente novamente");
    validationInProgress = false;
    if (validateBtn) {
        validateBtn.disabled = false;
        validateBtn.textContent = "Validar";
    }
  }
}

/**
 * Mostra resultado da validação
 */
function showKeyResult(valid, message, keyData = null, timeLeft = null) {
  const resultDiv = document.getElementById('key-result');
  const resultContent = document.getElementById('key-result-content');
  
  if (!resultDiv || !resultContent) return;

  let html = `
    <div class="key-result-message ${valid ? 'success' : 'error'}">
      ${message}
    </div>
  `;
  
  if (keyData) {
    html += `
      <div class="key-result-info">
        <div class="key-info-row">
          <span class="key-info-label">Duração:</span>
          <span class="key-info-value">${formatDuration(keyData.durationAmount, keyData.duration)}</span>
        </div>
        <div class="key-info-row">
          <span class="key-info-label">Status:</span>
          <span class="key-info-value status-${keyData.status}">${keyData.status.toUpperCase()}</span>
        </div>
    `;
    
    if (timeLeft !== null && keyData.status === 'ativa') {
      html += `
        <div class="key-info-row">
          <span class="key-info-label">Tempo restante:</span>
          <span class="key-info-value time-left" id="live-time">${formatTimeLeft(timeLeft)}</span>
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
      const tabs = document.getElementById('main-tabs');
      if (tabs) tabs.classList.add('hidden');
      window.location.reload(); // Recarregar para bloquear
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
        window.validateKeyFromInput();
      }
    });
  }
});
