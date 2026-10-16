/**
 * RescueSystem.js
 * PAPEL NO JOGO: cuida das pessoas na água. Cria, move e confirma os resgates.
 *
 * REGRAS:
 *  - só aparecem novas pessoas quando há vaga na embarcação;
 *  - uma pessoa só é resgatada se a embarcação tiver lugar livre;
 *  - cada pessoa é resgatada no máximo uma vez.
 *
 * COMO SE COMUNICA: o método update() devolve uma lista de "eventos" (por
 * exemplo, "alguém foi resgatado"). O Game lê essa lista e decide o que fazer
 * (mostrar pop-up, mudar o clima...). Assim o RescueSystem não precisa
 * conhecer o Game.
 */
import { Survivor } from '../entities/Survivor.js';
import { CollisionSystem } from './CollisionSystem.js';
import { CANVAS_WIDTH, SEA_TOP, SEA_BOTTOM } from '../config/Config.js';

export class RescueSystem {
    /**
     * @param {HTMLImageElement[]} images - sprites das pessoas na água.
     */
    constructor(images) {
        this.images = images;
        this.survivors = [];      // pessoas ainda na água
        this.configure({ survivorInterval: 3, maxSurvivors: 1 });
    }

    /**
     * Ajusta a frequência e o número máximo de pessoas conforme a fase.
     * @param {{survivorInterval:number, maxSurvivors:number}} phase
     */
    configure(phase) {
        this.interval = phase.survivorInterval;
        this.maxActive = phase.maxSurvivors;
        this.timer = 3.0; // tempo de espera no início, antes da primeira pessoa
    }

    /** Limpa todas as pessoas, usado ao reiniciar a partida. */
    reset() {
        this.survivors = [];
    }

    /**
     * Atualiza as pessoas na água a cada quadro.
     * @param {number} dt - tempo desde o quadro anterior (s).
     * @param {number} scrollSpeed - velocidade do cenário (px/s).
     * @param {import('../entities/Vehicle.js').Vehicle} vehicle
     * @returns {Array<{type:'spawn'}|{type:'rescued', survivor: Survivor}>}
     *          Eventos deste quadro. O Game usa para mostrar pop-ups e contar.
     */
    update(dt, scrollSpeed, vehicle, obstacles = []) {
        const events = [];

        // 1) Talvez nasça uma pessoa nova.
        this.trySpawn(dt, vehicle, events, obstacles);

        // 2) Todas as pessoas acompanham o cenário.
        for (const survivor of this.survivors) {
            survivor.update(dt, scrollSpeed);
        }

        // 3) Resgate: confere cada pessoa contra a embarcação.
        for (const survivor of this.survivors) {
            if (survivor.isRescued) continue;
            if (!vehicle.hasSpace()) break; // sem vaga, ninguém é resgatado
            if (CollisionSystem.canRescue(vehicle, survivor)) {
                survivor.markRescued();
                vehicle.addOccupant();
                events.push({ type: 'rescued', survivor });
            }
        }

        // 4) Remove quem foi resgatado ou saiu da tela.
        this.survivors = this.survivors.filter(
            (survivor) => !survivor.isRescued && !survivor.isOffScreen,
        );
        return events;
    }

    /** Cria uma nova pessoa quando o tempo passou e ainda há vaga. */
    trySpawn(dt, vehicle, events, obstacles) {
        this.timer -= dt;
        // Só nasce gente se o limite da fase não foi atingido e o barco ainda tem lugar.
        const canSpawn = this.survivors.length < this.maxActive && vehicle.hasSpace();
        if (this.timer > 0 || !canSpawn) return;

        // A pessoa nasce logo depois da borda direita da tela, em uma altura livre.
        const x = CANVAS_WIDTH + 40;
        const y = CollisionSystem.pickFreeY(
            x,
            [...obstacles, ...this.survivors],
            SEA_TOP + 60,
            SEA_BOTTOM - 60,
        );
        if (y === null) return; // espaço ocupado: tenta de novo no próximo quadro

        this.timer = this.interval;
        // Sorteia uma das imagens de pessoa.
        const image = this.images[Math.floor(Math.random() * this.images.length)];
        this.survivors.push(new Survivor(image, x, y));
        events.push({ type: 'spawn' });
    }

    /** Desenha todas as pessoas na água. */
    draw(ctx) {
        for (const survivor of this.survivors) {
            survivor.draw(ctx);
        }
    }
}
