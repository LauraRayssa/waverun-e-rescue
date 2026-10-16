/**
 * HUD.js
 * PAPEL NO JOGO: é a barra superior do jogo (HUD = "heads-up display"):
 * distância, resgates, velocidade, tempo restante, ocupação e botão de pausa.
 *
 * COMO FUNCIONA: o HUD só EXIBE valores recebidos do Game. Não calcula nada
 * por conta própria, assim os números sempre correspondem ao estado real da
 * partida. Os elementos (<span>) ficam no index.html; aqui só trocamos o texto.
 */
export class HUD {
    /** @param {Document} doc - a página, de onde buscamos os elementos pelo id. */
    constructor(doc) {
        this.root = doc.getElementById('hud');
        this.kmEl = doc.getElementById('hud-km');
        this.rescuedEl = doc.getElementById('hud-rescued');
        this.speedEl = doc.getElementById('hud-speed');
        this.occupancyEl = doc.getElementById('hud-occupancy');
        this.timerEl = doc.getElementById('hud-timer');
    }

    /** Mostra a barra (durante a partida). */
    show() {
        this.root.classList.remove('hidden');
    }

    /** Esconde a barra (menu, pausa e telas finais). */
    hide() {
        this.root.classList.add('hidden');
    }

    /**
     * Atualiza todos os valores do HUD.
     * @param {{distanceKm:number, rescued:number, speedKmh:number, occupancy:number, capacity:number, timeLeft:number}} data
     */
    update({ distanceKm, rescued, speedKmh, occupancy, capacity, timeLeft }) {
        // Número com uma casa decimal e vírgula, como no padrão brasileiro.
        this.kmEl.textContent = `${distanceKm.toFixed(1).replace('.', ',')} km`;
        // Singular ou plural: "1 resgate", "2 resgates".
        this.rescuedEl.textContent = `${rescued} ${rescued === 1 ? 'resgate' : 'resgates'}`;
        // Velocidade negativa = ré: mostra "Ré" com o valor absoluto.
        const kmh = Math.round(speedKmh);
        this.speedEl.textContent = kmh < 0 ? `Ré ${Math.abs(kmh)} km/h` : `${kmh} km/h`;
        this.occupancyEl.textContent = `${occupancy}/${capacity}`;

        // Tempo restante para lotar a embarcação, no formato m:ss (ex.: 1:05).
        const seconds = Math.ceil(timeLeft);
        this.timerEl.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    }
}
