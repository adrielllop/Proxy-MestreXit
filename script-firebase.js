/* ============================================
   PROXY MESTREXIT - VALIDAÇÃO COM FIREBASE
   Integração com Gerador de Keys
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

// ==========================================
// VALIDAÇÃO DE KEY COM FIREBASE
// ==========================================

/**
 * Valida uma key no Firebase
 */
async function validateKeyWithFirebase(keyStr) {
  try {
    const normalized = keyStr.trim().toUpperCase();
    const snapshot = await db.collection('keys')
      .where('key', '==', normalized)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return {
        valid: false,
        message: '❌ Key não encontrada no sistema.'
      };
    }

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();

    // Check if expired
    if (data.status === 'expirada') {
      return {
        valid: false,
        message: '❌ Esta key já expirou.'
      };
    }

    // Check if active and time left
    if (data.status === 'ativa' && data.expiresAt) {
      const expiry = data.expiresAt.toMillis();
      const now = Date.now();
      if (expiry < now) {
        // Auto-update to expired
        await db.collection('keys').doc(docSnap.id).update({ status: 'expirada' });
        return {
          valid: false,
          message: '❌ Esta key já expirou.'
        };
      }
      const timeLeft = expiry - now;
      return {
        valid: true,
        message: '✅ Key válida e ativa!',
        timeLeft: timeLeft,
        keyData: data
      };
    }

    if (data.status === 'inativa') {
      return {
        valid: true,
        message: '⚠️ Key válida mas ainda não foi ativada no Gerador.',
        keyData: data
      };
    }

    return {
      valid: true,
      message: '✅ Key válida!',
      keyData: data
    };
  } catch (err) {
    console.error('Firebase validation error:', err);
    return {
      valid: false,
      message: '⚠️ Erro ao validar key. Tente novamente.'
    };
  }
}

/**
 * Mostra modal de validação de key
 */
function showKeyValidationModal() {
  const modal = document.createElement('div');
  modal.id = 'key-validation-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: linear-gradient(135deg, rgba(20, 20, 30, 0.95), rgba(30, 30, 45, 0.95));
    border: 1px solid rgba(255, 106, 0, 0.3);
    border-radius: 20px;
    padding: 30px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 0 40px rgba(255, 106, 0, 0.2);
    backdrop-filter: blur(20px);
  `;

  content.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #ff6a00; font-size: 20px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">Validar Key</h2>
      <p style="color: #b0b0c0; font-size: 13px;">Digite sua key para verificar se é válida</p>
    </div>

    <div style="margin-bottom: 15px;">
      <input 
        type="text" 
        id="key-input-modal" 
        placeholder="SENSI-XXXX-XXXX-XXXX-XXXX"
        style="
          width: 100%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 106, 0, 0.3);
          border-radius: 10px;
          color: #ffffff;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        "
      />
    </div>

    <button 
      id="validate-btn-modal" 
      style="
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #ff6a00, #ff8c33);
        border: none;
        border-radius: 10px;
        color: #ffffff;
        font-weight: 600;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 13px;
        transition: all 0.3s ease;
        box-shadow: 0 0 20px rgba(255, 106, 0, 0.4);
        margin-bottom: 10px;
      "
    >Validar Key</button>

    <div id="validation-result-modal" style="display: none; margin-top: 15px; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 10px; border-left: 3px solid #ff6a00;"></div>

    <button 
      id="close-modal-btn" 
      style="
        width: 100%;
        padding: 10px;
        background: transparent;
        border: 1px solid rgba(255, 106, 0, 0.3);
        border-radius: 10px;
        color: #b0b0c0;
        font-weight: 600;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 12px;
        transition: all 0.3s ease;
      "
    >Fechar</button>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Event listeners
  const keyInput = document.getElementById('key-input-modal');
  const validateBtn = document.getElementById('validate-btn-modal');
  const resultDiv = document.getElementById('validation-result-modal');
  const closeBtn = document.getElementById('close-modal-btn');

  validateBtn.addEventListener('click', async () => {
    if (!keyInput.value.trim()) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = '<p style="color: #ff6a00; font-size: 12px;">⚠️ Digite uma key válida</p>';
      return;
    }

    validateBtn.disabled = true;
    validateBtn.textContent = 'Validando...';
    validateBtn.style.opacity = '0.6';

    const result = await validateKeyWithFirebase(keyInput.value);

    validateBtn.disabled = false;
    validateBtn.textContent = 'Validar Key';
    validateBtn.style.opacity = '1';

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
      <p style="color: ${result.valid ? '#00c853' : '#ff6a00'}; font-size: 13px; font-weight: 600; margin-bottom: 8px;">${result.message}</p>
      ${result.keyData ? `
        <div style="font-size: 11px; color: #b0b0c0; line-height: 1.6;">
          <p><strong>Duração:</strong> ${result.keyData.durationAmount} ${result.keyData.duration}</p>
          <p><strong>Status:</strong> ${result.keyData.status}</p>
          ${result.timeLeft ? `<p><strong>Tempo restante:</strong> ${Math.floor(result.timeLeft / 1000 / 60)} minutos</p>` : ''}
        </div>
      ` : ''}
    `;
  });

  keyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') validateBtn.click();
  });

  closeBtn.addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  keyInput.focus();
}

// Adicionar botão de validação ao HTML
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.header');
  if (header) {
    const validateBtn = document.createElement('button');
    validateBtn.textContent = '🔑 Validar Key';
    validateBtn.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #ff6a00, #ff8c33);
      border: none;
      border-radius: 50px;
      color: #ffffff;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
      box-shadow: 0 0 30px rgba(255, 106, 0, 0.4);
      transition: all 0.3s ease;
      z-index: 1000;
      text-transform: uppercase;
      letter-spacing: 1px;
    `;

    validateBtn.addEventListener('mouseover', () => {
      validateBtn.style.transform = 'scale(1.05)';
      validateBtn.style.boxShadow = '0 0 50px rgba(255, 106, 0, 0.6)';
    });

    validateBtn.addEventListener('mouseout', () => {
      validateBtn.style.transform = 'scale(1)';
      validateBtn.style.boxShadow = '0 0 30px rgba(255, 106, 0, 0.4)';
    });

    validateBtn.addEventListener('click', showKeyValidationModal);
    document.body.appendChild(validateBtn);
  }
});
