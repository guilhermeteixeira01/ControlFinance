const CAT_COLORS = {
  'Alimentação': '#378ADD',
  'Transporte': '#D85A30',
  'Moradia': '#1D9E75',
  'Contas': '#7F77DD',
  'Lazer': '#EF9F27',
  'Saúde': '#D4537E',
  'Outros': '#888780'
};

const CATEGORIAS = ['Alimentação','Transporte','Moradia','Contas','Lazer','Saúde','Outros'];

let orcamento = 1400;
let gastos = [];
let chart = null;

function fmt(v) {
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function carregar() {
  try {
    const res = await fetch('/api/dados');
    const data = await res.json();
    orcamento = data.orcamento || 1400;
    gastos = data.gastos || [];
  } catch (e) {
    console.error('Erro ao carregar dados:', e);
  }
  document.getElementById('orc-input').value = orcamento;
  initChart();
  renderizar();
}

async function salvar() {
  try {
    await fetch('/api/dados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orcamento, gastos }, null, 2)
    });
  } catch (e) {
    console.error('Erro ao salvar dados:', e);
  }
}

function initChart() {
  const ctx = document.getElementById('grafico');
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{ data: [], backgroundColor: [], borderRadius: 4, borderSkipped: false }]
    },
    options: {
      responsive: true,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ' ' + fmt(ctx.raw) } }
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,212,255,0.06)' },
          ticks: { color: '#8888aa', font: { size: 11 }, callback: v => 'R$ ' + v.toLocaleString('pt-BR') }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#8888aa', font: { size: 12 } }
        }
      }
    }
  });
}

function salvarOrcamento() {
  orcamento = parseFloat(document.getElementById('orc-input').value) || 0;
  salvar();
  renderizar();
}

// Calcula o total automaticamente quando usuário digita parcelas no form
function calcularTotal() {
  const qtd = parseInt(document.getElementById('qtd-parcelas').value) || 0;
  const val = parseFloat(document.getElementById('valor-parcela').value) || 0;
  const total = qtd * val;
  const preview = document.getElementById('total-preview');
  if (qtd > 0 && val > 0) {
    preview.textContent = `= ${fmt(total)} total`;
    preview.style.display = 'inline';
  } else {
    preview.style.display = 'none';
  }
}

