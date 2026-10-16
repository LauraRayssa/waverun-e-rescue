/**
 * Sea.js
 * PAPEL NO JOGO: desenha o cenário do mar: o degradê da água, as ondas
 * animadas, a espuma e a areia.
 *
 * POR QUE POR CÓDIGO: o mar é desenhado com formas no Canvas, sem imagens,
 * para que as ondas mudem de tamanho conforme o estado do clima
 * (calmo, agitado ou tempestade, definidos em SEA_STATES no Config.js).
 */
import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    SEA_TOP,
    SEA_BOTTOM,
    SEA_STATES,
} from '../config/Config.js';

// A areia começa um pouco abaixo do fim da faixa navegável.
const SAND_TOP = SEA_BOTTOM + 10;
const SAND_COLOR = '#e8d59c';

export class Sea {
    constructor() {
        this.stateName = 'calmo';
        this.offset = 0; // deslocamento das ondas, cresce com a velocidade do cenário
        this.time = 0;   // tempo total acumulado
    }

    /** Troca o estado do mar (calmo, agitado ou tempestade). */
    setSeaState(stateName) {
        this.stateName = stateName;
    }

    /** Configuração visual do estado atual (cores, ondas...). */
    get state() {
        return SEA_STATES[this.stateName];
    }

    /** Altura das ondas no estado atual (usada também no balanço das embarcações). */
    get waveAmplitude() {
        return this.state.waveAmplitude;
    }

    /**
     * Atualiza o movimento das ondas.
     * @param {number} dt - tempo desde o quadro anterior (s).
     * @param {number} scrollSpeed - velocidade do cenário (px/s).
     */
    update(dt, scrollSpeed) {
        this.time += dt;
        this.offset += scrollSpeed * dt;
    }

    /** Desenha o céu (faixa do HUD), a água, as ondas, a areia e a espuma, nessa ordem. */
    draw(ctx) {
        this.drawSky(ctx);
        this.drawWater(ctx);
        this.drawWaves(ctx);
        this.drawSand(ctx);
        this.drawFoam(ctx);
    }

    /** Faixa azul-clara no topo, por trás do HUD. */
    drawSky(ctx) {
        ctx.fillStyle = '#9edcec';
        ctx.fillRect(0, 0, CANVAS_WIDTH, SEA_TOP);
    }

    /** Água com degradê vertical: mais clara no alto e mais escura no fundo. */
    drawWater(ctx) {
        const gradient = ctx.createLinearGradient(0, SEA_TOP, 0, SAND_TOP);
        gradient.addColorStop(0, this.state.topColor);
        gradient.addColorStop(0.52, this.state.midColor);
        gradient.addColorStop(1, this.state.bottomColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, SEA_TOP, CANVAS_WIDTH, SAND_TOP - SEA_TOP);
    }

    /**
     * Ondas: pequenas curvas brancas espalhadas pela água. Elas andam na
     * direção contrária ao avanço do barco, como no projeto V3.
     */
    drawWaves(ctx) {
        const { rippleCount, rippleLift } = this.state;
        const period = CANVAS_WIDTH + 200;
        // Resto da divisão que nunca fica negativo (o "%" do JavaScript pode ficar).
        const mod = (v, m) => ((v % m) + m) % m;

        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(239, 253, 255, 0.18)';
        for (let i = 0; i < rippleCount; i++) {
            // Cada onda anda numa velocidade um pouco diferente, o que dá sensação de profundidade.
            const speed = 0.65 + (i % 4) * 0.08;
            const x = mod(i * 173 - this.offset * speed, period) - 100;
            const y = SEA_TOP + 20 + ((i * 37) % (SAND_TOP - SEA_TOP - 40));
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + 44, y - rippleLift, x + 96, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    /** Espuma nas bordas superior (perto do HUD) e inferior (areia). */
    drawFoam(ctx) {
        const lift = this.state.rippleLift * 0.5;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.58)';
        ctx.lineWidth = 3;
        // Duas linhas de espuma: [altura base, velocidade da ondulação].
        for (const [baseY, speed] of [[SEA_TOP, 15], [SAND_TOP, 11]]) {
            ctx.beginPath();
            for (let x = 0; x <= CANVAS_WIDTH; x += 22) {
                // O seno cria a ondulação da linha de espuma.
                const y = baseY + Math.sin((x + this.offset * speed / 10) * 0.015) * lift;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    /** Areia da praia, na parte de baixo da tela. */
    drawSand(ctx) {
        ctx.fillStyle = SAND_COLOR;
        ctx.fillRect(0, SAND_TOP, CANVAS_WIDTH, CANVAS_HEIGHT - SAND_TOP);
    }
}
