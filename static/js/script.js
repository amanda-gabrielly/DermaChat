const formulario = document.getElementById("chat-form");
const campoMensagem = document.getElementById("mensagem");
const botaoEnviar = document.getElementById("enviar");
const areaChat = document.getElementById("chat-area");
const botaoNovoChat = document.getElementById("novo-chat");
const listaConversas = document.getElementById("lista-conversas");

let conversaAtualId = null;

const telaInicial = `
    <div class="welcome" id="welcome">
        <div class="welcome-icon">🌱</div>
        <span class="eyebrow">BEM-VINDA AO DERMACHAT</span>
        <h3>Uma rotina de cuidados começa com conhecimento.</h3>
        <p>
            Tire suas dúvidas sobre ingredientes, produtos
            e cuidados básicos com a pele.
        </p>

        <div class="suggestions">
            <button class="suggestion" data-question="Como cuidar da pele oleosa?">
                <span>☼</span>
                <strong>Pele oleosa</strong>
                <small>Como cuidar no dia a dia</small>
            </button>

            <button class="suggestion" data-question="Para que serve a niacinamida?">
                <span>✧</span>
                <strong>Ingredientes</strong>
                <small>Conheça a niacinamida</small>
            </button>

            <button class="suggestion" data-question="Qual é a ordem dos produtos de skincare?">
                <span>♡</span>
                <strong>Minha rotina</strong>
                <small>Ordem dos produtos</small>
            </button>

            <button class="suggestion" data-question="Por que usar protetor solar?">
                <span>☀</span>
                <strong>Proteção solar</strong>
                <small>Cuidados todos os dias</small>
            </button>
        </div>
    </div>
`;

// Divide as respostas em mensagens menores e adiciona emojis.
function dividirResposta(texto) {
    const textoLimpo = texto.trim();

    if (!textoLimpo) {
        return [];
    }

    const frases = textoLimpo.match(/[^.!?]+[.!?]+|[^.!?]+$/g);

    if (!frases) {
        return [textoLimpo];
    }

    const partes = [];
    let parteAtual = "";

    frases.forEach(frase => {
        const fraseLimpa = frase.trim();

        if (!fraseLimpa) {
            return;
        }

        if (
            parteAtual &&
            (parteAtual.length + fraseLimpa.length + 1 > 180)
        ) {
            partes.push(parteAtual);
            parteAtual = fraseLimpa;
        } else {
            parteAtual = parteAtual
                ? `${parteAtual} ${fraseLimpa}`
                : fraseLimpa;
        }
    });

    if (parteAtual) {
        partes.push(parteAtual);
    }

    return partes.map(parte => {
        const textoNormalizado = parte
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

        let emoji = "🌿";

        if (/limpeza|lavar|limpe|sabonete|limpador/.test(textoNormalizado)) {
            emoji = "🫧";
        } else if (/hidrat|hidrata|creme/.test(textoNormalizado)) {
            emoji = "💧";
        } else if (/protetor solar|protecao solar|raios uv/.test(textoNormalizado)) {
            emoji = "☀️";
        } else if (/acne|espinha|cravo/.test(textoNormalizado)) {
            emoji = "🌸";
        } else if (/niacinamida|vitamina c|ingrediente|ativo cosmetico/.test(textoNormalizado)) {
            emoji = "✨";
        } else if (/atencao|cuidado|irrit|dermatologista|evite|prejudic/.test(textoNormalizado)) {
            emoji = "💚";
        } else if (/rotina|ordem dos produtos|passo a passo/.test(textoNormalizado)) {
            emoji = "🧴";
        } else if (/oleosidade|pele oleosa|sebo|brilho excessivo/.test(textoNormalizado)) {
            emoji = "🌿";
        } else if (/mancha|melanina|hiperpigmentacao/.test(textoNormalizado)) {
            emoji = "🌷";
        } else if (/sensivel|sensibilidade|ardencia/.test(textoNormalizado)) {
            emoji = "🍃";
        }

        // Não adiciona outro emoji se a mensagem já começar com um.
        if (/^[\p{Extended_Pictographic}]/u.test(parte)) {
            return parte;
        }

        return `${emoji} ${parte}`;
    });
}

// Cria uma mensagem no chat.
function adicionarMensagem(texto, tipo) {
    const mensagem = document.createElement("div");
    mensagem.classList.add("message", `message-${tipo}`);

    if (tipo === "bot") {
        const avatar = document.createElement("div");
        avatar.className = "bot-avatar";
        avatar.textContent = "🌿";
        mensagem.appendChild(avatar);
    }

    const balao = document.createElement("div");
    balao.className = "message-bubble";
    balao.textContent = texto;

    mensagem.appendChild(balao);
    areaChat.appendChild(mensagem);

    areaChat.scrollTop = areaChat.scrollHeight;

    return mensagem;
}

// Mostra o indicador de digitação.
function mostrarDigitacao() {
    const mensagem = document.createElement("div");
    mensagem.className = "message message-bot typing-message";

    const avatar = document.createElement("div");
    avatar.className = "bot-avatar";
    avatar.textContent = "🌿";

    const balao = document.createElement("div");
    balao.className = "message-bubble";
    balao.textContent = "Digitando...";

    mensagem.appendChild(avatar);
    mensagem.appendChild(balao);

    areaChat.appendChild(mensagem);
    areaChat.scrollTop = areaChat.scrollHeight;

    return mensagem;
}

