# Publicação do Endroid

Publicação inicial: 29/10/2026.

- Jogo: https://endroid-web.vercel.app/
- Catálogo no Flow: https://flowofdevelopment.com/ — procure `Endroid` e clique em `Jogar`.
- Projeto na Vercel: https://vercel.com/mauriciokjs-projects/endroid-web
- Equipe: `mauriciokjs-projects`.
- Repositório: `git@github.com:felipebroering/endroid.git`.
- Branch de origem: `web-phaser`.
- Commit publicado: `6ac6c62a95d94a911ae2c8e7297cd01074233bc6`.
- Versão do jogo: `2.0.0`.
- Publicação: **produção**, por upload do build estático via Vercel Drop.
- Deployment: `CAYoxkTi6DnX3kHkkDVKJs7jQpRA`.
- URL do deployment: https://endroid-jb2t4rsdz-mauriciokjs-projects.vercel.app/

## Atualizações

O deploy automático pelo GitHub ainda não está conectado. A importação do repositório pela Vercel retornou `Could not access the repository`.

Enquanto isso, gere e envie o build para o mesmo projeto:

```sh
npm ci
npm run build
mkdir -p .local
(cd dist && zip -r ../.local/endroid-web.zip .)
```

Envie `.local/endroid-web.zip` na página do projeto `endroid-web`, que aceita novos arquivos por arrastar e soltar. O ZIP deve conter `index.html` e `assets/` na raiz. O endereço público permanece o mesmo e o cadastro do Flow continua funcionando.

Para ativar publicação pelo GitHub, conecte `felipebroering/endroid` na configuração Git do projeto e selecione **`web-phaser` como branch de produção**. O arquivo `vercel.json` define Vite, `npm ci`, `npm run build` e saída `dist/`.

## Cadastro no Flow

- Firebase: `fir-d4471`, banco `(default)`, edição Standard.
- Documento: `artifacts/game-portal-v2/public/data/games/endroid-web`.
- Título: `Endroid`; categoria: `Arcade`; tipo: `url`.
- URL cadastrada: https://endroid-web.vercel.app/
- Cadastro atribuído à conta administradora do catálogo, seguindo o formato dos jogos existentes.

O jogo mantém a origem Git e o checkout próprios em `/Users/mauriciokj/projetos/endroid`.

## Verificação

- Build TypeScript/Vite passou.
- HTML, JavaScript, fonte e favicon públicos responderam HTTP 200, com hashes iguais ao build local.
- Menu e corrida foram conferidos no computador e em viewport móvel 390×844, sem erros de console.
- Cadastro e abertura pelo cartão `Endroid` foram conferidos no Flow.
- O aviso do Flow que cobria jogos externos após quatro segundos foi removido em `src/components/GameModal.jsx` do projeto `/Users/mauriciokj/projetos/flow_of_development/game-platform`. Lint e build passaram, com publicação em Firebase Hosting `fir-d4471`.

Os arquivos de configuração/documentação do Endroid e a correção do Flow estão locais, sem commit ou push nesta tarefa.
