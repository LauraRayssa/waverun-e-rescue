/**
 * ScreenManager.js
 * PAPEL NO JOGO: controla as telas que ficam por cima do jogo: menu,
 * como jogar, créditos, pausa, Game Over e vitória.
 *
 * COMO FUNCIONA: cada tela é uma <section> no index.html. Esta classe só
 * MOSTRA e ESCONDE as telas (trocando a classe CSS "active") e preenche os
 * números das telas finais. A lógica do jogo fica no Game.
 */

/** Ordem dos ícones de veículo na tela de derrota (a mesma ordem das fases). */
const VEHICLE_ORDER = ['jetski', 'lancha', 'navio'];

/** Texto explicando por que a partida terminou. */
const GAME_OVER_REASONS = {
    colisao: 'Você bateu em um obstáculo.',
    tempo: 'O tempo para resgatar acabou.',
};

export class ScreenManager {
    /** @param {Document} doc - a página, de onde buscamos os elementos pelo id. */
    constructor(doc) {
        this.doc = doc;
        // Todas as telas, guardadas por nome para facilitar show("menu"), show("pause")...
        this.screens = {
            menu: doc.getElementById('screen-menu'),
            howto: doc.getElementById('screen-howto'),
            credits: doc.getElementById('screen-credits'),
            pause: doc.getElementById('screen-pause'),
            gameover: doc.getElementById('screen-gameover'),
            victory: doc.getElementById('screen-victory'),
        };
        // Campos de texto da tela de Game Over.
        this.gameOverKm = doc.getElementById('go-km');
        this.gameOverReason = doc.getElementById('go-reason');
        this.gameOverRescued = doc.getElementById('go-rescued');
        this.gameOverSpeed = doc.getElementById('go-speed');
        this.gameOverVehicle = doc.getElementById('go-vehicle');
        this.gameOverVehicleIcons = VEHICLE_ORDER.map((key) => doc.getElementById(`go-icon-${key}`));

        // Campos de texto da tela de vitória.
        this.victoryKm = doc.getElementById('vic-km');
        this.victoryRescued = doc.getElementById('vic-rescued');
        this.victorySpeed = doc.getElementById('vic-speed');
    }

    /** Mostra apenas a tela indicada (as outras são escondidas). */
    show(name) {
        this.hideAll();
        this.screens[name].classList.add('active');
    }

    /** Esconde todas as telas (a partida aparece sem sobreposição). */
    hideAll() {
        for (const screen of Object.values(this.screens)) {
            screen.classList.remove('active');
        }
    }

    /**
     * Tela de derrota: preenche os números e destaca as fases alcançadas.
     * @param {{distanceKm:number, rescued:number, maxSpeedKmh:number, phaseReached:number, vehicleName:string}} stats
     */
    showGameOver(stats) {
        this.gameOverKm.textContent = `${stats.distanceKm.toFixed(1).replace('.', ',')} km`;
        // "??" usa o texto vazio se o motivo for desconhecido.
        this.gameOverReason.textContent = GAME_OVER_REASONS[stats.reason] ?? '';
        this.gameOverRescued.textContent = String(stats.rescued);
        this.gameOverSpeed.textContent = String(Math.round(stats.maxSpeedKmh));
        this.gameOverVehicle.textContent = `Veículo final: ${stats.vehicleName}`;

        // Ícones: fases alcançadas ficam claras; as demais ficam apagadas.
        // Ex.: se chegou à lancha (fase 2), jet ski e lancha acendem e o navio fica apagado.
        this.gameOverVehicleIcons.forEach((icon, index) => {
            icon.classList.toggle('reached', index < stats.phaseReached);
        });

        this.show('gameover');
    }

    /**
     * Tela de vitória: quanto o navio andou, pessoas resgatadas e velocidade máxima.
     * @param {{distanceKm:number, rescued:number, maxSpeedKmh:number}} stats
     */
    showVictory(stats) {
        this.victoryKm.textContent = `${stats.distanceKm.toFixed(1).replace('.', ',')} km`;
        this.victoryRescued.textContent = String(stats.rescued);
        this.victorySpeed.textContent = `${Math.round(stats.maxSpeedKmh)} km/h`;
        this.show('victory');
    }
}
