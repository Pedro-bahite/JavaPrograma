const API_BASE = '/programa';

async function request(endpoint, options = {}) {
    try {
        const response = await fetch(API_BASE + endpoint, options);

        if (!response.ok) {
            let errorMsg = 'Erro na comunicação com o servidor.';
            try {
                const errorData = await response.json();
                if (errorData.mensagem) {
                    errorMsg = errorData.mensagem;
                }
            } catch (e) {
                // Corpo do erro não é JSON válido ou está vazio
            }
            throw new Error(errorMsg);
        }

        // Operações POST, PUT e DELETE do backend retornam status 200 com corpo vazio
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Requisição cancelada');
            throw error;
        }
        console.error('API Error:', error);
        throw error;
    }
}

const api = {
    listar: async (signal) => {
        return await request('', { signal });
    },

    buscar: async (nome, signal) => {
        const url = `?nome=${encodeURIComponent(nome)}`;
        return await request(url, { signal });
    },

    buscarPorId: async (id) => {
        return await request(`/${encodeURIComponent(id)}`);
    },

    cadastrar: async (dados) => {
        return await request('', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
    },

    atualizar: async (id, dados) => {
        return await request(`?id=${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
    },

    excluir: async (nome) => {
        // Exclusão por nome exato na query string
        return await request(`?nome=${encodeURIComponent(nome)}`, {
            method: 'DELETE'
        });
    }
};