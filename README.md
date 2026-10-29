# Endroid (Web Edition — Phaser 3 + Vite + TypeScript)

Jogo arcade de corrida *top-down* originalmente criado em Corona SDK (Lua) e migrado para a Web com **Phaser 3**, **Vite** e **TypeScript**.

## Como Executar

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Gerar build de produção (em dist/)
npm run build
```

## Controles

* **Desktop**: `Setas Esquerda/Direita` ou `A` / `D` para desviar (`Espaço` ou `Seta para Cima` para pular com o Mach 5).
* **Mobile / Touch**: Setas na tela para mover (`Toque no próprio carro` para pular com o Mach 5).

## Easter Eggs e Carros Secretos

1. **Herbie #53 (`herbie.png`)**:
   * **Como desbloquear em jogo**: Ultrapasse **53 carros** em uma partida.
   * **Código secreto (Menu ou Jogo)**: Digite `53` ou `HERBIE` no teclado, ou toque **5 vezes** no logo **ENDROID** no menu inicial.
   * **Habilidade**: Começa a partida com **+1 vida extra** (4 vidas) e concede **+530 pontos** ao ser ativado em corrida.

2. **DeLorean DMC-12 (`delorean.png`)**:
   * **Como desbloquear em jogo**: Atinja a velocidade de **88 KM/H** na corrida.
   * **Código secreto (Menu ou Jogo)**: Digite `88` ou `DELOREAN` no teclado.
   * **Habilidade**: **Salto Temporal a 88 KM/H** — desacelera o tráfego inimigo e concede escudo temporal por 4 segundos + **+880 pontos**.

3. **Mach 5 — Speed Racer (`speedracer.png`)**:
   * **Como desbloquear em jogo**: Alcance **1000 pontos sem perder vida** ou atinja **110 KM/H**.
   * **Código secreto (Menu ou Jogo)**: Digite `MACH5` ou `SPEED` no teclado.
   * **Habilidade**: Direção de alta resposta + **Auto-Jack Jump** (aperte `Espaço`, `Seta para Cima` ou toque no próprio carro para saltar sobre os carros inimigos!).

## Estrutura do Projeto

* `src/` — Código-fonte em TypeScript + Phaser 3 (`PreloadScene`, `MenuScene`, `GameScene`, `GameOverScene`, `AudioService`, `StorageService`).
* `public/assets/` — Imagens, fontes e efeitos sonoros otimizados e sem duplicidades.
* `legacy/` — Código e assets originais em Lua / Corona SDK preservados para referência histórica.

