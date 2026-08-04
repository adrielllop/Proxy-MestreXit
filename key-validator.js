/* ============================================
   KEY VALIDATOR - VALIDAÇÃO DE KEYS + DEVICE LOCK
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

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// State
let validationInProgress = false;
let liveTimeInterval = null;

/**
 * Gera ou recupera um ID único para o dispositivo
 */
function getDeviceId() {
    let deviceId = localStorage.getItem('proxy_mestrexit_hwid');
    if (!deviceId) {
        // Criar um ID baseado em timestamp e strings aleatórias
        deviceId = 'HWID-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem('proxy_mestrexit_hwid', deviceId);
    }
    return deviceId;
}

/**
 * Calcula data de expiração
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

function formatDuration(amount, duration) {
  if (duration === "permanente") return "Permanente";
  const labels = { minuto: ["minuto", "minutos"], hora: ["hora", "horas"], dia: ["dia", "dias"], mes: ["mês", "meses"], ano: ["ano", "anos"] };
  const [singular, plural] = labels[duration] || ["", ""];
  return `${amount} ${amount === 1 ? singular : plural}`;
}

function animateProgressBar() {
  const progressContainer = document.getElementById('key-progress-container');
  const progressFill = document.getElementById('key-progress-fill');
  if (progressContainer) progressContainer.classList.remove('hidden');
  if (progressFill) progressFill.style.width = '0%';
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 90) { clearInterval(interval); if (progressFill) progressFill.style.width = '90%'; }
    else { if (progressFill) progressFill.style.width = progress + '%'; }
  }, 100);
  return interval;
}

function completeProgressBar() {
  const progressFill = document.getElementById('key-progress-fill');
  if (progressFill) progressFill.style.width = '100%';
  setTimeout(() => {
    const progressContainer = document.getElementById('key-progress-container');
    if (progressContainer) progressContainer.classList.add('hidden');
  }, 500);
}

function unlockGenerator() {
  const tabs = document.getElementById('main-tabs');
  const panel = document.getElementById('panel-validar-key');
  if (panel) panel.classList.add('unlock-animation');
  if (tabs) {
    setTimeout(() => { tabs.classList.remove('hidden'); tabs.style.animation = 'fadeInUp 0.5s ease forwards'; }, 1000);
    setTimeout(() => { if (window.switchTab) window.switchTab('ff-current'); }, 2500);
  }
}

/**
 * Valida a key com verificação de Device ID
 */
window.validateKeyFromInput = async function() {
  const keyInput = document.getElementById('key-input');
  if (!keyInput) return;
  
  const keyStr = keyInput.value.trim().toUpperCase();
  const currentDeviceId = getDeviceId();
  
  if (!keyStr) {
    showKeyResult(false, "⚠️ Digite uma key válida");
    return;
  }
  
  if (validationInProgress) return;
  validationInProgress = true;
  
  const progressInterval = animateProgressBar();
  const validateBtn = document.querySelector('.key-validate-btn');
  if (validateBtn) { validateBtn.disabled = true; validateBtn.textContent = "Validando..."; }
  
  try {
    const snapshot = await db.collection('keys')
      .where('key', '==', keyStr)
      .limit(1)
      .get();
    
    clearInterval(progressInterval);
    completeProgressBar();
    
    if (snapshot.empty) {
      showKeyResult(false, "❌ Key não encontrada");
      validationInProgress = false;
      if (validateBtn) { validateBtn.disabled = false; validateBtn.textContent = "Validar"; }
      return;
    }
    
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    const docId = docSnap.id;
    
    // 1. Verificar Expiração
    if (data.status === 'expirada') {
      showKeyResult(false, "❌ Esta key já expirou", data);
      validationInProgress = false;
      if (validateBtn) { validateBtn.disabled = false; validateBtn.textContent = "Validar"; }
      return;
    }
    
    // 2. Verificar Bloqueio de Dispositivo
    if (data.deviceId && data.deviceId !== currentDeviceId) {
        showKeyResult(false, "🚫 Key vinculada a outro dispositivo!", data);
        validationInProgress = false;
        if (validateBtn) { validateBtn.disabled = false; validateBtn.textContent = "Bloqueado"; }
        return;
    }
    
    // 3. Ativação (Primeiro Uso)
    if (data.status === 'inativa') {
      const expiresAt = calculateExpiry(data.duration, data.durationAmount);
      await db.collection('keys').doc(docId).update({
        status: 'ativa',
        activatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt: expiresAt,
        deviceId: currentDeviceId // Vincular ao dispositivo atual
      });
      
      const updatedSnap = await db.collection('keys').doc(docId).get();
      const updatedData = updatedSnap.data();
      const timeLeft = updatedData.expiresAt ? updatedData.expiresAt.toMillis() - Date.now() : null;
      
      showKeyResult(true, "✅ Key ativada e vinculada a este celular!", updatedData, timeLeft);
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
        showKeyResult(true, "✅ Bem-vindo de volta! Acesso liberado.", data, timeLeft);
        unlockGenerator();
        if (timeLeft) startLiveCountdown(timeLeft, data);
      }
    }
    
    validationInProgress = false;
    if (validateBtn) { validateBtn.textContent = "Validado!"; }
  } catch (err) {
    console.error('Validation error:', err);
    clearInterval(progressInterval);
    completeProgressBar();
    showKeyResult(false, "⚠️ Erro na conexão");
    validationInProgress = false;
    if (validateBtn) { validateBtn.disabled = false; validateBtn.textContent = "Validar"; }
  }
}

function showKeyResult(valid, message, keyData = null, timeLeft = null) {
  const resultDiv = document.getElementById('key-result');
  const resultContent = document.getElementById('key-result-content');
  if (!resultDiv || !resultContent) return;

  let html = `<div class="key-result-message ${valid ? 'success' : 'error'}">${message}</div>`;
  
  if (keyData) {
    html += `
      <div class="key-result-info">
        <div class="key-info-row"><span class="key-info-label">Duração:</span><span class="key-info-value">${formatDuration(keyData.durationAmount, keyData.duration)}</span></div>
        <div class="key-info-row"><span class="key-info-label">Status:</span><span class="key-info-value status-${keyData.status}">${keyData.status.toUpperCase()}</span></div>
    `;
    if (timeLeft !== null && keyData.status === 'ativa') {
      html += `<div class="key-info-row"><span class="key-info-label">Tempo restante:</span><span class="key-info-value time-left" id="live-time">${formatTimeLeft(timeLeft)}</span></div>`;
    }
    html += `</div>`;
  }
  
  resultContent.innerHTML = html;
  resultDiv.classList.remove('hidden');
}

function startLiveCountdown(initialTimeLeft, keyData) {
  if (liveTimeInterval) clearInterval(liveTimeInterval);
  let timeLeft = initialTimeLeft;
  const liveTimeElement = document.getElementById('live-time');
  if (!liveTimeElement) return;
  liveTimeInterval = setInterval(() => {
    timeLeft -= 1000;
    if (timeLeft <= 0) {
      clearInterval(liveTimeInterval);
      if (liveTimeElement) { liveTimeElement.textContent = 'Expirada'; liveTimeElement.style.color = '#ff6a00'; }
      window.location.reload();
    } else {
      if (liveTimeElement) liveTimeElement.textContent = formatTimeLeft(timeLeft);
    }
  }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  const keyInput = document.getElementById('key-input');
  if (keyInput) { keyInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') window.validateKeyFromInput(); }); }
});
