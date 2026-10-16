/**
 * GameLoop.js
 * PAPEL NO JOGO: é o "coração" que bate a cada quadro.
 *
 * Usa o requestAnimationFrame do navegador, que
 * chama o nosso código várias vezes por segundo (em geral 60). A cada
 * chamada, calcula quanto tempo passou desde o quadro anterior (dt) e
 * repassa esse valor para a função onFrame.
 *
 * POR QUE USAR dt: se o movimento dependesse só do número de quadros, o jogo
 * rodaria mais rápido em telas de 144 Hz do que em telas de 60 Hz. Com o dt,
 * o barco anda a mesma distância por segundo em qualquer computador.
 */
import { MAX_FRAME_TIME } from '../config/Config.js';

export class GameLoop {
    /**
     * @param {(dt: number) => void} onFrame - função chamada a cada quadro.
     */
    constructor(onFrame) {
        this.onFrame = onFrame;
        this.lastTimestamp = null; // instante do quadro anterior (ainda não existe)
        this.running = false;
        // bind garante que "this" continue sendo o GameLoop quando o navegador chamar tick.
        this.tick = this.tick.bind(this);
    }

    /** Inicia o loop. */
    start() {
        this.running = true;
        requestAnimationFrame(this.tick);
    }

    /** Para o loop. */
    stop() {
        this.running = false;
    }

    /**
     * Executa um quadro. O navegador passa o timestamp em milissegundos.
     * @param {number} timestamp
     */
    tick(timestamp) {
        if (!this.running) return;

        // No primeiro quadro não há quadro anterior; usamos o próprio instante (dt = 0).
        if (this.lastTimestamp === null) {
            this.lastTimestamp = timestamp;
        }
        // Converte para segundos e limita o valor (evita saltos após pausas longas).
        const dt = Math.min((timestamp - this.lastTimestamp) / 1000, MAX_FRAME_TIME);
        this.lastTimestamp = timestamp;

        this.onFrame(dt);
        // Pede o próximo quadro: é assim que o loop se mantém vivo.
        requestAnimationFrame(this.tick);
    }
}