function renderizar() {
  const totalPago = gastos.reduce((s, g) => s + (g.pago || 0), 0);
  const saldo = orcamento - totalPago;

  document.getElementById('orc-display').textContent = fmt(orcamento);
  document.getElementById('total-gasto').textContent = fmt(totalPago);
  document.getElementById('saldo').textContent = fmt(saldo);

  const sc = document.getElementById('saldo-card');
  if (saldo < 0) sc.classList.add('negativo'); else sc.classList.remove('negativo');

  const lista = document.getElementById('lista-gastos');
  if (gastos.length === 0) {
    lista.innerHTML = '<div class="empty-state"><i class="ti ti-receipt-off"></i><br>Nenhum gasto registrado ainda</div>';
  } else {
    lista.innerHTML = gastos.map((g, i) => {
      const pago        = g.pago || 0;
      const qtdTotal    = g.qtdParcelas || 1;         // total de parcelas
      const valParcela  = g.valorParcela || g.valor;  // valor de cada parcela
      const total       = qtdTotal * valParcela;       // valor total real
      const parcelaPaga = valParcela > 0 ? Math.floor(pago / valParcela) : 0;
      const falta       = Math.max(0, total - pago);
      const parcelasRestantes = qtdTotal - parcelaPaga;
      const pct         = total > 0 ? Math.min(100, (pago / total) * 100) : 0;
      const quitado     = falta < 0.01 && total > 0;
      const cor         = CAT_COLORS[g.cat] || '#888';

      const catOptions = CATEGORIAS.map(c =>
        `<option value="${c}" ${c === g.cat ? 'selected' : ''}>${c}</option>`
      ).join('');

      // Label de parcelas: "2 / 5x de R$ 250"
      const labelParcela = qtdTotal > 1
        ? `<span class="item-parcela-badge" style="color:${cor}">${parcelaPaga}/${qtdTotal}x de ${fmt(valParcela)}</span>`
        : '';

      // Botão pagar próxima parcela
      const btnParcela = !quitado
        ? `<button class="btn-parcela" onclick="pagarParcela(${i})">
             <i class="ti ti-cash"></i> Pagar parcela ${parcelaPaga + 1}/${qtdTotal}
           </button>`
        : '';

      return `
      <div class="item-gasto ${quitado ? 'item-quitado' : ''}">
        <div class="cat-dot" style="background:${cor};box-shadow:0 0 6px ${cor}"></div>

        <div class="item-main">
          <div class="item-row1">
            <input class="item-desc" type="text" value="${g.nome}" title="Editar descrição"
              onchange="editarNome(${i}, this.value)" />
            <select class="item-cat-select" onchange="editarCat(${i}, this.value)"
              style="border-color:${cor}22;color:${cor}">
              ${catOptions}
            </select>
            ${labelParcela}
          </div>

          <div class="item-row2">
            <div class="progress-wrap">
              <div class="progress-bar" style="width:${pct.toFixed(1)}%;background:${cor}"></div>
            </div>
            <span class="item-pct" style="color:${cor}">${pct.toFixed(0)}%</span>
          </div>

          <div class="item-row3">
            ${btnParcela}
          </div>
        </div>

        <div class="item-nums">
          <div class="item-num-row">
            <span class="item-num-label">Parcelas</span>
            <div class="item-parcela-edit">
              <input class="item-qtd-input" type="number" value="${qtdTotal}" min="1" step="1"
                title="Quantidade de parcelas" onchange="editarQtdParcelas(${i}, this.value)" />
              <span class="item-x">x</span>
              <input class="item-val-parcela-input" type="number" value="${valParcela.toFixed(2)}" min="0" step="0.01"
                title="Valor de cada parcela" onchange="editarValorParcela(${i}, this.value)" />
            </div>
          </div>
          <div class="item-num-row">
            <span class="item-num-label">Total</span>
            <span class="item-total-calc">${fmt(total)}</span>
          </div>
          <div class="item-num-row">
            <span class="item-num-label">Pago</span>
            <span class="item-pago-display">${fmt(pago)}</span>
          </div>
          <div class="item-num-row">
            <span class="item-num-label">Falta</span>
            <span class="item-falta ${quitado ? 'quitado' : ''}">${quitado ? '✓ Pago' : fmt(falta)}</span>
          </div>
        </div>

        <div class="item-actions">
          <button class="btn-icon btn-reset" onclick="zerarGasto(${i})" title="Zerar para novo mês">
            <i class="ti ti-refresh"></i>
          </button>
          <button class="btn-icon" onclick="remover(${i})" title="Remover">
            <i class="ti ti-trash"></i>
          </button>
        </div>
      </div>`;
    }).join('');
  }

  const porCat = {};
  gastos.forEach(g => {
    const total = (g.qtdParcelas || 1) * (g.valorParcela || g.valor);
    porCat[g.cat] = (porCat[g.cat] || 0) + total;
  });
  const cats = Object.keys(porCat).sort((a, b) => porCat[b] - porCat[a]);

  if (chart) {
    chart.data.labels = cats;
    chart.data.datasets[0].data = cats.map(c => porCat[c]);
    chart.data.datasets[0].backgroundColor = cats.map(c => CAT_COLORS[c] || '#888');
    chart.update();
  }
}

function adicionarGasto() {
  const nome       = document.getElementById('nome-gasto').value.trim();
  const qtd        = parseInt(document.getElementById('qtd-parcelas').value) || 1;
  const valParcela = parseFloat(document.getElementById('valor-parcela').value);
  const cat        = document.getElementById('cat-gasto').value;

  if (!nome || isNaN(valParcela) || valParcela <= 0) return;

  gastos.push({
    id: Date.now(),
    nome,
    valor: valParcela,           // mantém compat: valor = valor da parcela
    qtdParcelas: qtd,
    valorParcela: valParcela,
    pago: 0,
    cat
  });

  document.getElementById('nome-gasto').value = '';
  document.getElementById('qtd-parcelas').value = '1';
  document.getElementById('valor-parcela').value = '';
  document.getElementById('total-preview').style.display = 'none';
  salvar(); renderizar();
}

