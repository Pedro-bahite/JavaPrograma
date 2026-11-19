// O evento DOMContentLoaded garante que o JS só vai executar depois que o HTML estiver totalmente carregado.
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // ESTADO DA APLICAÇÃO (Memória)
    // ==========================================
    let programas = []; // Guarda a lista de programas para filtrar e ordenar rápido na memória.
    let currentAborter = null; // Controla o cancelamento de requisições sobrepostas (busca rápida).
    let programaSelecionado = null; // Guarda o programa que está aberto no momento (para editar ou excluir).

    // ==========================================
    // MAPEAMENTO DO HTML (DOM Elements)
    // ==========================================
    const elements = {
        grid: document.getElementById('programGrid'),
        countProgramas: document.getElementById('countProgramas'),
        countEmissoras: document.getElementById('countEmissoras'),
        countCategorias: document.getElementById('countCategorias'),
        statusMessage: document.getElementById('statusMessage'),
        searchInput: document.getElementById('searchInput'),
        btnClearSearch: document.getElementById('btnClearSearch'),
        filterCategoria: document.getElementById('filterCategoria'),
        sortList: document.getElementById('sortList'),
        formModal: document.getElementById('formModal'),
        detailsModal: document.getElementById('detailsModal'),
        deleteModal: document.getElementById('deleteModal'),
        form: document.getElementById('programaForm'),
        modalTitle: document.getElementById('modalTitle'),
        formError: document.getElementById('formError'),
        btnSalvar: document.getElementById('btnSalvar'),
        btnNovoHeader: document.getElementById('btnNovoProgramaHeader'),
        navNovo: document.getElementById('navNovo'),
        navHome: document.getElementById('navHome'),
        btnEditDetail: document.getElementById('btnEditDetail'),
        btnDeleteDetail: document.getElementById('btnDeleteDetail'),
        btnConfirmDelete: document.getElementById('btnConfirmDelete')
    };

    // INICIALIZAÇÃO DA PÁGINA
    carregarProgramas(); // Busca os dados do backend assim que abre a tela
    setupEventListeners(); // Ativa os "escutadores" de botões e digitação

    // ==========================================
    // FUNÇÕES DE COMUNICAÇÃO
    // ==========================================

    async function carregarProgramas(termo = null) {
        showMessage('Carregando programas...', 'info');

        // PROTEÇÃO CONTRA RACE CONDITION (Condição de Corrida)
        // Se eu digitar "Jornal", ele pode disparar várias buscas. O AbortController
        // cancela a busca anterior e só deixa a mais recente terminar, evitando bugar a tela.
        if (currentAborter) currentAborter.abort();
        currentAborter = new AbortController();

        try {
            let result;
            if (termo) {
                // Se o termo de busca for um número (!isNaN), busca por ID. Se for texto, busca por nome.
                if (!isNaN(termo) && termo.trim() !== '') {
                    try {
                        const prog = await api.buscarPorId(termo);
                        result = prog ? [prog] : [];
                    } catch (e) { result = []; } // ID não encontrado
                } else {
                    result = await api.buscar(termo, currentAborter.signal);
                }
            } else {
                result = await api.listar(currentAborter.signal);
            }

            programas = result || []; // Atualiza a memória da tela com a resposta do Java
            atualizarFiltrosDOM(); // Atualiza a caixinha de categorias com base no que veio do banco
            renderizarTela(); // Desenha os programas na tela
            hideMessage();
        } catch (error) {
            if (error.name !== 'AbortError') {
                showMessage(`Erro: ${error.message} <button onclick="location.reload()">Tentar novamente</button>`, 'error');
                programas = [];
                renderizarTela();
            }
        }
    }

    // ==========================================
    // RENDERIZAÇÃO E FILTROS NA MEMÓRIA
    // ==========================================

    function renderizarTela() {
        const categoriaFiltro = elements.filterCategoria.value;
        const ordem = elements.sortList.value;

        // Cria uma cópia da lista de programas ([...programas]) para não modificar a lista original
        let exibidos = [...programas];

        // 1. FILTRA por categoria diretamente no navegador (muito mais rápido que pedir pro backend)
        if (categoriaFiltro) {
            exibidos = exibidos.filter(p => p.categoria === categoriaFiltro);
        }

        // 2. ORDENA a lista na tela
        exibidos.sort((a, b) => {
            // .localeCompare é essencial no Brasil, pois ele sabe que "Á" e "A" vêm juntos na ordem alfabética.
            if (ordem === 'nome_asc') return a.nome.localeCompare(b.nome);
            if (ordem === 'nome_desc') return b.nome.localeCompare(a.nome);
            if (ordem === 'id_asc') return a.id - b.id;
            if (ordem === 'id_desc') return b.id - a.id;
        });

        renderGrid(exibidos);
        atualizarDashboard();
    }

    function renderGrid(lista) {
        elements.grid.innerHTML = ''; // Limpa a tela

        if (lista.length === 0) {
            elements.grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 3rem;">Nenhum programa encontrado.</div>';
            return;
        }

        lista.forEach(prog => {
            // Cria os elementos no HTML
            const card = document.createElement('div');
            card.className = 'card';
            card.tabIndex = 0; // Permite focar com a tecla TAB (Acessibilidade)
            card.setAttribute('role', 'button');

            // Pega as 2 primeiras letras do nome para a "foto"
            const iniciais = prog.nome.substring(0, 2).toUpperCase();

            // Monta o "esqueleto" do cartão
            card.innerHTML = `
                <div class="card-icon">${iniciais}</div>
                <h4></h4>
                <p><strong>Emissora:</strong> <span></span></p>
                <p><strong>ID:</strong> ${prog.id}</p>
                <span class="tag"></span>
                <span class="tag"></span>
            `;

            // SEGURANÇA (PREVENÇÃO DE XSS):
            // Inserimos os dados usando .textContent e não .innerHTML.
            // Se alguém tentar cadastrar um programa chamado "<script>alert('vírus')</script>",
            // o .textContent vai imprimir como texto, enquanto o .innerHTML executaria o vírus.
            card.querySelector('h4').textContent = prog.nome;
            card.querySelector('p span').textContent = prog.emissora;
            const tags = card.querySelectorAll('.tag');
            tags[0].textContent = prog.categoria;
            tags[1].textContent = prog.class_indic;

            // Abre os detalhes ao clicar ou apertar Enter
            card.addEventListener('click', () => abrirDetalhes(prog.id));
            card.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') abrirDetalhes(prog.id);
            });

            elements.grid.appendChild(card); // Adiciona o cartão na tela
        });
    }

    function atualizarDashboard() {
        // Atualiza a quantidade de programas
        elements.countProgramas.textContent = programas.length;

        // "new Set()" é uma coleção que exclui valores repetidos automaticamente.
        // Assim, podemos contar facilmente quantas categorias e emissoras únicas existem na tela.
        const emissorasUnicas = new Set(programas.map(p => p.emissora)).size;
        const categoriasUnicas = new Set(programas.map(p => p.categoria)).size;

        elements.countEmissoras.textContent = emissorasUnicas;
        elements.countCategorias.textContent = categoriasUnicas;
    }

    function atualizarFiltrosDOM() {
        // Pega as categorias existentes, tira repetições, coloca em ordem e joga na caixa de filtro.
        const categoriasUnicas = [...new Set(programas.map(p => p.categoria))].sort();
        const atual = elements.filterCategoria.value;

        let options = '<option value="">Todas as Categorias</option>';
        categoriasUnicas.forEach(cat => {
            options += `<option value="${cat}">${cat}</option>`;
        });

        elements.filterCategoria.innerHTML = options;
        elements.filterCategoria.value = atual || "";
    }

    // ==========================================
    // AÇÕES DE BOTÕES E FORMULÁRIO (CRUD)
    // ==========================================

    async function abrirDetalhes(id) {
        try {
            showMessage('Consultando dados...', 'info');
            // Busca no backend para garantir que pegamos os dados mais atualizados do programa clicado
            const prog = await api.buscarPorId(id);
            programaSelecionado = prog; // Guarda na memória

            // Monta a tela de detalhes e preenche com textContent para segurança XSS
            const body = document.getElementById('detailsBody');
            body.innerHTML = `
                <div class="details-grid">
                    <div class="details-row"><span class="details-label">ID</span><span class="details-value">${prog.id}</span></div>
                    <div class="details-row"><span class="details-label">Nome</span><span class="details-value" id="detNome"></span></div>
                    <div class="details-row"><span class="details-label">Emissora</span><span class="details-value" id="detEmis"></span></div>
                    <div class="details-row"><span class="details-label">Categoria</span><span class="details-value" id="detCat"></span></div>
                    <div class="details-row"><span class="details-label">Classificação</span><span class="details-value" id="detClass"></span></div>
                </div>
            `;

            document.getElementById('detNome').textContent = prog.nome;
            document.getElementById('detEmis').textContent = prog.emissora;
            document.getElementById('detCat').textContent = prog.categoria;
            document.getElementById('detClass').textContent = prog.class_indic;

            hideMessage();
            openModal(elements.detailsModal); // Abre o pop-up
        } catch (error) {
            showMessage(`Erro ao buscar detalhes: ${error.message}`, 'error');
        }
    }

    async function salvarPrograma(e) {
        // Impede a tela de piscar/recarregar ao enviar o formulário (Comportamento padrão HTML)
        e.preventDefault();
        elements.formError.classList.add('hidden');

        const id = document.getElementById('programaId').value;
        const dados = {
            nome: document.getElementById('nome').value.trim(),
            categoria: document.getElementById('categoria').value.trim(),
            emissora: document.getElementById('emissora').value.trim(),
            class_indic: document.getElementById('class_indic').value.trim() // Escrito igual ao Json do Java
        };

        if (!dados.nome || !dados.categoria || !dados.emissora || !dados.class_indic) {
            mostrarErroForm('Preencha todos os campos obrigatórios.');
            return;
        }

        // UX (Experiência do Usuário): Bloqueia o botão enquanto salva para evitar que a pessoa clique 2 vezes
        elements.btnSalvar.disabled = true;
        elements.btnSalvar.textContent = 'Salvando...';

        try {
            if (id) {
                // Se existir ID, é edição (PUT)
                await api.atualizar(id, dados);
                showMessage('Programa atualizado com sucesso!', 'success');
            } else {
                // Se não existir, é cadastro (POST)
                await api.cadastrar(dados);
                showMessage('Programa cadastrado com sucesso!', 'success');
            }
            closeModal(elements.formModal); // Fecha modal
            carregarProgramas(elements.searchInput.value); // Recarrega a tabela mantendo o que estava sendo pesquisado
        } catch (error) {
            // Se o backend disser "Esse nome já existe", ele cai aqui e exibe abaixo do formulário
            mostrarErroForm(error.message);
        } finally {
            // Libera o botão novamente, dando erro ou não.
            elements.btnSalvar.disabled = false;
            elements.btnSalvar.textContent = 'Salvar';
        }
    }

    async function confirmarExclusao() {
        if (!programaSelecionado) return;

        const btn = elements.btnConfirmDelete;
        const errorDiv = document.getElementById('deleteError');

        // Desabilita duplo clique
        btn.disabled = true;
        btn.textContent = 'Excluindo...';
        errorDiv.classList.add('hidden');

        try {
            // IMPORTANTE: Envia o NOME exato do programa para exclusão, obedecendo ao Controller
            await api.excluir(programaSelecionado.nome);
            showMessage('Programa excluído com sucesso.', 'success');
            closeModal(elements.deleteModal);
            closeModal(elements.detailsModal);
            programaSelecionado = null; // Limpa a memória
            carregarProgramas(elements.searchInput.value);
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Sim, Excluir';
        }
    }

    // ==========================================
    // FUNÇÕES DE APOIO E EVENT LISTENERS
    // ==========================================

    function setupEventListeners() {
        // TÉCNICA DE DEBOUNCE NA BUSCA
        // Se eu digitar a letra "A", ele espera 400 milissegundos para ir no backend.
        // Se eu digitar "AB" bem rápido, ele cancela a primeira e dispara com "AB".
        // Isso poupa processamento e consumo de banco de dados.
        let typingTimer;
        elements.searchInput.addEventListener('input', () => {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => carregarProgramas(elements.searchInput.value), 400);
        });

        elements.btnClearSearch.addEventListener('click', () => {
            elements.searchInput.value = '';
            carregarProgramas();
        });

        // Quando trocar o select de filtros, reorganiza a tela imediatamente (client-side)
        elements.filterCategoria.addEventListener('change', renderizarTela);
        elements.sortList.addEventListener('change', renderizarTela);

        // Vínculos de botões com as funções
        elements.form.addEventListener('submit', salvarPrograma);
        elements.btnNovoHeader.addEventListener('click', () => abrirFormulario());
        elements.navNovo.addEventListener('click', () => abrirFormulario());
        elements.navHome.addEventListener('click', () => {
            elements.searchInput.value = '';
            carregarProgramas();
        });

        // Clique em Editar nos detalhes
        elements.btnEditDetail.addEventListener('click', () => {
            if (programaSelecionado) {
                closeModal(elements.detailsModal);
                abrirFormulario(programaSelecionado); // Envia os dados atuais para preencher o form
            }
        });

        // Clique em Excluir nos detalhes (Apenas abre a tela de confirmação)
        elements.btnDeleteDetail.addEventListener('click', () => {
            if (programaSelecionado) {
                document.getElementById('deleteProgramName').textContent = programaSelecionado.nome;
                openModal(elements.deleteModal);
            }
        });

        // Clique no "Sim, Excluir" do modal
        elements.btnConfirmDelete.addEventListener('click', confirmarExclusao);

        // Fechar qualquer modal ao clicar nos botões de "X" ou "Cancelar"
        document.querySelectorAll('.btn-close, .btn-cancelar, .btn-cancel-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) closeModal(modal);
            });
        });
    }

    // Trata caso um registro antigo no banco tenha uma categoria/classificação diferente
    // das pré-definidas no <select>. Se não achar a opção, cria na hora para não vir em branco.
    function selecionarValorNoSelect(selectElement, valor) {
        const existeOpcao = Array.from(selectElement.options).some(opt => opt.value === valor);
        if (!existeOpcao && valor) {
            const optLegada = document.createElement('option');
            optLegada.value = valor;
            optLegada.textContent = valor;
            selectElement.appendChild(optLegada);
        }
        selectElement.value = valor;
    }

    function abrirFormulario(prog = null) {
        elements.form.reset(); // Zera o formulário sempre que abrir
        elements.formError.classList.add('hidden');

        const selectCategoria = document.getElementById('categoria');
        const selectClassIndic = document.getElementById('class_indic');

        if (prog) {
            // Se for EDIÇÃO, preenche os inputs com os dados carregados
            elements.modalTitle.textContent = 'Editar Programa';
            document.getElementById('programaId').value = prog.id; // Guarda num <input type="hidden">
            document.getElementById('nome').value = prog.nome;
            document.getElementById('emissora').value = prog.emissora;
            selecionarValorNoSelect(selectCategoria, prog.categoria);
            selecionarValorNoSelect(selectClassIndic, prog.class_indic);
        } else {
            // Se for NOVO CADASTRO, limpa tudo
            elements.modalTitle.textContent = 'Novo Programa';
            document.getElementById('programaId').value = '';
            selectCategoria.value = '';
            selectClassIndic.value = '';
        }

        openModal(elements.formModal);
    }

    // Auxiliares de exibição e ocultação
    function openModal(modal) {
        modal.classList.remove('hidden');
    }

    function closeModal(modal) {
        modal.classList.add('hidden');
    }

    function showMessage(msg, type = 'info') {
        elements.statusMessage.innerHTML = msg;
        elements.statusMessage.className = `status-message status-${type}`;
        // Se for sucesso, o banner verde some sozinho em 3 segundos.
        if (type === 'success') {
            setTimeout(hideMessage, 3000);
        }
    }

    function hideMessage() {
        elements.statusMessage.className = 'status-message hidden';
        elements.statusMessage.innerHTML = '';
    }

    function mostrarErroForm(msg) {
        elements.formError.textContent = msg;
        elements.formError.classList.remove('hidden');
    }
});