// Aguarda um intervalo antes de continuar.
function aguardar(tempo) {
    return new Promise(resolve => setTimeout(resolve, tempo));
}

// Exibe cada parte da resposta automaticamente.
async function exibirRespostaEmPartes(texto) {
    const partes = dividirResposta(texto);

    for (let i = 0; i < partes.length; i++) {
        const indicador = mostrarDigitacao();

        await aguardar(850);

        indicador.remove();

        adicionarMensagem(partes[i], "bot");

        if (i < partes.length - 1) {
            await aguardar(350);
        }
    }
}

// Conecta os botões de sugestão da tela inicial.
function conectarSugestoes() {
    document.querySelectorAll(".suggestion").forEach(botao => {
        botao.addEventListener("click", () => {
            enviarMensagem(botao.dataset.question || "");
        });
    });
}

// Atualiza o histórico de conversas.
async function atualizarHistorico() {
    try {
        const resposta = await fetch("/conversas");
        const dados = await resposta.json();

        listaConversas.innerHTML = "";

        if (!dados.conversas.length) {
            listaConversas.innerHTML =
                '<p class="history-empty">Nenhuma conversa salva ainda.</p>';
            return;
        }

        dados.conversas.forEach(conversa => {
            const botao = document.createElement("button");
            botao.className = "conversation-item";
            botao.textContent = conversa.titulo;
            botao.title = conversa.titulo;

            if (conversa.id === conversaAtualId) {
                botao.classList.add("active");
            }

            botao.addEventListener("click", () => {
                abrirConversa(conversa.id);
            });

            listaConversas.appendChild(botao);
        });
    } catch (erro) {
        console.error("Não foi possível carregar o histórico:", erro);
    }
}

// Abre uma conversa salva anteriormente.
async function abrirConversa(identificador) {
    try {
        const resposta = await fetch(`/conversas/${identificador}`);
        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao abrir conversa.");
        }

        conversaAtualId = identificador;
        areaChat.innerHTML = "";

        const mensagens = dados.conversa.mensagens;

        if (mensagens.length === 0) {
            areaChat.innerHTML = telaInicial;
            conectarSugestoes();
        } else {
            mensagens.forEach(mensagem => {
                if (mensagem.tipo === "bot") {
                    // Mostra as respostas antigas sem atrasos.
                    dividirResposta(mensagem.texto).forEach(parte => {
                        adicionarMensagem(parte, "bot");
                    });
                } else {
                    adicionarMensagem(mensagem.texto, mensagem.tipo);
                }
            });
        }

        await atualizarHistorico();
        campoMensagem.focus();

    } catch (erro) {
        console.error("Erro ao abrir conversa:", erro);
        alert("Não foi possível abrir essa conversa.");
    }
}

// Envia a pergunta para o Flask e exibe a resposta em partes.
async function enviarMensagem(texto) {
    const mensagem = texto.trim();

    if (!mensagem || botaoEnviar.disabled) {
        campoMensagem.focus();
        return;
    }

    try {
        if (!conversaAtualId) {
            const criacao = await fetch("/conversas", {
                method: "POST"
            });

            const dadosCriacao = await criacao.json();

            if (!criacao.ok) {
                throw new Error("Não foi possível criar a conversa.");
            }

            conversaAtualId = dadosCriacao.conversa.id;
        }

        const boasVindas = document.getElementById("welcome");

        if (boasVindas) {
            boasVindas.remove();
        }

        adicionarMensagem(mensagem, "user");

        campoMensagem.value = "";
        campoMensagem.style.height = "auto";

        botaoEnviar.disabled = true;
        botaoEnviar.textContent = "…";

        const resposta = await fetch("/perguntar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                mensagem: mensagem,
                conversa_id: conversaAtualId
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.resposta || "Não foi possível enviar a pergunta."
            );
        }

        await exibirRespostaEmPartes(dados.resposta);

        await atualizarHistorico();

    } catch (erro) {
        console.error("Erro ao conversar com o DermaChat:", erro);

        adicionarMensagem(
            "Não consegui processar sua pergunta agora. Verifique se o servidor está funcionando e tente novamente.",
            "bot"
        );

    } finally {
        botaoEnviar.disabled = false;
        botaoEnviar.textContent = "↑";
        campoMensagem.focus();
    }
}

// Envia a mensagem ao pressionar Enter.
formulario.addEventListener("submit", evento => {
    evento.preventDefault();
    enviarMensagem(campoMensagem.value);
});

// Ajusta a altura do campo conforme o texto digitado.
campoMensagem.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = `${Math.min(this.scrollHeight, 130)}px`;
});

// Enter envia a mensagem; Shift + Enter quebra a linha.
campoMensagem.addEventListener("keydown", evento => {
    if (evento.key === "Enter" && !evento.shiftKey) {
        evento.preventDefault();
        formulario.requestSubmit();
    }
});

// Inicia uma nova conversa.
botaoNovoChat.addEventListener("click", () => {
    conversaAtualId = null;
    areaChat.innerHTML = telaInicial;

    campoMensagem.value = "";
    campoMensagem.style.height = "auto";

    conectarSugestoes();
    atualizarHistorico();
    campoMensagem.focus();
});

// Inicializa a interface e carrega o histórico.
conectarSugestoes();
atualizarHistorico();