// Paga a próxima parcela
function pagarParcela(i) {
  const g = gastos[i];
  const valParcela = g.valorParcela || g.valor;
  const total = (g.qtdParcelas || 1) * valParcela;
  const falta = Math.max(0, total - (g.pago || 0));
  if (falta <= 0) return;
  g.pago = (g.pago || 0) + Math.min(valParcela, falta);
  salvar(); renderizar();
}

function remover(i)                { gastos.splice(i, 1); salvar(); renderizar(); }

function zerarGasto(i) {
  if (!confirm(`Zerar pagamento de "${gastos[i].nome}" para o novo mês?`)) return;
  gastos[i].pago = 0;
  salvar(); renderizar();
}

function zerarTodos() {
  if (!confirm('Zerar o pagamento de TODOS os gastos para o novo mês?')) return;
  gastos.forEach(g => g.pago = 0);
  salvar(); renderizar();
}
function editarNome(i, v)          { gastos[i].nome = v; salvar(); }
function editarCat(i, v)           { gastos[i].cat = v; salvar(); renderizar(); }
function editarQtdParcelas(i, v)   { gastos[i].qtdParcelas = parseInt(v) || 1; salvar(); renderizar(); }
function editarValorParcela(i, v)  {
  const val = parseFloat(v) || 0;
  gastos[i].valorParcela = val;
  gastos[i].valor = val;
  salvar(); renderizar();
}

document.addEventListener('DOMContentLoaded', () => {
  carregar();
  document.getElementById('valor-parcela').addEventListener('keydown', e => { if (e.key === 'Enter') adicionarGasto(); });
  document.getElementById('nome-gasto').addEventListener('keydown',   e => { if (e.key === 'Enter') document.getElementById('qtd-parcelas').focus(); });
  document.getElementById('qtd-parcelas').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('valor-parcela').focus(); });
});

// ── Update Box ──────────────────────────────────────────────
function fmtBytes(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB/s';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB/s';
}

function showUpdateBox() {
  document.getElementById('update-box').classList.add('visible');
}

function instalarUpdate() {
  if (window.updater) window.updater.installUpdate();
}

if (window.updater) {
  window.updater.onUpdateAvailable((data) => {
    document.getElementById('update-title').textContent = `Nova versão ${data.version}`;
    document.getElementById('update-subtitle').textContent = 'Baixando em background...';
    showUpdateBox();
  });

  window.updater.onUpdateProgress((data) => {
    const bar   = document.getElementById('update-bar');
    const pct   = document.getElementById('update-pct');
    const speed = document.getElementById('update-speed');

    showUpdateBox();
    bar.style.width = data.percent + '%';
    pct.textContent = data.percent + '%';
    speed.textContent = fmtBytes(data.bytesPerSecond);
    document.getElementById('update-subtitle').textContent = 'Baixando atualização...';
  });

  window.updater.onUpdateDownloaded((data) => {
    const bar     = document.getElementById('update-bar');
    const pct     = document.getElementById('update-pct');
    const speed   = document.getElementById('update-speed');
    const restart = document.getElementById('btn-restart');
    const wrap    = document.getElementById('update-progress-wrap');

    bar.style.width = '100%';
    bar.classList.add('done');
    pct.textContent = '100%';
    speed.textContent = '';
    document.getElementById('update-title').textContent = `Versão ${data.version} pronta`;
    document.getElementById('update-subtitle').textContent = 'Download concluído ✓';

    setTimeout(() => {
      wrap.style.display = 'none';
      restart.classList.add('visible');
    }, 600);

    showUpdateBox();
  });

  window.updater.onUpdateError((data) => {
    const errEl = document.getElementById('update-error-msg');
    errEl.textContent = 'Erro: ' + data.message;
    errEl.style.display = 'block';
    document.getElementById('update-progress-wrap').style.display = 'none';
    showUpdateBox();
  });
}
