# 🌿 DermaChat — Chatbot de Cuidados com a Pele

O **DermaChat** é um chatbot desenvolvido para responder a dúvidas comuns sobre cuidados com a pele (*skincare*). O projeto utiliza uma base de conhecimento em JSON para identificar palavras-chave nas perguntas dos usuários e apresentar respostas relacionadas ao assunto.

A proposta é oferecer uma experiência simples e intuitiva para quem deseja aprender mais sobre cuidados diários com a pele.

## ✨ Funcionalidades

- 💬 Chat interativo para envio de perguntas.
- 🌿 Respostas sobre temas relacionados a skincare.
- 🧴 Base de conhecimento organizada em arquivo JSON.
- 🕘 Histórico de conversas salvo localmente.
- 💡 Sugestões de perguntas para facilitar a interação.
- 🎨 Interface desenvolvida com HTML, CSS e JavaScript.

## 🛠️ Tecnologias utilizadas

- **Python** — lógica da aplicação.
- **Flask** — criação das rotas e comunicação entre o front-end e o back-end.
- **HTML5** — estrutura da interface.
- **CSS3** — estilização da aplicação.
- **JavaScript** — interatividade do chat.
- **JSON** — armazenamento da base de conhecimento e do histórico local.

## 📂 Estrutura do projeto

```text
DermaChat/
├── app.py
├── conhecimento.json
├── historico.json
├── requirements.txt
├── templates/
│   └── index.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── script.js
```

> O arquivo `historico.json` é utilizado localmente e está excluído do repositório por meio do `.gitignore`.

## ▶️ Como executar o projeto

### 1. Pré-requisitos

Tenha o Python instalado no computador.

### 2. Clone o repositório

```bash
git clone https://github.com/amanda-gabrielly/DermaChat.git
```

### 3. Entre na pasta do projeto

```bash
cd DermaChat
```

### 4. Crie um ambiente virtual

```bash
python -m venv .venv
```

### 5. Ative o ambiente virtual

No Windows, utilizando PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 6. Instale as dependências

```bash
pip install -r requirements.txt
```

### 7. Execute a aplicação

```bash
python app.py
```

### 8. Acesse no navegador

Abra o endereço:

```text
http://127.0.0.1:5000
```

## 📚 Aprendizados

Este projeto foi desenvolvido como uma oportunidade de praticar conceitos de programação com Python, desenvolvimento web com Flask, manipulação de arquivos JSON e integração entre front-end e back-end.

## ⚠️ Observação

O DermaChat é um projeto educacional e informativo. As respostas são baseadas em uma base de conhecimento local e não substituem a avaliação de um dermatologista ou outro profissional de saúde.

## 👩‍💻 Desenvolvido por

**Amanda Gabrielly**

[GitHub — amanda-gabrielly](https://github.com/amanda-gabrielly)
