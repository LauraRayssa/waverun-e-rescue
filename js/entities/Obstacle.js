/**
 * Obstacle.js
 * PAPEL NO JOGO: representa um obstáculo do mar, que faz o jogador perder
 * se o barco encostar: pedra (da fase 1 em diante) ou boia (da fase 2 em diante).
 *
 * Os desenhos são feitos por código (formas e cores no Canvas), a partir dos
 * obstáculos do projeto WaveRun & Rescue V3 (Rock.js e Buoy.js), e não por imagens.
 */
import { CANVAS_WIDTH } from '../config/Config.js';

/** Tamanho de cada tipo de obstáculo (px). Também é a área de colisão. */
const SIZES = {
    pedra: { width: 92, height: 64 },
    boia: { width: 56, height: 56 },
};

export class Obstacle {
    /**
     * @param {string} type - 'pedra' ou 'boia'.
     * @param {number} x - posição horizontal inicial (centro).
     * @param {number} y - posição vertical dentro da faixa de mar (centro).
     */
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.size = SIZES[type];
    }

    /** Verdadeiro quando o obstáculo saiu da tela pela esquerda ou pela direita (pode ser descartado). */
    get isOffScreen() {
        return this.x < -this.size.width || this.x > CANVAS_WIDTH + 200;
    }

    /** O obstáculo acompanha o movimento do cenário (anda para a esquerda quando o barco avança). */
    update(dt, scrollSpeed) {
        this.x -= scrollSpeed * dt;
    }

    /**
     * Retângulo ocupado pelo obstáculo, usado na colisão.
     * Survivor também tem um getBounds(); o CollisionSystem usa os dois do mesmo jeito.
     */
    getBounds() {
        return {
            x: this.x - this.size.width / 2,
            y: this.y - this.size.height / 2,
            width: this.size.width,
            height: this.size.height,
        };
    }

    /** Desenha o obstáculo. Cada tipo tem o próprio desenho (polimorfismo por tipo). */
    draw(ctx) {
        ctx.save();
        // Move a "origem" do desenho para o centro do obstáculo; assim os métodos
        // abaixo desenham em torno do ponto (0, 0).
        ctx.translate(this.x, this.y);
        if (this.type === 'pedra') this.drawRock(ctx);
        else this.drawBuoy(ctx);
        ctx.restore();
    }

    /** Pedra cinza com faces, sombra na água e um brilho na borda. */
    drawRock(ctx) {
        const w = this.size.width;
        const h = this.size.height;
        const x = -w / 2;
        const y = -h / 2;

        // Sombra escura na água, embaixo da pedra.
        ctx.fillStyle = 'rgba(0, 38, 48, 0.27)';
        ctx.beginPath();
        ctx.ellipse(x + w * 0.54, y + h * 0.88, w * 0.45, h * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Degradê do cinza claro (canto superior) ao escuro (canto inferior).
        const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
        gradient.addColorStop(0, '#9c9c91');
        gradient.addColorStop(0.55, '#616764');
        gradient.addColorStop(1, '#394443');

        // Contorno irregular da pedra, ligando pontos expressos como fração de largura e altura.
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.06, y + h * 0.72);
        ctx.lineTo(x + w * 0.19, y + h * 0.27);
        ctx.lineTo(x + w * 0.44, y + h * 0.04);
        ctx.lineTo(x + w * 0.74, y + h * 0.15);
        ctx.lineTo(x + w * 0.96, y + h * 0.56);
        ctx.lineTo(x + w * 0.78, y + h * 0.94);
        ctx.lineTo(x + w * 0.26, y + h);
        ctx.closePath();
        ctx.fill();

        // Traço claro no topo, que imita o brilho da luz na quina da pedra.
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.17)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.26, y + h * 0.33);
        ctx.lineTo(x + w * 0.47, y + h * 0.14);
        ctx.lineTo(x + w * 0.63, y + h * 0.24);
        ctx.stroke();
    }

    /** Boia laranja com anel branco, sombra e reflexo. */
    drawBuoy(ctx) {
        const r = this.size.width / 2 - 2; // raio da boia

        // Sombra na água (elipse achatada).
        ctx.fillStyle = 'rgba(0, 35, 48, 0.22)';
        ctx.beginPath();
        ctx.ellipse(4, 8, r * 1.08, r * 0.52, 0, 0, Math.PI * 2);
        ctx.fill();

        // Corpo laranja.
        ctx.fillStyle = '#ef7a34';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Miolo claro, que forma o "anel" da boia.
        ctx.fillStyle = '#f8f2dd';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.44, 0, Math.PI * 2);
        ctx.fill();

        // Reflexo: um arco branco no canto superior esquerdo.
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(-3, -3, r * 0.72, Math.PI, Math.PI * 1.55);
        ctx.stroke();
    }
}
