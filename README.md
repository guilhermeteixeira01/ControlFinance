# Controle Financeiro — App Desktop (Electron)

## Pré-requisitos
- Node.js instalado (https://nodejs.org) — versão 18 ou superior

---

## Rodar em modo desenvolvimento

```bash
# 1. Instale as dependências
npm install

# 2. Inicie o app
npm start
```

Uma janela nativa vai abrir com o app.

---

## Gerar instalador (.exe / .dmg / .AppImage)

### Windows → gera um instalador .exe
```bash
npm run build:win
```

### Mac → gera um .dmg
```bash
npm run build:mac
```

### Linux → gera um .AppImage
```bash
npm run build:linux
```

O arquivo final fica na pasta `dist/`.

---

## Onde os dados ficam salvos?

Os dados (`dados.json`) são salvos automaticamente na pasta de dados do usuário:

| Sistema | Caminho |
|---------|---------|
| Windows | `C:\Users\SeuNome\AppData\Roaming\controle-financeiro\` |
| Mac     | `~/Library/Application Support/controle-financeiro/` |
| Linux   | `~/.config/controle-financeiro/` |

Isso garante que seus dados **não são apagados** ao atualizar o app.

---

## Ícone personalizado

Substitua o arquivo `icon.png` por uma imagem sua (recomendado: 512×512 px).
Para Windows, você pode usar um `.ico` e ajustar o `package.json` em `"win": { "icon": "icon.ico" }`.
