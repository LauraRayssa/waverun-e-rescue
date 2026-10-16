/**
 * InputManager.js
 * PAPEL NO JOGO: é o "ouvido" do jogo. Lê o teclado e informa quais
 * setas estão pressionadas naquele instante.
 *
 * O navegador avisa quando uma tecla é apertada
 * (keydown) e quando é solta (keyup). Esta classe anota isso em um objeto
 * simples, e o jogo só precisa perguntar "↑ está apertada agora?".
 *
 * Controles (conforme a tela "Como jogar"):
 *   ↑ / ↓   muda de raia (sobe ou desce)
 *   →       acelera
 *   ←       dá ré
 *   P / Esc pausa ou continua
 */

/** Liga o nome de cada tecla do navegador à acao do jogo. */
const MOVEMENT_KEYS = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
};

export class InputManager {
    /**
     * @param {{onPauseToggle: () => void}} options - funcao chamada ao apertar P ou Esc.
     */
    constructor({ onPauseToggle }) {
        this.onPauseToggle = onPauseToggle;
        // true = tecla segurada neste momento.
        this.pressed = { up: false, down: false, left: false, right: false };

        // "Ouvintes" de teclado: o navegador chama estas funções sozinho.
        window.addEventListener('keydown', (event) => this.handleKeyDown(event));
        window.addEventListener('keyup', (event) => this.handleKeyUp(event));
        // Se a janela perde o foco, solta todas as teclas para não ficar "preso".
        window.addEventListener('blur', () => this.releaseAll());
    }

    /** Chamado quando uma tecla é apertada. */
    handleKeyDown(event) {
        const action = MOVEMENT_KEYS[event.code];
        if (action) {
            this.pressed[action] = true;
            event.preventDefault(); // impede que a página role com as setas
            return;
        }

        // P ou Esc alternam a pausa. "!event.repeat" ignora a repetição de quem segura a tecla.
        if ((event.code === 'KeyP' || event.code === 'Escape') && !event.repeat) {
            this.onPauseToggle();
        }
    }

    /** Chamado quando uma tecla é solta. */
    handleKeyUp(event) {
        const action = MOVEMENT_KEYS[event.code];
        if (action) {
            this.pressed[action] = false;
        }
    }

    /** Solta todas as teclas de uma vez. */
    releaseAll() {
        for (const key of Object.keys(this.pressed)) {
            this.pressed[key] = false;
        }
    }

    /**
     * Retorna uma cópia do estado atual das teclas.
     * Uma cópia evita que o jogo altere o estado do teclado por engano
     * (encapsulamento: quem recebe a cópia não mexe no original).
     */
    snapshot() {
        return { ...this.pressed };
    }
}
