
from flask import Flask, render_template, request, jsonify
from pathlib import Path
from datetime import datetime
import json
import unicodedata
import re
import uuid

app = Flask(__name__)

PASTA_BASE = Path(__file__).parent
CAMINHO_BASE = PASTA_BASE / "conhecimento.json"
CAMINHO_HISTORICO = PASTA_BASE / "historico.json"


def normalizar(texto):
    texto = str(texto).lower().strip()
    texto = unicodedata.normalize("NFD", texto)

    texto = "".join(
        caractere
        for caractere in texto
        if unicodedata.category(caractere) != "Mn"
    )

    texto = re.sub(r"[^a-z0-9\s]", " ", texto)
    return " ".join(texto.split())


def carregar_base():
    try:
        with open(CAMINHO_BASE, "r", encoding="utf-8") as arquivo:
            dados = json.load(arquivo)

        if isinstance(dados, list):
            return [
                item for item in dados
                if isinstance(item, dict)
            ]

        return []

    except (FileNotFoundError, json.JSONDecodeError):
        return []


def calcular_pontuacao(pergunta, item):
    pergunta_normalizada = normalizar(pergunta)
    palavras_pergunta = set(pergunta_normalizada.split())

    sinonimos = {
        "brilhante": {
            "brilho", "brilhando", "oleoso", "oleosa", "oleosidade"
        },
        "brilhando": {
            "brilho", "brilhante", "oleoso", "oleosa", "oleosidade"
        },
        "brilho": {
            "brilhante", "brilhando", "oleoso", "oleosa", "oleosidade"
        },
        "oleoso": {"oleosa", "oleosidade", "brilho", "brilhante"},
        "oleosa": {"oleoso", "oleosidade", "brilho", "brilhante"},
        "oleosidade": {"oleoso", "oleosa", "brilho", "brilhante"},
        "seca": {"seco", "ressecada", "ressecado", "ressecamento"},
        "seco": {"seca", "ressecada", "ressecado", "ressecamento"},
        "ressecada": {"seca", "seco", "ressecamento"},
        "ressecado": {"seca", "seco", "ressecamento"},
        "espinhas": {"acne", "espinha"},
        "espinha": {"acne", "espinhas"},
        "cravos": {"cravo", "acne"},
        "cravo": {"cravos", "acne"},
        "hidratar": {"hidratacao", "hidratante", "hidratar"},
        "hidratacao": {"hidratar", "hidratante"},
        "hidratante": {"hidratar", "hidratacao"},
        "manchas": {"mancha", "hiperpigmentacao"},
        "mancha": {"manchas", "hiperpigmentacao"},
        "ardendo": {"ardencia", "irritacao", "irritada", "irritado"},
        "irritada": {"irritacao", "ardencia", "sensivel"},
        "irritado": {"irritacao", "ardencia", "sensivel"},
    }

    palavras_expandidas = set(palavras_pergunta)

    for palavra in palavras_pergunta:
        palavras_expandidas.update(sinonimos.get(palavra, set()))

    assunto = normalizar(item.get("assunto", ""))
    palavras_assunto = set(assunto.split())

    termos = [assunto]
    termos.extend(item.get("palavras_chave", []))

    melhor_pontuacao = 0

    # Prioriza correspondências com o assunto completo.
    if assunto and assunto in pergunta_normalizada:
        melhor_pontuacao = max(melhor_pontuacao, 10)

    for termo in termos:
        termo_normalizado = normalizar(termo)

        if not termo_normalizado:
            continue

        palavras_termo = set(termo_normalizado.split())

        # Correspondência direta de uma expressão.
        if termo_normalizado in pergunta_normalizada:
            pontuacao = 8 + len(palavras_termo)
            melhor_pontuacao = max(melhor_pontuacao, pontuacao)

        # Correspondência de todas as palavras, incluindo sinônimos.
        if palavras_termo and palavras_termo.issubset(palavras_expandidas):
            pontuacao = 5 + len(palavras_termo)
            melhor_pontuacao = max(melhor_pontuacao, pontuacao)

    if palavras_assunto and palavras_assunto.issubset(palavras_expandidas):
        melhor_pontuacao = max(melhor_pontuacao, 10)

    return melhor_pontuacao


