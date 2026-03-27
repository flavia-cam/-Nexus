// ============================================
// NEXUS FINANCE - SISTEMA COMPLETO
// ============================================

// DADOS GLOBAIS
let transactions = JSON.parse(localStorage.getItem('nexus_transactions')) || [];
let budgets = JSON.parse(localStorage.getItem('nexus_budgets')) || [];
let goals = JSON.parse(localStorage.getItem('nexus_goals')) || [];
let accounts = JSON.parse(localStorage.getItem('nexus_accounts')) || [];
let categories = JSON.parse(localStorage.getItem('nexus_categories')) || [];
let recurring = JSON.parse(localStorage.getItem('nexus_recurring')) || [];
let profile = JSON.parse(localStorage.getItem('nexus_profile')) || { nome: 'Usuário', email: '' };

// INICIALIZAR DADOS PADRÃO
if (categories.length === 0) {
    categories = [
        { id: 'cat1', nome: 'Alimentação', cor: '#8a2be2', tipo: 'despesa' },
        { id: 'cat2', nome: 'Transporte', cor: '#00ffff', tipo: 'despesa' },
        { id: 'cat3', nome: 'Moradia', cor: '#ff00ff', tipo: 'despesa' },
        { id: 'cat4', nome: 'Lazer', cor: '#ffff00', tipo: 'despesa' },
        { id: 'cat5', nome: 'Saúde', cor: '#00ff00', tipo: 'despesa' },
        { id: 'cat6', nome: 'Salário', cor: '#00ffff', tipo: 'receita' },
        { id: 'cat7', nome: 'Outros', cor: '#8a8aaa', tipo: 'ambos' }
    ];
    localStorage.setItem('nexus_categories', JSON.stringify(categories));
}

if (accounts.length === 0) {
    accounts = [
        { id: 'acc1', nome: 'Conta Corrente', tipo: 'corrente', saldo: 0 },
        { id: 'acc2', nome: 'Poupança', tipo: 'poupanca', saldo: 0 }
    ];
    localStorage.setItem('nexus_accounts', JSON.stringify(accounts));
}

