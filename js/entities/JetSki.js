/**
 * JetSki.js
 * PAPEL NO JOGO: é a primeira embarcação (fase 1, mar calmo).
 *
 * CONCEITO DE POO: HERANÇA. "JetSki extends Vehicle" significa que o jet ski
 * já nasce com tudo o que a classe Vehicle tem (posição, velocidade, ocupação,
 * movimento, colisão). Aqui só escrevemos o que é DIFERENTE nele:
 *   - os números próprios (velocidade, capacidade, tempo de resgate);
 *   - o desenho do espirro de água.
 * Cada "get" abaixo SOBRESCREVE o valor padrão da classe-mãe (polimorfismo).
 *
 * Personalidade do jet ski: é a embarcação mais ágil e a que mais espirra água.
 */
import { Vehicle } from './Vehicle.js';

export class JetSki extends Vehicle {
    /** Identificador usado para achar imagens e ícones. */
    get key() {
        return 'jetski';
    }

    /** Nome mostrado no HUD e nas telas. */
    get name() {
        return 'Jet ski';
    }

    /** Tempo para lotar o jet ski. Passou disso sem lotar, o jogo termina. */
    get rescueTimeLimit() {
        return 60; // 1 minuto para resgatar
    }

    /** Capacidade total, contando o condutor. */
    get capacity() {
        return 3; // ocupação total, condutor incluído (3 pessoas no jet ski)
    }

    /** Velocidade máxima ao acelerar (px/s). */
    get maxSpeed() {
        return 260;
    }

    /** Velocidade de cruzeiro, sem apertar nenhuma tecla de velocidade. */
    get cruiseSpeed() {
        return 130;
    }

    /** Quão rápido o jet ski chega à velocidade alvo (px/s²). */
    get acceleration() {
        return 200;
    }

    /** Velocidade para subir e descer de raia (px/s). */
    get lateralSpeed() {
        return 240; // muda de raia mais rápido que as outras
    }

    /** Comprimento desenhado na tela (px). */
    get drawLengthValue() {
        return 170;
    }

    /** Rotação do sprite: 0 porque a imagem do jet ski já aponta para a direita. */
    get bowAngle() {
        return 0; // o sprite já aponta para a direita
    }

    /**
     * Polimorfismo: o jet ski desenha, além do sprite, um pequeno
     * espirro de água atrás de si, proporcional à velocidade.
     * Primeiro o espirro (fica atrás), depois o barco por cima (super.draw).
     */
    draw(ctx) {
        this.drawSpray(ctx);
        super.draw(ctx);
    }

    /** Desenha gotas de água atrás do jet ski. Mais velocidade, mais espirro. */
    drawSpray(ctx) {
        // intensity vai de 0 (parado) a 1 (velocidade máxima).
        const intensity = Math.max(0, this.speed) / this.maxSpeed;
        if (intensity <= 0.05) return; // quase parado: não desenha nada

        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * intensity})`;
        const tailX = this.x - this.length / 2; // ponta de trás do jet ski
        for (let i = 0; i < 6; i++) {
            // O deslocamento muda com o tempo, então as gotas parecem se afastar do barco.
            const offset = (this.bobTime * 90 + i * 17) % 40;
            ctx.beginPath();
            ctx.arc(tailX - offset, this.y + (i % 2 ? 6 : -6), 3 + i * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
