/**
 * Lancha.js
 * PAPEL NO JOGO: é a segunda embarcação (fase 2, mar agitado).
 *
 * CONCEITO DE POO: HERANÇA. "Lancha extends Vehicle": aproveita tudo da
 * classe-mãe e só redefine o que muda. Em relação ao jet ski, a lancha é
 * maior, um pouco mais lenta e deixa uma esteira de espuma (wake) atrás de si.
 */
import { Vehicle } from './Vehicle.js';

export class Lancha extends Vehicle {
    /** Identificador usado para achar imagens e ícones. */
    get key() {
        return 'lancha';
    }

    /** Nome mostrado no HUD e nas telas. */
    get name() {
        return 'Lancha';
    }

    /** Tempo para lotar a lancha. Passou disso sem lotar, o jogo termina. */
    get rescueTimeLimit() {
        return 180; // 3 minutos para resgatar
    }

    /** Capacidade total, contando o condutor. */
    get capacity() {
        return 14; // condutor + 13 pessoas resgatadas
    }

    /** Velocidade máxima ao acelerar (px/s). */
    get maxSpeed() {
        return 220;
    }

    /** Velocidade de cruzeiro, sem apertar nenhuma tecla de velocidade. */
    get cruiseSpeed() {
        return 115;
    }

    /** Quão rápido a lancha chega à velocidade alvo (px/s²). */
    get acceleration() {
        return 150;
    }

    /** Velocidade para subir e descer de raia (px/s). */
    get lateralSpeed() {
        return 200;
    }

    /** Comprimento desenhado na tela (px). */
    get drawLengthValue() {
        return 200;
    }

    /** O sprite da lancha aponta para cima, então giramos 90 graus (PI/2) para ela apontar para a direita. */
    get bowAngle() {
        return Math.PI / 2; // o sprite aponta para cima; gira para a direita
    }

    /**
     * Polimorfismo: a lancha acrescenta uma esteira atrás de si.
     * A esteira é desenhada antes, para ficar embaixo do barco.
     */
    draw(ctx) {
        this.drawWake(ctx);
        super.draw(ctx);
    }

    /** Desenha duas linhas de espuma atrás da lancha, abrindo em "V". */
    drawWake(ctx) {
        // Quanto mais rápida a lancha, mais comprida a esteira.
        const length = 60 + Math.max(0, this.speed) * 0.2;
        const startX = this.x - this.length / 2; // popa (parte de trás)
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 3;
        for (const side of [-1, 1]) { // -1 = linha de cima, 1 = linha de baixo
            ctx.beginPath();
            ctx.moveTo(startX, this.y + side * 8);
            ctx.lineTo(startX - length, this.y + side * 26);
            ctx.stroke();
        }
        ctx.restore();
    }
}
