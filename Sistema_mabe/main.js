// =============================================================
// === PASSO 1: SUBSTITUA AS CREDENCIAIS DO SEU PROJETO AQUI ===
// =============================================================
const SUPABASE_URL = 'https://wihlkmmtevkuyvssbtwg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpaGxrbW10ZXZrdXl2c3NidHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MjExMjgsImV4cCI6MjA3MDQ5NzEyOH0.SKD94txUo2e10gyAODn3QmHJH1QyI-t4HDqR3ZyhnHQ';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =============================================================
// === REFERÊNCIAS DOS ELEMENTOS DO DOM ===
// =============================================================
const sidebar = document.querySelector('.sidebar');
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');

const formSection = document.getElementById('form-section');
const listSection = document.getElementById('list-section');
const numeroPastaInput = document.getElementById('numero-pasta');
const nomeAlunoInput = document.getElementById('nome-aluno');
const btnSalvar = document.getElementById('btn-salvar');
const listaRegistrosBody = document.getElementById('lista-registros');
const loadingStatus = document.getElementById('loading-status');
const buscaAlunoInput = document.getElementById('busca-aluno');
const clearSearchBtn = document.getElementById('clear-search-btn');
const btnLogout = document.getElementById('btn-logout');
const btnGerarRelatorio = document.getElementById('btn-relatorio-excel');

const linkList = document.getElementById('link-list');
const linkForm = document.getElementById('link-form');

let registroEmEdicaoId = null;

// =============================================================
// === FUNÇÕES DE VISUALIZAÇÃO ===
// =============================================================
function showFormSection() {
    formSection.style.display = 'block';
    listSection.style.display = 'none';
    linkList.classList.remove('active');
    linkForm.classList.add('active');
    numeroPastaInput.value = '';
    nomeAlunoInput.value = '';
    btnSalvar.textContent = 'Salvar Registro';
    registroEmEdicaoId = null;
}

function showListSection() {
    formSection.style.display = 'none';
    listSection.style.display = 'block';
    linkForm.classList.remove('active');
    linkList.classList.add('active');
    carregarRegistros();
}

// =============================================================
// === FUNÇÕES DE CRUD ===
// =============================================================

async function carregarRegistros(termoBusca = '') {
    loadingStatus.style.display = 'block';
    listaRegistrosBody.innerHTML = '';
    
    let query = supabase.from('arquivo_morto').select('*');

    if (termoBusca) {
        query = query.or(`nome_completo.ilike.%${termoBusca.toLowerCase()}%,numero_pasta.ilike.%${termoBusca}%`);
    }

    const { data, error } = await query.order('numero_pasta', { ascending: true });

    if (error) {
        console.error('Erro ao carregar registros:', error);
        Swal.fire('Erro!', 'Não foi possível carregar os registros. Verifique as permissões de RLS no Supabase.', 'error');
        loadingStatus.textContent = 'Erro ao carregar dados.';
        return;
    }
    
    loadingStatus.style.display = 'none';
    if (data.length === 0) {
        listaRegistrosBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Nenhum registro encontrado.</td></tr>';
    } else {
        renderizarRegistros(data);
    }
}

function renderizarRegistros(registros) {
    listaRegistrosBody.innerHTML = '';
    registros.forEach(registro => {
        const tr = document.createElement('tr');
        if (registroEmEdicaoId === registro.id) {
            tr.innerHTML = `
                <td><input type="text" id="edit-numero-pasta" value="${registro.numero_pasta}"></td>
                <td><input type="text" id="edit-nome-aluno" value="${registro.nome_completo}"></td>
                <td class="acoes-btn">
                    <button class="btn-salvar-edicao">Salvar</button>
                    <button class="btn-cancelar-edicao">Cancelar</button>
                </td>
            `;
            tr.querySelector('.btn-salvar-edicao').addEventListener('click', () => salvarEdicao(registro.id));
            tr.querySelector('.btn-cancelar-edicao').addEventListener('click', () => cancelarEdicao());
        } else {
            tr.innerHTML = `
                <td>${registro.numero_pasta}</td>
                <td>${registro.nome_completo}</td>
                <td class="acoes-btn">
                    <button class="btn-editar">Editar</button>
                    <button class="btn-excluir">Excluir</button>
                </td>
            `;
            tr.querySelector('.btn-editar').addEventListener('click', () => iniciarEdicao(registro));
            tr.querySelector('.btn-excluir').addEventListener('click', () => excluirRegistro(registro.id));
        }
        listaRegistrosBody.appendChild(tr);
    });
}

async function salvarRegistro() {
    const numeroPasta = numeroPastaInput.value.trim();
    const nomeAluno = nomeAlunoInput.value.trim();

    if (!numeroPasta || !nomeAluno) {
        Swal.fire('Atenção!', 'Por favor, preencha todos os campos.', 'warning');
        return;
    }

    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    const { data, error } = await supabase
        .from('arquivo_morto')
        .insert([{ numero_pasta: numeroPasta, nome_completo: nomeAluno }]);

    if (error) {
        console.error('Erro ao salvar registro:', error);
        Swal.fire('Erro!', 'Não foi possível salvar o registro. ' + error.message, 'error');
    } else {
        Swal.fire('Sucesso!', 'Registro salvo com sucesso!', 'success');
        showFormSection(); 
    }

    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Salvar Registro';
}

