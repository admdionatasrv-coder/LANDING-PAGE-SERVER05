
// 1. Simulador de Combustível
function calculateFuel() {
    const price = parseFloat(document.getElementById('fuelPrice').value) || 0;
    const qty = parseFloat(document.getElementById('fuelQty').value) || 0;
    const total = price * qty;
    document.getElementById('fuelTotal').innerText = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// 2. Calculadora Integrada
let calcStr = "";
function calcInput(val) {
    if(val === 'C') {
        calcStr = "";
    } else if(val === '=') {
        try {
            // Evaluates math express, replaces visual x to math *
            let toEval = calcStr.replace(/X/g, '*');
            calcStr = eval(toEval).toString();
        } catch(e) {
            calcStr = "Erro";
        }
    } else {
        if(calcStr === "Erro") calcStr = "";
        calcStr += val;
    }
    document.getElementById('calcDisplay').innerText = calcStr || "0";
}

// 3. Gestão de Cheques por Turno
let checks = { 'Manhã': [], 'Tarde': [], 'Noite': [] };

function addCheck() {
    const shift = document.getElementById('shiftSelect').value;
    const valInput = document.getElementById('checkValue').value.replace(',', '.');
    const val = parseFloat(valInput);
    
    if(!val || val <= 0) return alert("Insira um valor válido para o cheque.");
    
    checks[shift].push(val);
    document.getElementById('checkValue').value = '';
    renderChecks();
}

function renderChecks() {
    let generalTotal = 0;
    const container = document.getElementById('shiftTotals');
    container.innerHTML = '';

    const colors = {
        'Manhã': 'text-blue-400',
        'Tarde': 'text-yellow-400',
        'Noite': 'text-purple-400'
    };

    for(const shift in checks) {
        const shiftTotal = checks[shift].reduce((acc, curr) => acc + curr, 0);
        generalTotal += shiftTotal;

        const div = document.createElement('div');
        div.className = 'bg-gray-900 border border-gray-700 p-5 rounded-lg shadow-inner';
        div.innerHTML = `
            <h3 class="font-bold text-xl ${colors[shift]} border-b border-gray-700 pb-3 mb-3 flex items-center justify-between">
                <span>Turno: ${shift}</span>
                <span class="text-sm bg-gray-800 px-2 py-1 rounded text-gray-300">${checks[shift].length} cheques</span>
            </h3>
            <div class="h-24 overflow-y-auto mb-3 pr-2 space-y-1 text-sm text-gray-400">
                ${checks[shift].length === 0 ? '<i>Nenhum lançamento</i>' : checks[shift].map((v, i) => `<div>${i+1}º - ${v.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</div>`).join('')}
            </div>
            <p class="text-lg border-t border-gray-700 pt-3">Subtotal: <strong class="text-white">${shiftTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>
        `;
        container.appendChild(div);
    }
    document.getElementById('totalAllChecks').innerText = generalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
renderChecks(); // init render

// 4. Orçamento e Estoque (Importação/Exportação)
let budgetItems = [];

function addItem() {
    const name = document.getElementById('itemName').value;
    const qty = parseFloat(document.getElementById('itemQty').value);
    const priceInput = document.getElementById('itemPrice').value.replace(',', '.');
    const price = parseFloat(priceInput);

    if(!name || !qty || !price) return alert("Preencha todos os campos do produto corretamente.");

    budgetItems.push({ name, qty, price, total: qty * price });
    
    document.getElementById('itemName').value = '';
    document.getElementById('itemQty').value = '';
    document.getElementById('itemPrice').value = '';
    
    renderBudget();
}

function removeBudgetItem(index) {
    budgetItems.splice(index, 1);
    renderBudget();
}

function renderBudget() {
    const tbody = document.getElementById('budgetTable');
    tbody.innerHTML = '';
    let totalBudget = 0;
    
    if(budgetItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500">Nenhum item no orçamento. Adicione ou importe uma lista.</td></tr>`;
        document.getElementById('budgetTotal').innerText = "R$ 0,00";
        return;
    }

    budgetItems.forEach((item, index) => {
        totalBudget += item.total;
        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-700 hover:bg-gray-800 transition';
        tr.innerHTML = `
            <td class="p-4 text-gray-200">${item.name}</td>
            <td class="p-4 text-gray-300">${item.qty}</td>
            <td class="p-4 text-gray-300">${item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td class="p-4 font-bold text-white">${item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td class="p-4 text-center">
                <button onclick="removeBudgetItem(${index})" class="text-red-500 hover:text-red-400 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition">
                    <i class="fas fa-trash-alt"></i> Excluir
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('budgetTotal').innerText = totalBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function importData(event) {
    const file = event.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split('\n');
        
        let importedCount = 0;
        
        // Assume format: Produto,Quantidade,Preco
        rows.forEach((row, index) => {
            if(index === 0 && (row.toLowerCase().includes('produto') || row.toLowerCase().includes('descrição'))) return; // skip header
            
            const cols = row.split(/[,;]/);
            if(cols.length >= 3) {
                const name = cols[0].trim();
                const qtyStr = cols[1].trim().replace(',', '.');
                const priceStr = cols[2].trim().replace('R$', '').replace(' ', '').replace(',', '.');
                
                const qty = parseFloat(qtyStr);
                const price = parseFloat(priceStr);
                
                if(name && !isNaN(qty) && !isNaN(price)) {
                    budgetItems.push({ name, qty, price, total: qty * price });
                    importedCount++;
                }
            }
        });
        renderBudget();
        alert(`${importedCount} produtos importados com sucesso!`);
        
        // Reset file input
        event.target.value = '';
    };
    reader.readAsText(file);
}

function exportData() {
    if(budgetItems.length === 0) return alert("O orçamento está vazio. Não há dados para exportar.");
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Produto,Quantidade,Preco_Unitario,Subtotal\n";
    
    budgetItems.forEach(item => {
        // Enclosing name in quotes to prevent issue with commas in product names
        const row = `"${item.name}",${item.qty},${item.price},${item.total}`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "orcamento_posto_exportado.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
