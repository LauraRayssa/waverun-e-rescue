/**
 * Survivor.js
 * PAPEL NO JOGO: representa uma pessoa na água que precisa de resgate.
 *
 * CONCEITO DE POO: ENCAPSULAMENTO. O estado "resgatada" é um campo privado
 * (#rescued). De fora, só dá para LER (isRescued) e para MARCAR (markRescued),
 * nunca para desmarcar. Assim a mesma pessoa não é contada duas vezes.
 */
import { CANVAS_WIDTH } from '../config/Config.js';

export class Survivor {
    /** Tamanho desenhado da pessoa (px). É "static": vale para todas as pessoas. */
    static SIZE = 56;

    /** Campo privado: só esta classe enxerga. */
    #rescued = false;

    /**
     * @param {HTMLImageElement} image - sprite da pessoa (vista de cima).
     * @param {number} x - posição horizontal inicial (borda direita da tela).
     * @param {number} y - posição vertical dentro da faixa de mar.
     */
    constructor(image, x, y) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.bobTime = Math.random() * Math.PI * 2; // fase do balanço, diferente para cada pessoa
    }

    /** Leitura do estado privado: esta pessoa já foi resgatada? */
    get isRescued() {
        return this.#rescued;
    }

    /** Marca a pessoa como resgatada. Não volta atrás. */
    markRescued() {
        this.#rescued = true;
    }

    /** Verdadeiro quando a pessoa saiu da tela pela esquerda ou pela direita (pode ser descartada). */
    get isOffScreen() {
        return this.x < -Survivor.SIZE || this.x > CANVAS_WIDTH + 200;
    }

    /** O cenário "rola": a pessoa anda no sentido contrário ao barco. */
    update(dt, scrollSpeed) {
        this.bobTime += dt;
        this.x -= scrollSpeed * dt;
    }

    /**
     * Retângulo ocupado pela pessoa, usado para detectar o resgate.
     * Obstacle também tem um getBounds(); por isso o CollisionSystem trata os dois do mesmo jeito.
     */
    getBounds() {
        return {
            x: this.x - Survivor.SIZE / 2,
            y: this.y - Survivor.SIZE / 2,
            width: Survivor.SIZE,
            height: Survivor.SIZE,
        };
    }

    /** Desenha a pessoa, balançando de leve para cima e para baixo como se boiasse. */
    draw(ctx) {
        const bob = Math.sin(this.bobTime * 4) * 3;
        ctx.drawImage(
            this.image,
            this.x - Survivor.SIZE / 2,
            this.y - Survivor.SIZE / 2 + bob,
            Survivor.SIZE,
            Survivor.SIZE,
        );
    }
}