// FUNÇÕES UTILITÁRIAS
function formatCurrency(value) {
    return value.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveAllData() {
    localStorage.setItem('nexus_transactions', JSON.stringify(transactions));
    localStorage.setItem('nexus_budgets', JSON.stringify(budgets));
    localStorage.setItem('nexus_goals', JSON.stringify(goals));
    localStorage.setItem('nexus_accounts', JSON.stringify(accounts));
    localStorage.setItem('nexus_categories', JSON.stringify(categories));
    localStorage.setItem('nexus_recurring', JSON.stringify(recurring));
    localStorage.setItem('nexus_profile', JSON.stringify(profile));
}

function getTotalBalance() {
    return accounts.reduce((acc, a) => acc + a.saldo, 0);
}

// ========== DASHBOARD ==========
if (document.getElementById('dashboardSaldo')) {
    let evolucaoChart, categoriasChart;
    
    function updateDashboard() {
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const receitasMes = transactions.filter(t => t.tipo === 'receita' && t.data.startsWith(currentMonth)).reduce((acc, t) => acc + t.valor, 0);
        const despesasMes = transactions.filter(t => t.tipo === 'despesa' && t.data.startsWith(currentMonth)).reduce((acc, t) => acc + t.valor, 0);
        const saldoTotal = getTotalBalance();
        const economia = receitasMes - despesasMes;
        
        document.getElementById('dashboardSaldo').textContent = formatCurrency(saldoTotal);
        document.getElementById('dashboardReceitas').textContent = formatCurrency(receitasMes);
        document.getElementById('dashboardDespesas').textContent = formatCurrency(despesasMes);
        document.getElementById('dashboardEconomia').textContent = formatCurrency(economia);
        
        updateRecentTransactions();
        updateEvolucaoChart();
        updateCategoriasChart();
    }
    
    function updateRecentTransactions() {
        const tbody = document.getElementById('dashboardTransacoes');
        if (!tbody) return;
        const recent = [...transactions].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5);
        if (recent.length === 0) { tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-[#8a8aaa]">Nenhuma transação</td></tr>'; return; }
        tbody.innerHTML = recent.map(t => `<tr class="border-b border-[rgba(138,43,226,0.3)]"><td class="py-3">${new Date(t.data).toLocaleDateString('pt-br')}</td><td class="py-3">${t.descricao}</td><td class="py-3">${t.categoria}</td><td class="py-3 text-right ${t.tipo === 'receita' ? 'text-green-400' : 'text-red-400'}">${t.tipo === 'receita' ? '+' : '-'} ${formatCurrency(t.valor)}</td></tr>`).join('');
    }
    
    function updateEvolucaoChart() {
        if (!evolucaoChart) return;
        const sorted = [...transactions].sort((a, b) => new Date(a.data) - new Date(b.data));
        const labels = [], saldos = [];
        let saldo = 0;
        sorted.forEach(t => { labels.push(new Date(t.data).toLocaleDateString('pt-br')); saldo += t.tipo === 'receita' ? t.valor : -t.valor; saldos.push(saldo); });
        evolucaoChart.data.labels = labels.slice(-30);
        evolucaoChart.data.datasets[0].data = saldos.slice(-30);
        evolucaoChart.update();
    }
    
    function updateCategoriasChart() {
        if (!categoriasChart) return;
        const despesasPorCategoria = {};
        const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        transactions.filter(t => t.tipo === 'despesa' && t.data.startsWith(currentMonth)).forEach(t => { despesasPorCategoria[t.categoria] = (despesasPorCategoria[t.categoria] || 0) + t.valor; });
        const labels = Object.keys(despesasPorCategoria);
        categoriasChart.data.labels = labels;
        categoriasChart.data.datasets[0].data = Object.values(despesasPorCategoria);
        categoriasChart.update();
    }
    
    function initDashboardCharts() {
        const ctxEvolucao = document.getElementById('dashboardEvolucaoChart')?.getContext('2d');
        const ctxCategorias = document.getElementById('dashboardCategoriasChart')?.getContext('2d');
        if (ctxEvolucao) evolucaoChart = new Chart(ctxEvolucao, { type: 'line', data: { labels: [], datasets: [{ label: 'Saldo', data: [], borderColor: '#8a2be2', backgroundColor: 'rgba(138, 43, 226, 0.1)', borderWidth: 3, tension: 0.4, fill: true }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e0e0ff' } } }, scales: { y: { grid: { color: 'rgba(138, 43, 226, 0.2)' }, ticks: { color: '#e0e0ff' } }, x: { grid: { color: 'rgba(138, 43, 226, 0.2)' }, ticks: { color: '#e0e0ff' } } } } });
        if (ctxCategorias) categoriasChart = new Chart(ctxCategorias, { type: 'doughnut', data: { labels: [], datasets: [{ data: [], backgroundColor: ['#8a2be2', '#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff8000'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e0e0ff' } } } } });
        updateEvolucaoChart();
        updateCategoriasChart();
    }
    
    updateDashboard();
    initDashboardCharts();
    setInterval(updateDashboard, 30000);
}

// ========== TRANSAÇÕES ==========
if (document.getElementById('transacoesList')) {
    let currentEditId = null;
    
    function renderTransacoes() {
        const tbody = document.getElementById('transacoesList');
        if (!tbody) return;
        const busca = document.getElementById('filtroBusca')?.value.toLowerCase() || '';
        const categoria = document.getElementById('filtroCategoria')?.value || '';
        const tipo = document.getElementById('filtroTipo')?.value || '';
        const contaId = document.getElementById('filtroConta')?.value || '';
        let filtered = [...transactions];
        if (busca) filtered = filtered.filter(t => t.descricao.toLowerCase().includes(busca));
        if (categoria) filtered = filtered.filter(t => t.categoria === categoria);
        if (tipo) filtered = filtered.filter(t => t.tipo === tipo);
        if (contaId) filtered = filtered.filter(t => t.contaId === contaId);
        filtered.sort((a, b) => new Date(b.data) - new Date(a.data));
        if (filtered.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-[#8a8aaa]">Nenhuma transação</td></tr>'; return; }
        tbody.innerHTML = filtered.map(t => { const acc = accounts.find(a => a.id === t.contaId); return `<tr class="border-b border-[rgba(138,43,226,0.3)]"><td class="py-3">${new Date(t.data).toLocaleDateString('pt-br')}</td><td class="py-3">${t.descricao}</td><td class="py-3">${t.categoria}</td><td class="py-3">${acc ? acc.nome : 'Sem conta'}</td><td class="py-3 text-right ${t.tipo === 'receita' ? 'text-green-400' : 'text-red-400'}">${t.tipo === 'receita' ? '+' : '-'} ${formatCurrency(t.valor)}</td><td class="py-3 text-center"><button onclick="editarTransacao('${t.id}')" class="text-[#00ffff] hover:text-[#8a2be2] mr-2">✎</button><button onclick="excluirTransacao('${t.id}')" class="text-red-400 hover:text-red-600">✕</button></td></tr>`; }).join('');
    }
    
    function carregarFiltros() {
        const catSelect = document.getElementById('filtroCategoria');
        const contaSelect = document.getElementById('filtroConta');
        if (catSelect) catSelect.innerHTML = '<option value="">Todas</option>' + categories.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
        if (contaSelect) contaSelect.innerHTML = '<option value="">Todas</option>' + accounts.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');
        const transCatSelect = document.getElementById('transacaoCategoria');
        if (transCatSelect) transCatSelect.innerHTML = categories.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
        const transContaSelect = document.getElementById('transacaoConta');
        if (transContaSelect) transContaSelect.innerHTML = accounts.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');
    }
    
    window.abrirModalTransacao = (editId = null) => {
        currentEditId = editId;
        const modal = document.getElementById('transacaoModal');
        const form = document.getElementById('transacaoForm');
        if (editId) {
            document.getElementById('modalTitle').textContent = 'Editar Transação';
            const t = transactions.find(t => t.id === editId);
            if (t) { document.getElementById('transacaoDescricao').value = t.descricao; document.getElementById('transacaoValor').value = t.valor; document.querySelector(`input[name="transacaoTipo"][value="${t.tipo}"]`).checked = true; document.getElementById('transacaoCategoria').value = t.categoria; document.getElementById('transacaoConta').value = t.contaId; document.getElementById('transacaoData').value = t.data; }
        } else { document.getElementById('modalTitle').textContent = 'Nova Transação'; form.reset(); document.getElementById('transacaoData').value = new Date().toISOString().split('T')[0]; document.querySelector('input[name="transacaoTipo"][value="receita"]').checked = true; }
        carregarFiltros();
        modal.classList.remove('hidden'); modal.classList.add('flex');
    };
    
    window.fecharModalTransacao = () => { const modal = document.getElementById('transacaoModal'); modal.classList.add('hidden'); modal.classList.remove('flex'); currentEditId = null; };
    
    window.salvarTransacao = (event) => {
        event.preventDefault();
        const descricao = document.getElementById('transacaoDescricao').value;
        const valor = parseFloat(document.getElementById('transacaoValor').value);
        const tipo = document.querySelector('input[name="transacaoTipo"]:checked').value;
        const categoria = document.getElementById('transacaoCategoria').value;
        const contaId = document.getElementById('transacaoConta').value;
        const data = document.getElementById('transacaoData').value;
        
        if (currentEditId) {
            const index = transactions.findIndex(t => t.id === currentEditId);
            const old = transactions[index];
            const oldAcc = accounts.find(a => a.id === old.contaId);
            if (oldAcc) oldAcc.saldo += old.tipo === 'receita' ? -old.valor : old.valor;
            transactions[index] = { ...old, descricao, valor, tipo, categoria, contaId, data };
            const newAcc = accounts.find(a => a.id === contaId);
            if (newAcc) newAcc.saldo += tipo === 'receita' ? valor : -valor;
        } else {
            transactions.push({ id: generateId(), descricao, valor, tipo, categoria, contaId, data, timestamp: Date.now() });
            const acc = accounts.find(a => a.id === contaId);
            if (acc) acc.saldo += tipo === 'receita' ? valor : -valor;
        }
        saveAllData();
        fecharModalTransacao();
        renderTransacoes();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof renderOrcamentos === 'function') renderOrcamentos();
        if (typeof renderMetas === 'function') renderMetas();
    };
    
    window.editarTransacao = (id) => { abrirModalTransacao(id); };
    window.excluirTransacao = (id) => {
        if (confirm('Excluir esta transação?')) {
            const t = transactions.find(t => t.id === id);
            if (t && t.contaId) { const acc = accounts.find(a => a.id === t.contaId); if (acc) acc.saldo += t.tipo === 'receita' ? -t.valor : t.valor; }
            transactions = transactions.filter(t => t.id !== id);
            saveAllData();
            renderTransacoes();
            if (typeof updateDashboard === 'function') updateDashboard();
            if (typeof renderOrcamentos === 'function') renderOrcamentos();
        }
    };
    
    document.querySelectorAll('#filtroBusca, #filtroCategoria, #filtroTipo, #filtroConta').forEach(el => { if (el) el.addEventListener('change', renderTransacoes); if (el && el.id === 'filtroBusca') el.addEventListener('input', renderTransacoes); });
    carregarFiltros();
    renderTransacoes();
}

// ========== ORÇAMENTO ==========
if (document.getElementById('orcamentosList')) {
    function getCategoryExpenses(category, month) { return transactions.filter(t => t.tipo === 'despesa' && t.categoria === category && t.data.startsWith(month)).reduce((acc, t) => acc + t.valor, 0); }
    function getBudgetProgress(budget) { const spent = getCategoryExpenses(budget.categoria, budget.mes); const percent = (spent / budget.limite) * 100; return { spent, percent, isOver: spent > budget.limite, isWarning: percent >= 80 && percent < 100 }; }
    
    function renderOrcamentos() {
        const container = document.getElementById('orcamentosList');
        if (!container) return;
        if (budgets.length === 0) { container.innerHTML = '<div class="col-span-full text-center py-12 text-[#8a8aaa]">Nenhum orçamento definido</div>'; return; }
        container.innerHTML = budgets.map(b => { const { spent, percent, isOver, isWarning } = getBudgetProgress(b); const remaining = b.limite - spent; return `<div class="cyber-panel p-6"><div class="flex justify-between items-start mb-4"><div><h3 class="font-['Orbitron'] text-xl text-[#00ffff]">${b.categoria}</h3><p class="text-sm text-[#8a8aaa]">${b.mes.replace('-', '/')}</p></div><button onclick="excluirOrcamento('${b.id}')" class="text-red-400 hover:text-red-600">&times;</button></div><div class="mb-3"><div class="flex justify-between text-sm mb-1"><span>Gasto vs Limite</span><span class="${isOver ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-green-400'}">${formatCurrency(spent)} / ${formatCurrency(b.limite)}</span></div><div class="progresso-bar"><div class="progresso-fill" style="width: ${Math.min(100, percent)}%; background: ${isOver ? '#ff4444' : isWarning ? '#ffaa00' : 'linear-gradient(90deg, #8a2be2, #00ffff)'}"></div></div><div class="flex justify-between text-sm mt-1"><span>${percent.toFixed(0)}% utilizado</span><span class="${remaining >= 0 ? 'text-green-400' : 'text-red-400'}">${remaining >= 0 ? `Restam ${formatCurrency(remaining)}` : `Excedeu ${formatCurrency(Math.abs(remaining))}`}</span></div></div>${isOver ? '<div class="mt-3 p-2 bg-red-900/30 border border-red-500 rounded text-red-400 text-sm">⚠️ ORÇAMENTO ULTRAPASSADO!</div>' : ''}${isWarning && !isOver ? '<div class="mt-3 p-2 bg-yellow-900/30 border border-yellow-500 rounded text-yellow-400 text-sm">⚡ ATENÇÃO: Próximo do limite!</div>' : ''}</div>`; }).join('');
    }
    
    window.abrirModalOrcamento = () => { const modal = document.getElementById('orcamentoModal'); modal.classList.remove('hidden'); modal.classList.add('flex'); };
    window.fecharModalOrcamento = () => { const modal = document.getElementById('orcamentoModal'); modal.classList.add('hidden'); modal.classList.remove('flex'); };
    window.salvarOrcamento = (event) => {
        event.preventDefault();
        const categoria = document.getElementById('orcamentoCategoria').value;
        const limite = parseFloat(document.getElementById('orcamentoLimite').value);
        const mes = document.getElementById('orcamentoMes').value;
        if (!categoria || !limite || !mes) return;
        const existing = budgets.find(b => b.categoria === categoria && b.mes === mes);
        if (existing) { if (confirm('Já existe um orçamento para esta categoria neste mês. Deseja substituir?')) { const index = budgets.findIndex(b => b.id === existing.id); budgets[index] = { ...existing, limite }; } else return; }
        else budgets.push({ id: generateId(), categoria, limite, mes });
        saveAllData();
        fecharModalOrcamento();
        renderOrcamentos();
        document.getElementById('orcamentoForm').reset();
        document.getElementById('orcamentoMes').value = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    };
    window.excluirOrcamento = (id) => { if (confirm('Excluir este orçamento?')) { budgets = budgets.filter(b => b.id !== id); saveAllData(); renderOrcamentos(); } };
    
    const catSelect = document.getElementById('orcamentoCategoria');
    if (catSelect) catSelect.innerHTML = categories.filter(c => c.tipo === 'despesa' || c.tipo === 'ambos').map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
    document.getElementById('orcamentoMes').value = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    renderOrcamentos();
}

// ========== METAS ==========
if (document.getElementById('metasList')) {
    function getGoalProgress(goal) {
        const currentSavings = transactions.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0) - transactions.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0);
        const percent = (currentSavings / goal.valorAlvo) * 100;
        return { current: currentSavings, percent, isAchieved: currentSavings >= goal.valorAlvo };
    }
    function calculateMonthlyNeeded(goal) {
        const today = new Date();
        const targetDate = new Date(goal.dataLimite);
        const monthsDiff = (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth());
        const currentSavings = transactions.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0) - transactions.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0);
        const remaining = Math.max(0, goal.valorAlvo - currentSavings);
        return monthsDiff > 0 ? remaining / monthsDiff : remaining;
    }
    
    function renderMetas() {
        const container = document.getElementById('metasList');
        if (!container) return;
        if (goals.length === 0) { container.innerHTML = '<div class="col-span-full text-center py-12 text-[#8a8aaa]">Nenhuma meta criada</div>'; return; }
        container.innerHTML = goals.map(g => { const { current, percent, isAchieved } = getGoalProgress(g); const monthlyNeeded = calculateMonthlyNeeded(g); const daysLeft = Math.ceil((new Date(g.dataLimite) - new Date()) / (1000 * 60 * 60 * 24)); return `<div class="cyber-panel p-6 ${isAchieved ? 'border-green-500' : ''}"><div class="flex justify-between items-start mb-4"><div><h3 class="font-['Orbitron'] text-xl text-[#00ffff]">${g.titulo}</h3><p class="text-sm text-[#8a8aaa] mt-1">${g.descricao || 'Sem descrição'}</p></div><button onclick="excluirMeta('${g.id}')" class="text-red-400 hover:text-red-600">&times;</button></div><div class="mb-4"><div class="flex justify-between text-sm mb-1"><span>Progresso</span><span>${formatCurrency(current)} / ${formatCurrency(g.valorAlvo)}</span></div><div class="progresso-bar"><div class="progresso-fill" style="width: ${Math.min(100, percent)}%; background: ${isAchieved ? '#00ff88' : 'linear-gradient(90deg, #8a2be2, #00ffff)'}"></div></div><div class="text-right text-sm mt-1">${percent.toFixed(0)}% concluído</div></div><div class="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-[rgba(138,43,226,0.3)]"><div><p class="text-xs text-[#8a8aaa]">Meta</p><p class="font-semibold">${g.categoria.toUpperCase()}</p></div><div><p class="text-xs text-[#8a8aaa]">Prazo</p><p class="font-semibold">${new Date(g.dataLimite).toLocaleDateString('pt-br')} (${daysLeft} dias)</p></div></div><div class="p-3 bg-[rgba(138,43,226,0.1)] rounded-lg"><p class="text-xs text-[#8a8aaa] mb-1">PLANEJAMENTO</p><p class="font-['Orbitron'] text-lg text-[#00ffff]">${formatCurrency(monthlyNeeded)}<span class="text-sm text-[#8a8aaa]"> / mês</span></p><p class="text-xs text-[#8a8aaa] mt-1">Valor mensal necessário</p></div>${isAchieved ? '<div class="mt-3 p-2 bg-green-900/30 border border-green-500 rounded text-green-400 text-sm text-center">🎉 META ATINGIDA! PARABÉNS! 🎉</div>' : ''}</div>`; }).join('');
    }
    
    window.abrirModalMeta = () => { const modal = document.getElementById('metaModal'); modal.classList.remove('hidden'); modal.classList.add('flex'); document.getElementById('metaForm').reset(); const amanha = new Date(); amanha.setDate(amanha.getDate() + 1); document.getElementById('metaDataLimite').min = amanha.toISOString().split('T')[0]; document.getElementById('planejamentoMensal').classList.add('hidden'); };
    window.fecharModalMeta = () => { const modal = document.getElementById('metaModal'); modal.classList.add('hidden'); modal.classList.remove('flex'); };
    window.salvarMeta = (event) => {
        event.preventDefault();
        goals.push({ id: generateId(), titulo: document.getElementById('metaTitulo').value, descricao: document.getElementById('metaDescricao').value, valorAlvo: parseFloat(document.getElementById('metaValorAlvo').value), dataLimite: document.getElementById('metaDataLimite').value, categoria: document.getElementById('metaCategoria').value, createdAt: new Date().toISOString() });
        saveAllData();
        fecharModalMeta();
        renderMetas();
    };
    window.excluirMeta = (id) => { if (confirm('Excluir esta meta?')) { goals = goals.filter(g => g.id !== id); saveAllData(); renderMetas(); } };
    
    document.getElementById('metaValorAlvo')?.addEventListener('input', () => { const valor = parseFloat(document.getElementById('metaValorAlvo').value); const data = document.getElementById('metaDataLimite').value; if (valor && data) { const today = new Date(); const target = new Date(data); const monthsDiff = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth()); const currentSavings = transactions.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0) - transactions.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0); const remaining = Math.max(0, valor - currentSavings); const monthly = monthsDiff > 0 ? remaining / monthsDiff : remaining; document.getElementById('planejamentoMensal').classList.remove('hidden'); document.getElementById('valorMensalNecessario').textContent = formatCurrency(monthly); } else { document.getElementById('planejamentoMensal').classList.add('hidden'); } });
    document.getElementById('metaDataLimite')?.addEventListener('change', () => { document.getElementById('metaValorAlvo').dispatchEvent(new Event('input')); });
    renderMetas();
}

// ========== CONTAS ==========
if (document.getElementById('contasList')) {
    function renderContas() {
        const container = document.getElementById('contasList');
        if (!container) return;
        if (accounts.length === 0) { container.innerHTML = '<div class="col-span-full text-center py-12 text-[#8a8aaa]">Nenhuma conta cadastrada</div>'; return; }
        container.innerHTML = accounts.map(a => { const saldoColor = a.saldo >= 0 ? 'text-green-400' : 'text-red-400'; const tipoIcon = a.tipo === 'corrente' ? '💳' : a.tipo === 'poupanca' ? '🏦' : '💎'; return `<div class="cyber-panel p-6"><div class="flex justify-between items-start mb-4"><div class="flex items-center gap-2"><span class="text-2xl">${tipoIcon}</span><h3 class="font-['Orbitron'] text-xl text-[#00ffff]">${a.nome}</h3></div><button onclick="excluirConta('${a.id}')" class="text-red-400 hover:text-red-600">&times;</button></div><div class="mt-4"><p class="text-[#8a8aaa] text-sm">Saldo</p><p class="font-['Orbitron'] text-2xl ${saldoColor}">${formatCurrency(a.saldo)}</p></div><div class="mt-4 pt-4 border-t border-[rgba(138,43,226,0.3)]"><p class="text-[#8a8aaa] text-xs">Tipo: ${a.tipo.toUpperCase()}</p></div></div>`; }).join('');
        document.getElementById('saldoTotalContas').textContent = formatCurrency(getTotalBalance());
    }
    
    function renderRecorrentes() {
        const container = document.getElementById('recorrentesList');
        if (!container) return;
        if (recurring.length === 0) { container.innerHTML = '<div class="text-center py-8 text-[#8a8aaa]">Nenhum gasto recorrente</div>'; return; }
        container.innerHTML = `<div class="space-y-3">${recurring.map(r => `<div class="flex justify-between items-center p-3 bg-[rgba(138,43,226,0.1)] rounded-lg"><div><p class="font-semibold">${r.descricao}</p><p class="text-sm text-[#8a8aaa]">Vence dia ${r.dia}</p></div><div class="text-right"><p class="text-red-400">${formatCurrency(r.valor)}</p><button onclick="excluirRecorrente('${r.id}')" class="text-xs text-red-400 hover:text-red-600">Excluir</button></div></div>`).join('')}</div>`;
    }
    
    function carregarContasSelect() { document.querySelectorAll('#recorrenteConta, #transacaoConta').forEach(select => { if (select) select.innerHTML = accounts.map(a => `<option value="${a.id}">${a.nome}</option>`).join(''); }); }
    
    window.abrirModalConta = () => { const modal = document.getElementById('contaModal'); modal.classList.remove('hidden'); modal.classList.add('flex'); };
    window.fecharModalConta = () => { const modal = document.getElementById('contaModal'); modal.classList.add('hidden'); modal.classList.remove('flex'); };
    window.salvarConta = (event) => { event.preventDefault(); accounts.push({ id: generateId(), nome: document.getElementById('contaNome').value, tipo: document.getElementById('contaTipo').value, saldo: parseFloat(document.getElementById('contaSaldo').value) }); saveAllData(); fecharModalConta(); renderContas(); carregarContasSelect(); };
    window.excluirConta = (id) => { if (confirm('Excluir esta conta?')) { accounts = accounts.filter(a => a.id !== id); saveAllData(); renderContas(); carregarContasSelect(); } };
    
    window.abrirModalRecorrente = () => { carregarContasSelect(); const modal = document.getElementById('recorrenteModal'); modal.classList.remove('hidden'); modal.classList.add('flex'); };
    window.fecharModalRecorrente = () => { const modal = document.getElementById('recorrenteModal'); modal.classList.add('hidden'); modal.classList.remove('flex'); };
    window.salvarRecorrente = (event) => { event.preventDefault(); recurring.push({ id: generateId(), descricao: document.getElementById('recorrenteDescricao').value, valor: parseFloat(document.getElementById('recorrenteValor').value), dia: parseInt(document.getElementById('recorrenteDia').value), contaId: document.getElementById('recorrenteConta').value }); saveAllData(); fecharModalRecorrente(); renderRecorrentes(); };
    window.excluirRecorrente = (id) => { if (confirm('Excluir este gasto recorrente?')) { recurring = recurring.filter(r => r.id !== id); saveAllData(); renderRecorrentes(); } };
    
    renderContas();
    renderRecorrentes();
    carregarContasSelect();
}

// ========== RELATÓRIOS ==========
// ========== RELATÓRIOS ==========
if (document.getElementById('comparativoMensalChart')) {
    console.log('Inicializando página de relatórios');
    let comparativoChart = null;
    let resumoChart = null;
    
    function initRelatoriosChartsLocal() {
        const ctxComp = document.getElementById('comparativoMensalChart')?.getContext('2d');
        const ctxRes = document.getElementById('resumoCategoriaChart')?.getContext('2d');
        
        if (ctxComp) {
            if (comparativoChart) comparativoChart.destroy();
            comparativoChart = new Chart(ctxComp, {
                type: 'bar',
                data: { labels: [], datasets: [{ label: 'Receitas', data: [], backgroundColor: 'rgba(0, 255, 255, 0.7)' }, { label: 'Despesas', data: [], backgroundColor: 'rgba(255, 0, 255, 0.7)' }] },
                options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: '#e0e0ff' } } }, scales: { y: { grid: { color: 'rgba(138, 43, 226, 0.2)' }, ticks: { color: '#e0e0ff' } }, x: { grid: { color: 'rgba(138, 43, 226, 0.2)' }, ticks: { color: '#e0e0ff' } } } }
            });
        }
        
        if (ctxRes) {
            if (resumoChart) resumoChart.destroy();
            resumoChart = new Chart(ctxRes, {
                type: 'doughnut',
                data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
                options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { color: '#e0e0ff' } } } }
            });
        }
    }
    
    window.gerarRelatorio = function() {
        const inicio = document.getElementById('relatorioInicio').value;
        const fim = document.getElementById('relatorioFim').value;
        if (!inicio || !fim) return;
        
        const transacoesPeriodo = transactions.filter(t => t.data >= inicio && t.data <= fim);
        
        const mesesMap = new Map();
        transacoesPeriodo.forEach(t => { const mes = t.data.substring(0, 7); if (!mesesMap.has(mes)) mesesMap.set(mes, { receitas: 0, despesas: 0 }); const data = mesesMap.get(mes); if (t.tipo === 'receita') data.receitas += t.valor; else data.despesas += t.valor; });
        const mesesOrdenados = Array.from(mesesMap.keys()).sort();
        if (comparativoChart) { comparativoChart.data.labels = mesesOrdenados.map(m => m.replace('-', '/')); comparativoChart.data.datasets[0].data = mesesOrdenados.map(m => mesesMap.get(m).receitas); comparativoChart.data.datasets[1].data = mesesOrdenados.map(m => mesesMap.get(m).despesas); comparativoChart.update(); }
        
        const categoriasMap = new Map();
        transacoesPeriodo.forEach(t => { if (!categoriasMap.has(t.categoria)) categoriasMap.set(t.categoria, { receitas: 0, despesas: 0 }); const data = categoriasMap.get(t.categoria); if (t.tipo === 'receita') data.receitas += t.valor; else data.despesas += t.valor; });
        const categoriasList = Array.from(categoriasMap.keys());
        if (resumoChart) { resumoChart.data.labels = categoriasList; resumoChart.data.datasets[0].data = categoriasList.map(c => categoriasMap.get(c).despesas); resumoChart.data.datasets[0].backgroundColor = categoriasList.map(c => { const cat = categories.find(cat => cat.nome === c); return cat ? cat.cor : '#8a2be2'; }); resumoChart.update(); }
        
        const tbody = document.getElementById('detalhamentoRelatorio');
        if (tbody) { if (categoriasList.length === 0) tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Nenhum dado</td></tr>'; else tbody.innerHTML = categoriasList.map(c => { const { receitas, despesas } = categoriasMap.get(c); const saldo = receitas - despesas; return `<tr><td class="py-2">${c}</td><td class="text-right text-green-400">${formatCurrency(receitas)}</td><td class="text-right text-red-400">${formatCurrency(despesas)}</td><td class="text-right ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}">${formatCurrency(saldo)}</td></tr>`; }).join(''); }
    };
    
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioInput = document.getElementById('relatorioInicio');
    const fimInput = document.getElementById('relatorioFim');
    if (inicioInput) inicioInput.value = primeiroDia.toISOString().split('T')[0];
    if (fimInput) fimInput.value = hoje.toISOString().split('T')[0];
    
    initRelatoriosChartsLocal();
    setTimeout(() => { if (typeof window.gerarRelatorio === 'function') window.gerarRelatorio(); }, 100);
}

