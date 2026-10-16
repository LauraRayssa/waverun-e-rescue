/**
 * Navio.js
 * PAPEL NO JOGO: é a terceira e última embarcação (fase 3, tempestade).
 * É a maior de todas, com capacidade 40. Lotar o navio vence a partida.
 *
 * CONCEITOS DE POO:
 *  - HERANÇA: "Navio extends Vehicle".
 *  - POLIMORFISMO: o navio sobrescreve move() e troca a resposta imediata
 *    das setas por INÉRCIA: demora a começar a virar e demora a parar, como
 *    um navio de verdade. Jet ski e lancha usam o move() da classe-mãe.
 *  - ENCAPSULAMENTO: a velocidade vertical é um campo privado (#), que só
 *    esta classe consegue ler ou alterar.
 */
import { Vehicle } from './Vehicle.js';

export class Navio extends Vehicle {
    /** Velocidade vertical acumulada (inércia do navio). Privada: só o Navio mexe nela. */
    #verticalVelocity = 0;

    /** Identificador usado para achar imagens e ícones. */
    get key() {
        return 'navio';
    }

    /** Nome mostrado no HUD e nas telas. */
    get name() {
        return 'Navio';
    }

    /** Tempo para lotar o navio. Passou disso sem lotar, o jogo termina. */
    get rescueTimeLimit() {
        return 360; // 6 minutos para resgatar
    }

    /** Capacidade total, contando o condutor. */
    get capacity() {
        return 40; // condutor + 39 pessoas
    }

    /** Velocidade máxima ao acelerar (px/s). É a menor das três: navio é pesado. */
    get maxSpeed() {
        return 170;
    }

    /** Velocidade de cruzeiro, sem apertar nenhuma tecla de velocidade. */
    get cruiseSpeed() {
        return 90;
    }

    /** Aceleração (px/s²). Baixa, porque o navio demora a pegar velocidade. */
    get acceleration() {
        return 90;
    }

    /** Velocidade para subir e descer de raia (px/s). */
    get lateralSpeed() {
        return 170;
    }

    /** Comprimento desenhado na tela (px). */
    get drawLengthValue() {
        return 170; // comprimento na tela (px)
    }

    /** O sprite do navio aponta para cima, então giramos 90 graus para apontar para a direita. */
    get bowAngle() {
        return Math.PI / 2;
    }

    /**
     * Movimento com inércia: a velocidade vertical vai até o alvo aos poucos,
     * em vez de mudar de uma vez. Esse é o comportamento próprio do navio.
     */
    move(dt, input) {
        // Direção desejada: -1 sobe, +1 desce, 0 fica parado.
        let direction = 0;
        if (input.up) direction -= 1;
        if (input.down) direction += 1;

        // A cada quadro, a velocidade atual anda uma fração do caminho até a velocidade desejada.
        const targetVelocity = direction * this.lateralSpeed;
        this.#verticalVelocity += (targetVelocity - this.#verticalVelocity) * Math.min(1, dt * 5);

        const before = this.y;
        const step = this.#verticalVelocity * dt;
        this.y += step;
        this.clampY();
        // Bateu na borda da água: zera a inércia, senão o navio fica "empurrando" a borda.
        if (this.y !== before + step) this.#verticalVelocity = 0;
    }

    /**
     * Polimorfismo: o navio desenha uma esteira larga e mais longa.
     * A esteira vai primeiro (embaixo) e o barco por cima.
     */
    draw(ctx) {
        this.drawWake(ctx);
        super.draw(ctx);
    }

    /** Desenha uma esteira branca larga atrás do navio (um trapézio translúcido). */
    drawWake(ctx) {
        if (this.speed < 1) return; // parado: sem esteira
        // Quanto mais rápido o navio, mais comprida a esteira.
        const length = 120 + Math.max(0, this.speed) * 0.25;
        const startX = this.x - this.length / 2; // popa (parte de trás)
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.beginPath();
        ctx.moveTo(startX, this.y - 22);
        ctx.lineTo(startX - length, this.y - 46);
        ctx.lineTo(startX - length, this.y + 46);
        ctx.lineTo(startX, this.y + 22);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}
