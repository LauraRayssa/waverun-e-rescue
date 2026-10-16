/**
 * ProgressionSystem.js
 * PAPEL NO JOGO: controla em qual fase o jogador está e quando a
 * embarcação deve evoluir (jet ski -> lancha -> navio).
 *
 * REGRA PRINCIPAL: o veículo evolui somente quando atinge a capacidade
 * máxima (incluindo o condutor). Os passageiros continuam contados na
 * embarcação seguinte, então a ocupação nunca é zerada.
 *
 * As informações de cada fase (mar, obstáculos, intervalos) ficam em
 * PHASES, no Config.js; esta classe só guarda "em qual fase estamos".
 */
import { PHASES } from '../config/Config.js';

export class ProgressionSystem {
    constructor() {
        this.phaseIndex = 0; // 0 = jet ski, 1 = lancha, 2 = navio
    }

    /** Volta para a primeira fase (jet ski). */
    reset() {
        this.phaseIndex = 0;
    }

    /** Dados da fase atual (ver PHASES em Config.js). */
    get phase() {
        return PHASES[this.phaseIndex];
    }

    /** Verdadeiro na última fase (navio). */
    get isLastPhase() {
        return this.phaseIndex === PHASES.length - 1;
    }

    /** Verdadeiro quando a embarcação atual está cheia e deve evoluir ou encerrar. */
    shouldEvolve(vehicle) {
        return vehicle.isFull();
    }

    /** Avança para a próxima fase. Retorna os dados da nova fase. */
    advance() {
        // Na última fase não há para onde avançar; o índice fica onde está.
        if (!this.isLastPhase) {
            this.phaseIndex += 1;
        }
        return this.phase;
    }
}
