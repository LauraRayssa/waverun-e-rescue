/**
 * ObstacleSystem.js
 * PAPEL NO JOGO: cria, move e remove os obstáculos do mar (pedras e boias).
 * A fase define quais tipos aparecem e com que frequência.
 *
 * Esta classe só cuida da LISTA de obstáculos. Quem decide se o barco bateu
 * em algum é o CollisionSystem.
 */
import { Obstacle } from '../entities/Obstacle.js';
import { CANVAS_WIDTH, SEA_TOP, SEA_BOTTOM } from '../config/Config.js';
import { CollisionSystem } from './CollisionSystem.js';

export class ObstacleSystem {
    constructor() {
        this.obstacles = []; // obstáculos que estão na tela agora
        this.configure({ obstacleTypes: ['pedra'], obstacleInterval: 2.6 });
    }

    /**
     * Ajusta os tipos e a frequência de obstáculos conforme a fase.
     * @param {{obstacleTypes:string[], obstacleInterval:number}} phase
     */
    configure(phase) {
        this.types = phase.obstacleTypes;
        this.interval = phase.obstacleInterval;
        this.timer = 1.5; // primeiro obstáculo aparece logo no início
    }

    /** Limpa todos os obstáculos, usado ao reiniciar a partida. */
    reset() {
        this.obstacles = [];
    }

    /**
     * Atualiza os obstáculos a cada quadro.
     * @param {number} dt - tempo desde o quadro anterior (s).
     * @param {number} scrollSpeed - velocidade do cenário (px/s).
     * @param {Array} people - pessoas na água; os obstáculos evitam nascer em cima delas.
     */
    update(dt, scrollSpeed, people = []) {
        this.trySpawn(dt, people);

        for (const obstacle of this.obstacles) {
            obstacle.update(dt, scrollSpeed);
        }
        // Descarta os que já saíram da tela, para a lista não crescer sem parar.
        this.obstacles = this.obstacles.filter((obstacle) => !obstacle.isOffScreen);
    }

    /** Cria um obstáculo de um tipo sorteado entre os permitidos na fase. */
    trySpawn(dt, people) {
        this.timer -= dt;
        if (this.timer > 0) return;

        // O obstáculo nasce logo depois da borda direita da tela, em uma altura livre.
        const x = CANVAS_WIDTH + 60;
        const y = CollisionSystem.pickFreeY(
            x,
            [...this.obstacles, ...people],
            SEA_TOP + 50,
            SEA_BOTTOM - 50,
            12,
            150, // folga vertical grande: entre duas pedras sobra passagem para o navio
        );
        if (y === null) return; // sem espaço livre agora: tenta de novo no próximo quadro

        this.timer = this.interval;
        const type = this.types[Math.floor(Math.random() * this.types.length)];
        this.obstacles.push(new Obstacle(type, x, y));
    }

    /** Desenha todos os obstáculos ativos. A colisão é verificada no CollisionSystem. */
    draw(ctx) {
        for (const obstacle of this.obstacles) {
            obstacle.draw(ctx);
        }
    }
}
