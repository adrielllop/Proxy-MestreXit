# 🎮 Proxy MestreXit

Gerador de sensibilidade para **Free Fire Android** com validação de keys integrada ao **Firebase Firestore**.

## ✨ Funcionalidades

- ✅ **Gerador de Sensibilidade**: Para Free Fire Atual e Free Fire 2022
- ✅ **Validação de Keys**: Integrada com o Gerador de Keys via Firebase
- ✅ **Barra Flutuante**: Botão "🔑 Validar Key" no canto inferior direito
- ✅ **Tempo Real**: Mostra tempo restante da key sincronizado com Firebase
- ✅ **Responsivo**: Mobile-first design
- ✅ **Sem Dependências**: Vanilla JavaScript puro

## 🚀 Quick Start

### Opção 1: Servidor Local (Recomendado)

```bash
# Navegar para o diretório
cd proxy-mestrexit

# Iniciar servidor Python
python3 -m http.server 8000

# Abrir no navegador
http://localhost:8000
```

### Opção 2: Abrir Diretamente

Abra o arquivo `index.html` no navegador (algumas funcionalidades podem não funcionar).

## 🔥 Configuração Firebase

O projeto já vem configurado com Firebase. Basta garantir que as Firestore Rules estão corretas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /keys/{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 🎯 Como Usar

### Gerar Sensibilidade

1. Selecione a versão (Free Fire Atual ou 2022)
2. Escolha o nível (Baixa, Média, Alta)
3. Clique em "Gerar Sensibilidade"
4. Os valores aparecem com animação

### Validar Key

1. Clique no botão **"🔑 Validar Key"** (canto inferior direito)
2. Digite uma key gerada no **Gerador de Keys**
3. Sistema valida automaticamente via Firebase
4. Mostra tempo restante se a key estiver ativa

## 📁 Arquivos

```
proxy-mestrexit/
├── README.md               # Este arquivo
├── index.html              # HTML principal
├── style.css               # Estilos (Glassmorphism)
├── script.js               # Gerador de sensibilidade
├── script-firebase.js      # Validação com Firebase
├── logo-principal.png      # Logo
├── logo-ff-2026.jpg        # Logo Free Fire Atual
├── logo-ff-2022.jpg        # Logo Free Fire 2022
├── background.jpg          # Background
└── icons/                  # Ícones
```

## 🎨 Design

- **Tema**: Gamer - Preto + Laranja (Glassmorphism)
- **Animações**: Suave e responsiva
- **Tipografia**: Premium com letter-spacing
- **Responsividade**: Mobile-first

## 🔗 Integração Firebase

O arquivo `script-firebase.js` adiciona:

- Modal de validação de keys
- Busca em tempo real no Firestore
- Verificação de expiração automática
- Exibição de tempo restante

### Firebase Config

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCm76d4664vWn4RTYAusVDHwj2V4RSNRcs",
  authDomain: "gerador-de-sensi-perm.firebaseapp.com",
  projectId: "gerador-de-sensi-perm",
  storageBucket: "gerador-de-sensi-perm.firebasestorage.app",
  messagingSenderId: "1071178355222",
  appId: "1:1071178355222:web:fe0aed57ad2f324a631b37",
  measurementId: "G-39CEBHZH8F"
};
```

## 📱 Responsividade

Totalmente responsivo para:
- 📱 Mobile (375px)
- 📱 Tablet (768px)
- 🖥️ Desktop (1280px+)

## 🔧 Tecnologias

- **Vanilla JavaScript** - Sem frameworks
- **Firebase Firestore** - Database
- **CSS3** - Glassmorphism
- **HTML5** - Semântico

## 📊 Versões Suportadas

### Free Fire Atual
- Baixa: 30-80
- Média: 80-150
- Alta: 150-200

### Free Fire 2022
- Baixa: 10-40
- Média: 40-75
- Alta: 75-100

## 🔗 Links

- **Discord**: https://discord.gg/TcvqSJV98
- **Site**: https://mestrexit-stor.mginex.site/

## 📝 Notas

- Vanilla JavaScript (sem frameworks)
- Firebase Firestore para validação
- Sincronização em tempo real
- Sem dependências externas (exceto Firebase SDK)
- Funciona offline (com cache)

## 🆘 Suporte

Dúvidas? Acesse o Discord: https://discord.gg/TcvqSJV98

---

**Desenvolvido com ❤️ para a comunidade**  
Versão 1.0.0 - Agosto 2026