// ========== CONFIGURAÇÕES ==========
if (document.getElementById('perfilNome')) {
    function renderCategorias() {
        const container = document.getElementById('categoriasList');
        if (!container) return;
        container.innerHTML = categories.map(c => `<div class="flex justify-between items-center p-3 bg-[rgba(138,43,226,0.1)] rounded-lg"><div class="flex items-center gap-3"><div class="w-4 h-4 rounded-full" style="background-color: ${c.cor}"></div><div><p class="font-semibold">${c.nome}</p><p class="text-xs text-[#8a8aaa]">${c.tipo}</p></div></div><div class="flex gap-2"><button onclick="editarCategoria('${c.id}')" class="text-[#00ffff] hover:text-[#8a2be2]">✎</button><button onclick="excluirCategoria('${c.id}')" class="text-red-400 hover:text-red-600">✕</button></div></div>`).join('');
    }
    
    window.salvarPerfil = () => { profile.nome = document.getElementById('perfilNome').value; profile.email = document.getElementById('perfilEmail').value; saveAllData(); alert('Perfil salvo!'); };
    window.mudarTema = (theme) => { const root = document.documentElement; if (theme === 'dark') { root.style.setProperty('--primary', '#8a2be2'); root.style.setProperty('--secondary', '#00ffff'); } else if (theme === 'purple') { root.style.setProperty('--primary', '#b300ff'); root.style.setProperty('--secondary', '#ff00aa'); } else { root.style.setProperty('--primary', '#00ffff'); root.style.setProperty('--secondary', '#8a2be2'); } localStorage.setItem('nexus_theme', theme); };
    window.exportarDados = () => { const data = { transactions, budgets, goals, accounts, categories, recurring, profile }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `nexus_${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url); };
    window.importarDados = () => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'; input.onchange = e => { const file = e.target.files[0]; const reader = new FileReader(); reader.onload = event => { try { const data = JSON.parse(event.target.result); if (data.transactions) transactions = data.transactions; if (data.budgets) budgets = data.budgets; if (data.goals) goals = data.goals; if (data.accounts) accounts = data.accounts; if (data.categories) categories = data.categories; if (data.recurring) recurring = data.recurring; if (data.profile) profile = data.profile; saveAllData(); alert('✅ Dados importados! Recarregando...'); location.reload(); } catch (err) { alert('❌ Erro ao importar'); } }; reader.readAsText(file); }; input.click(); };
    window.limparDados = () => { if (confirm('⚠️ TEM CERTEZA? TODOS OS DADOS SERÃO PERDIDOS!')) { localStorage.clear(); alert('Dados limpos! Recarregando...'); location.reload(); } };
    window.abrirModalCategoria = () => { const modal = document.getElementById('categoriaModal'); modal.classList.remove('hidden'); modal.classList.add('flex'); };
    window.fecharModalCategoria = () => { const modal = document.getElementById('categoriaModal'); modal.classList.add('hidden'); modal.classList.remove('flex'); };
    window.salvarCategoria = (event) => { event.preventDefault(); const nome = document.getElementById('categoriaNome').value; if (categories.some(c => c.nome === nome)) { alert('Categoria já existe!'); return; } categories.push({ id: generateId(), nome, cor: document.getElementById('categoriaCor').value, tipo: document.getElementById('categoriaTipo').value }); saveAllData(); fecharModalCategoria(); renderCategorias(); };
    window.editarCategoria = (id) => { const cat = categories.find(c => c.id === id); if (!cat) return; const novoNome = prompt('Novo nome:', cat.nome); if (novoNome && novoNome !== cat.nome) { transactions.forEach(t => { if (t.categoria === cat.nome) t.categoria = novoNome; }); budgets.forEach(b => { if (b.categoria === cat.nome) b.categoria = novoNome; }); cat.nome = novoNome; saveAllData(); renderCategorias(); if (typeof renderTransacoes === 'function') renderTransacoes(); if (typeof renderOrcamentos === 'function') renderOrcamentos(); } };
    window.excluirCategoria = (id) => { const cat = categories.find(c => c.id === id); if (!cat) return; if (transactions.some(t => t.categoria === cat.nome)) { if (!confirm(`Existem transações com "${cat.nome}". Mover para "Outros"?`)) return; const outros = categories.find(c => c.nome === 'Outros'); if (outros) transactions.forEach(t => { if (t.categoria === cat.nome) t.categoria = 'Outros'; }); } categories = categories.filter(c => c.id !== id); saveAllData(); renderCategorias(); };
    
    document.getElementById('perfilNome').value = profile.nome;
    document.getElementById('perfilEmail').value = profile.email;
    renderCategorias();
}

// ALERTAS
function checkBudgetAlerts() {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    budgets.forEach(b => { if (b.mes === currentMonth) { const spent = transactions.filter(t => t.tipo === 'despesa' && t.categoria === b.categoria && t.data.startsWith(currentMonth)).reduce((acc, t) => acc + t.valor, 0); const percent = (spent / b.limite) * 100; if (spent > b.limite) alert(`⚠️ ALERTA: Você ultrapassou o limite de ${b.categoria}!`); else if (percent >= 80) alert(`⚡ ATENÇÃO: Você atingiu ${percent.toFixed(0)}% do limite de ${b.categoria}`); } });
}

function checkRecurringAlerts() {
    const today = new Date();
    const currentDay = today.getDate();
    recurring.forEach(r => { if (r.dia === currentDay) alert(`💸 LEMBRETE: ${r.descricao} (${formatCurrency(r.valor)}) vence hoje!`); });
}

checkBudgetAlerts();
checkRecurringAlerts();
setInterval(checkBudgetAlerts, 60 * 60 * 1000);
setInterval(checkRecurringAlerts, 24 * 60 * 60 * 1000);