function iniciarEdicao(registro) {
    registroEmEdicaoId = registro.id;
    carregarRegistros();
}

async function salvarEdicao(id) {
    const numeroPastaEditado = document.getElementById('edit-numero-pasta').value.trim();
    const nomeAlunoEditado = document.getElementById('edit-nome-aluno').value.trim();

    if (!numeroPastaEditado || !nomeAlunoEditado) {
        Swal.fire('Atenção!', 'Por favor, preencha todos os campos para editar.', 'warning');
        return;
    }

    const { error } = await supabase
        .from('arquivo_morto')
        .update({ numero_pasta: numeroPastaEditado, nome_completo: nomeAlunoEditado })
        .eq('id', id);
    
    if (error) {
        console.error('Erro ao editar registro:', error);
        Swal.fire('Erro!', 'Não foi possível editar o registro.', 'error');
    } else {
        Swal.fire('Sucesso!', 'Registro atualizado com sucesso!', 'success');
        registroEmEdicaoId = null;
        carregarRegistros();
    }
}

function cancelarEdicao() {
    registroEmEdicaoId = null;
    carregarRegistros();
}

async function excluirRegistro(id) {
    const { isConfirmed } = await Swal.fire({
        title: 'Tem certeza?',
        text: "Esta ação não pode ser desfeita!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e53935',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar'
    });

    if (isConfirmed) {
        const { error } = await supabase
            .from('arquivo_morto')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao excluir registro:', error);
            Swal.fire('Erro!', 'Não foi possível excluir o registro.', 'error');
        } else {
            Swal.fire('Excluído!', 'O registro foi removido.', 'success');
            carregarRegistros();
        }
    }
}

// FUNÇÃO ATUALIZADA: Gerar e baixar o relatório em formato CSV (Excel)
// FUNÇÃO ATUALIZADA: Gerar e baixar o relatório em formato CSV (Excel)
async function gerarRelatorioExcel() {
    Swal.fire({
        title: 'Gerando Relatório...',
        text: 'Isso pode levar alguns segundos.',
        didOpen: () => {
            Swal.showLoading();
        },
        allowOutsideClick: false,
    });

    try {
        const { data, error } = await supabase.from('arquivo_morto').select('*');

        if (error) {
            console.error('Erro ao buscar dados para o relatório:', error);
            throw new Error('Não foi possível buscar os dados. Verifique a conexão e as permissões de RLS no Supabase.');
        }

        if (data.length === 0) {
            Swal.fire('Aviso!', 'Nenhum registro encontrado para gerar o relatório.', 'warning');
            return;
        }

        // Adiciona o BOM (Byte Order Mark) para garantir que o Excel reconheça o UTF-8
        const BOM = "\uFEFF"; 
        // O cabeçalho foi ajustado para ter apenas 'Numero_da_Pasta' e 'Nome_Completo'
        const header = ['Numero_da_Pasta', 'Nome_Completo'].join(';') + '\n';
        const rows = data.map(registro => {
            // As linhas também foram ajustadas para não incluir o ID
            return [
                `"${registro.numero_pasta}"`,
                `"${registro.nome_completo}"`
            ].join(';');
        }).join('\n');

        const csvContent = BOM + header + rows;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'relatorio_arquivo_morto.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        Swal.fire('Sucesso!', 'O relatório foi gerado e o download deve começar.', 'success');

    } catch (e) {
        console.error('Ocorreu um erro inesperado:', e);
        Swal.fire('Erro!', `Ocorreu um erro ao gerar o relatório: ${e.message}`, 'error');
    } finally {
        Swal.close();
    }
}

// =============================================================
// === EVENT LISTENERS ===
// =============================================================
btnToggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});
btnSalvar.addEventListener('click', salvarRegistro);
buscaAlunoInput.addEventListener('input', (e) => {
    const termoBusca = e.target.value.trim();
    carregarRegistros(termoBusca);
    clearSearchBtn.style.display = termoBusca ? 'block' : 'none';
});
clearSearchBtn.addEventListener('click', () => {
    buscaAlunoInput.value = '';
    clearSearchBtn.style.display = 'none';
    carregarRegistros();
});
linkForm.addEventListener('click', (e) => {
    e.preventDefault();
    showFormSection();
});
linkList.addEventListener('click', (e) => {
    e.preventDefault();
    showListSection();
});
btnLogout.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Erro ao fazer logout:', error);
        Swal.fire('Erro!', 'Não foi possível sair da sua conta.', 'error');
    } else {
        window.location.href = 'login.html';
    }
});
btnGerarRelatorio.addEventListener('click', gerarRelatorioExcel);


// =============================================================
// === INICIALIZAÇÃO DA APLICAÇÃO ===
// =============================================================
async function verificarSessao() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
    } else {
        showListSection();
    }
}

document.addEventListener('DOMContentLoaded', verificarSessao);