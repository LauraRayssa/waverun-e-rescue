/**
 * Weather.js
 * PAPEL NO JOGO: cuida dos efeitos de clima: a chuva e o escurecimento da tela.
 *
 * COMO FUNCIONA: na tempestade, a chuva é criada continuamente (uma
 * "gota" é um pequeno objeto com posição e velocidade). O escurecimento
 * sobe suavemente até o valor do estado atual, sem corte brusco.
 * Os valores de chuva e escurecimento de cada estado ficam em SEA_STATES (Config.js).
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT, SEA_STATES } from '../config/Config.js';

export class Weather {
    constructor() {
        this.stateName = 'calmo';
        this.drops = [];        // gotas de chuva ativas
        this.darkness = 0;      // opacidade atual do escurecimento
        this.rainBudget = 0;    // acumulador para criar gotas de forma contínua
    }

    /** Troca o clima (calmo, agitado ou tempestade). */
    setWeatherState(stateName) {
        this.stateName = stateName;
    }

    /** Configuração do clima atual. */
    get state() {
        return SEA_STATES[this.stateName];
    }

    /**
     * Atualiza gotas e escurecimento.
     * @param {number} dt - tempo desde o quadro anterior (s).
     */
    update(dt) {
        // Escurecimento suave: a cada quadro, anda uma fração do caminho até o valor alvo.
        const targetDarkness = this.state.darkness;
        this.darkness += (targetDarkness - this.darkness) * Math.min(1, dt * 1.5);

        // Cria gotas conforme a taxa de chuva do estado. O "budget" acumula frações
        // de gota; cada vez que passa de 1, nasce uma gota inteira.
        this.rainBudget += this.state.rainRate * dt;
        while (this.rainBudget >= 1) {
            this.rainBudget -= 1;
            this.drops.push({
                x: Math.random() * (CANVAS_WIDTH + 200),
                y: -20,
                speed: 700 + Math.random() * 300,
                length: 14 + Math.random() * 10,
            });
        }

        // Move as gotas e remove as que saíram da tela.
        for (const drop of this.drops) {
            drop.y += drop.speed * dt;
            drop.x -= drop.speed * dt * 0.25; // leve inclinação pelo vento
        }
        this.drops = this.drops.filter((drop) => drop.y < CANVAS_HEIGHT);
    }

    /** Desenha o escurecimento e a chuva por cima do cenário. */
    draw(ctx) {
        // Véu escuro sobre a tela inteira (só se for perceptível).
        if (this.darkness > 0.01) {
            ctx.fillStyle = `rgba(4, 20, 36, ${this.darkness})`;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        // Sem gotas, não há mais o que desenhar.
        if (this.drops.length === 0) return;
        ctx.save();
        ctx.strokeStyle = 'rgba(200, 235, 255, 0.55)';
        ctx.lineWidth = 2;
        for (const drop of this.drops) {
            // Cada gota é um pequeno traço inclinado.
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x + drop.length * 0.25, drop.y + drop.length);
            ctx.stroke();
        }
        ctx.restore();
    }
}
