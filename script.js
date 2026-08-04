/* ============================================
   PROXY MESTREXIT - GERADOR DE SENSIBILIDADE
   JavaScript Vanilla - Sem Frameworks
   ============================================ */

(function () {
    'use strict';

    // ==========================================
    // CONFIGURAÇÃO DE VALORES POR VERSÃO
    // ==========================================
    const CONFIG = {
        'ff-current': {
            max: 200,
            suffix: 'current',
            levels: {
                'low':    { min: 30,  max: 80  },   // Baixa: 30-80
                'medium': { min: 80,  max: 150 },   // Média: 80-150
                'high':   { min: 150, max: 200 }    // Alta: 150-200
            }
        },
        'ff-2022': {
            max: 100,
            suffix: '2022',
            levels: {
                'low':    { min: 10,  max: 40  },   // Baixa: 10-40
                'medium': { min: 40,  max: 75  },   // Média: 40-75
                'high':   { min: 75,  max: 100 }    // Alta: 75-100
            }
        }
    };

    // Tipos de sensibilidade
    const SENSITIVITY_TYPES = ['geral', 'reddot', 'mira2x', 'mira4x', 'awm', 'olhadinha'];

    // Versão selecionada por painel (padrão: ff)
    const selectedVersions = {
        'ff-current': 'ff',
        'ff-2022': 'ff-max'
    };

    // Nível de sensibilidade selecionado por painel (padrão: medium)
    const selectedLevels = {
        'ff-current': 'medium',
        'ff-2022': 'medium'
    };

    // Estado de geração
    const generationState = {
        'ff-current': false,
        'ff-2022': false
    };

    // ==========================================
    // TELA DE CARREGAMENTO
    // ==========================================

    /**
     * Simula a tela de carregamento com barra de progresso animada
     */
    function initLoadingScreen() {
        const loadingBar = document.getElementById('loading-bar');
        const loadingScreen = document.getElementById('loading-screen');
        const mainContent = document.getElementById('main-content');
        const footer = document.getElementById('main-footer');

        let progress = 0;
        const totalDuration = 2000; // 2 segundos de carregamento
        const interval = 50;
        const increment = 100 / (totalDuration / interval);

        const loadingInterval = setInterval(function () {
            progress += increment;

            if (progress >= 100) {
                progress = 100;
                clearInterval(loadingInterval);

        // Finalizar carregamento após pequeno delay
        setTimeout(function () {
            loadingScreen.classList.add('fade-out');

            setTimeout(function () {
                loadingScreen.style.display = 'none';
                mainContent.classList.remove('hidden');
                footer.classList.remove('hidden');
                
                // Garantir que apenas o painel de Key esteja visível
                const tabs = document.getElementById('main-tabs');
                if (tabs) tabs.classList.add('hidden');
                
                window.switchTab('validar-key');
            }, 600);
        }, 300);
            }

            loadingBar.style.width = progress + '%';
        }, interval);
    }

    // ==========================================
    // SISTEMA DE ABAS
    // ==========================================

    /**
     * Alterna entre as abas Free Fire Atual e Free Fire 2022
     * @param {string} tabId - ID da aba ('ff-current' ou 'ff-2022')
     */
    window.switchTab = function (tabId) {
        // Remover active de todas as abas
        const allTabs = document.querySelectorAll('.tab-btn');
        allTabs.forEach(function (tab) {
            tab.classList.remove('active');
        });

        // Remover active de todos os painéis
        const allPanels = document.querySelectorAll('.panel');
        allPanels.forEach(function (panel) {
            panel.classList.remove('active');
        });

        // Ativar aba clicada
        const activeTab = document.querySelector('[data-tab="' + tabId + '"]');
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Ativar painel correspondente
        const activePanel = document.getElementById('panel-' + tabId);
        if (activePanel) {
            activePanel.classList.add('active');
        }
    };

    // ==========================================
    // SELETOR DE VERSÃO
    // ==========================================

    /**
     * Seleciona a versão do jogo (Free Fire ou Free Fire MAX)
     * @param {string} panelId - ID do painel
     * @param {string} version - Versão ('ff' ou 'ff-max')
     * @param {HTMLElement} btn - Botão clicado
     */
    window.selectVersion = function (panelId, version, btn) {
        // Atualizar versão selecionada
        selectedVersions[panelId] = version;

        // Atualizar botões de versão
        const panel = document.getElementById('panel-' + panelId);
        const versionBtns = panel.querySelectorAll('.version-btn');
        versionBtns.forEach(function (vBtn) {
            vBtn.classList.remove('active');
        });

        if (btn) {
            btn.classList.add('active');
        }

        // Resetar resultados ao trocar de versão
        resetResults(panelId);
    };

    // ==========================================
    // SELETOR DE NÍVEL DE SENSIBILIDADE
    // ==========================================

    /**
     * Seleciona o nível de sensibilidade (Baixa, Média, Alta)
     * @param {string} panelId - ID do painel ('ff-current' ou 'ff-2022')
     * @param {string} level - Nível ('low', 'medium', 'high')
     * @param {HTMLElement} btn - Botão clicado
     */
    window.selectLevel = function (panelId, level, btn) {
        // Atualizar nível selecionado
        selectedLevels[panelId] = level;

        // Atualizar botões de nível
        const panel = document.getElementById('panel-' + panelId);
        const levelBtns = panel.querySelectorAll('.level-btn');
        levelBtns.forEach(function (lBtn) {
            lBtn.classList.remove('active');
        });

        if (btn) {
            btn.classList.add('active');
        }

        // Resetar resultados ao trocar de nível
        resetResults(panelId);
    };

    // ==========================================
    // GERAÇÃO DE SENSIBILIDADE
    // ==========================================

    /**
     * Gera valor aleatório dentro de uma faixa específica
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @returns {number} Valor aleatório entre min e max
     */
    function randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Gera valores aleatórios de sensibilidade com animação de contagem
     * @param {string} panelSuffix - Sufixo do painel ('current' ou '2022')
     */
    window.gerarSensibilidade = function (panelSuffix) {
        // Evitar geração duplicada
        if (generationState[panelSuffix]) return;
        generationState[panelSuffix] = true;

        const panelId = 'ff-' + panelSuffix;
        const config = CONFIG[panelId];
        const maxVal = config.max;
        const currentLevel = selectedLevels[panelId] || 'medium';
        const levelRange = config.levels[currentLevel];

        // Botões
        const btnGerar = document.getElementById('btn-gerar-' + panelSuffix);
        const btnRegerar = document.getElementById('btn-regerar-' + panelSuffix);

        // Adicionar estado de loading ao botão
        btnGerar.classList.add('loading');
        btnRegerar.classList.add('loading');

        // Esconder resultados durante geração
        const resultItems = document.querySelectorAll('#results-' + panelId + ' .result-item');
        resultItems.forEach(function (item) {
            item.classList.remove('revealed');
        });

        // Resetar barras
        SENSITIVITY_TYPES.forEach(function (type) {
            var bar = document.getElementById('bar-' + type + '-' + panelSuffix);
            if (bar) bar.style.width = '0%';

            var value = document.getElementById('valor-' + type + '-' + panelSuffix);
            if (value) value.textContent = '...';
        });

        // Simular delay de processamento (efeito visual)
        setTimeout(function () {
            // Gerar valores aleatórios únicos dentro da faixa do nível selecionado
            var uniqueValues = new Set();
            while (uniqueValues.size < SENSITIVITY_TYPES.length) {
                uniqueValues.add(randomInRange(levelRange.min, levelRange.max));
            }
            var valueArray = Array.from(uniqueValues);

            // Animar valores com contagem
            SENSITIVITY_TYPES.forEach(function (type, index) {
                setTimeout(function () {
                    animateValue(type, valueArray[index], maxVal, panelSuffix);

                    // Revelar item
                    var item = resultItems[index];
                    if (item) {
                        item.classList.add('revealed');
                        item.style.opacity = '1';
                        item.style.animation = 'fadeInUp 0.4s ease forwards';
                    }

                    // Animar barra
                    var bar = document.getElementById('bar-' + type + '-' + panelSuffix);
                    if (bar) {
                        var percentage = (valueArray[index] / maxVal) * 100;
                        bar.style.width = percentage + '%';
                    }
                }, index * 120);
            });

            // Remover loading e atualizar botões
            setTimeout(function () {
                btnGerar.classList.remove('loading');
                btnRegerar.classList.remove('loading');

                // Mostrar botão "Gerar Novamente"
                btnGerar.classList.add('hidden');
                btnRegerar.classList.remove('hidden');

                // Reativar geração
                generationState[panelSuffix] = false;
            }, SENSITIVITY_TYPES.length * 120 + 400);

        }, 800); // 800ms de "processamento"
    };

    /**
     * Anima a contagem do valor numérico
     * @param {string} type - Tipo de sensibilidade
     * @param {number} target - Valor final
     * @param {number} maxVal - Valor máximo possível
     * @param {string} suffix - Sufixo do painel
     */
    function animateValue(type, target, maxVal, suffix) {
        var element = document.getElementById('valor-' + type + '-' + suffix);
        if (!element) return;

        var start = 0;
        var duration = 600;
        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var elapsed = timestamp - startTime;
            var progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            var easedProgress = 1 - Math.pow(1 - progress, 3);
            var current = Math.round(easedProgress * target);

            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.textContent = target;
                // Efeito de destaque no valor final
                element.style.transform = 'scale(1.15)';
                element.style.transition = 'transform 0.2s ease';
                setTimeout(function () {
                    element.style.transform = 'scale(1)';
                }, 200);
            }
        }

        requestAnimationFrame(step);
    }

    /**
     * Reseta os resultados de um painel
     * @param {string} panelSuffix - Sufixo do painel
     */
    function resetResults(panelSuffix) {
        var suffix = CONFIG['ff-' + panelSuffix].suffix;

        SENSITIVITY_TYPES.forEach(function (type) {
            var value = document.getElementById('valor-' + type + '-' + suffix);
            if (value) value.textContent = '—';

            var bar = document.getElementById('bar-' + type + '-' + suffix);
            if (bar) bar.style.width = '0%';
        });

        // Resetar botões
        var btnGerar = document.getElementById('btn-gerar-' + suffix);
        var btnRegerar = document.getElementById('btn-regerar-' + suffix);

        if (btnGerar) btnGerar.classList.remove('hidden');
        if (btnRegerar) btnRegerar.classList.add('hidden');
    }

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================

    /**
     * Inicializa todos os componentes do aplicativo
     */
    function init() {
        // Iniciar tela de carregamento
        initLoadingScreen();

        // Prevenir zoom em dispositivos móveis ao dar duplo toque
        var lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            var now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });

        // Prevenir pull-to-refresh em mobile
        document.addEventListener('touchmove', function (event) {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        }, { passive: false });
    }

    // Iniciar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