def responder(pergunta):
    base = carregar_base()

    if not base:
        return (
            "Minha base de conhecimento não está disponível. 🌿 "
            "Verifique se o arquivo conhecimento.json existe e contém "
            "uma lista JSON válida."
        )

    pergunta_normalizada = normalizar(pergunta)

    if not pergunta_normalizada:
        return "Digite uma pergunta para começar. 🌿"

    melhor_item = None
    melhor_pontuacao = 0

    for item in base:
        pontuacao = calcular_pontuacao(pergunta, item)

        if pontuacao > melhor_pontuacao:
            melhor_pontuacao = pontuacao
            melhor_item = item

    if melhor_item and melhor_pontuacao >= 8:
        resposta = melhor_item.get("resposta", "")

        if resposta:
            return resposta

    return (
        "Ainda não encontrei uma resposta específica para essa pergunta. 🌿\n\n"
        "Você pode perguntar sobre limpeza facial, hidratação, pele oleosa, "
        "pele seca, acne, manchas, protetor solar ou ingredientes como "
        "niacinamida, vitamina C e ácido hialurônico."
    )


def carregar_historico():
    if not CAMINHO_HISTORICO.exists():
        return {}

    try:
        with open(CAMINHO_HISTORICO, "r", encoding="utf-8") as arquivo:
            dados = json.load(arquivo)

        return dados if isinstance(dados, dict) else {}

    except (json.JSONDecodeError, OSError):
        return {}


def salvar_historico(historico):
    with open(CAMINHO_HISTORICO, "w", encoding="utf-8") as arquivo:
        json.dump(
            historico,
            arquivo,
            ensure_ascii=False,
            indent=2
        )


def agora():
    return datetime.now().astimezone().isoformat(timespec="seconds")


@app.route("/")
def inicio():
    return render_template("index.html")


@app.route("/conversas", methods=["GET"])
def listar_conversas():
    historico = carregar_historico()

    conversas = [
        {
            "id": conversa["id"],
            "titulo": conversa["titulo"],
            "atualizado_em": conversa["atualizado_em"]
        }
        for conversa in historico.values()
        if isinstance(conversa, dict)
        and all(
            campo in conversa
            for campo in ("id", "titulo", "atualizado_em")
        )
    ]

    conversas.sort(
        key=lambda conversa: conversa["atualizado_em"],
        reverse=True
    )

    return jsonify({"conversas": conversas})


@app.route("/conversas", methods=["POST"])
def criar_conversa():
    historico = carregar_historico()

    identificador = str(uuid.uuid4())
    data_atual = agora()

    conversa = {
        "id": identificador,
        "titulo": "Nova conversa",
        "criado_em": data_atual,
        "atualizado_em": data_atual,
        "mensagens": []
    }

    historico[identificador] = conversa
    salvar_historico(historico)

    return jsonify({"conversa": conversa}), 201


@app.route("/conversas/<identificador>", methods=["GET"])
def obter_conversa(identificador):
    historico = carregar_historico()
    conversa = historico.get(identificador)

    if not conversa:
        return jsonify({"erro": "Conversa não encontrada."}), 404

    return jsonify({"conversa": conversa})


@app.route("/perguntar", methods=["POST"])
def perguntar():
    dados = request.get_json(silent=True) or {}

    mensagem = dados.get("mensagem", "").strip()
    identificador = dados.get("conversa_id", "")

    if not mensagem:
        return jsonify({
            "resposta": "Digite uma pergunta para começar."
        }), 400

    historico = carregar_historico()
    conversa = historico.get(identificador)

    if not conversa:
        return jsonify({
            "resposta": "Conversa não encontrada. Inicie uma nova conversa."
        }), 404

    resposta = responder(mensagem)
    data_atual = agora()

    conversa["mensagens"].append({
        "tipo": "user",
        "texto": mensagem,
        "data": data_atual
    })

    conversa["mensagens"].append({
        "tipo": "bot",
        "texto": resposta,
        "data": data_atual
    })

    if conversa["titulo"] == "Nova conversa":
        conversa["titulo"] = (
            mensagem[:40] + "..."
            if len(mensagem) > 40
            else mensagem
        )

    conversa["atualizado_em"] = data_atual

    historico[identificador] = conversa
    salvar_historico(historico)

    return jsonify({
        "resposta": resposta,
        "conversa_id": identificador,
        "titulo": conversa["titulo"]
    })


if __name__ == "__main__":
    app.run(debug=True)
