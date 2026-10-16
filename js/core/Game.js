/**
 * Game.js
 * PAPEL NO JOGO: é o "maestro". Coordena a partida inteira: estados
 * (menu, jogando, pausado, derrota, vitória), fases e sistemas.
 *
 * O Game não sabe desenhar uma pedra nem como o jet ski
 * anda; ele só manda cada parte fazer o seu trabalho na hora certa. É a única
 * classe que conhece todas as outras. As demais se comunicam por ele ou por
 * eventos que devolvem (por exemplo, o RescueSystem avisa "alguém foi resgatado").
 *
 * FLUXO DE UMA PARTIDA:
 *   jet ski (fase 1) -> lancha (fase 2) -> navio (fase 3) -> vitória
 *   Bater em um obstáculo, ou deixar o tempo de resgate acabar, leva à
 *   derrota (Game Over). Lotar o navio leva à vitória.
 *
 * CONCEITO DE POO: o Game usa POLIMORFISMO. Ele guarda "this.vehicle" e chama
 * update() e draw() sem saber se é um JetSki, uma Lancha ou um Navio.
 */
import {
    CANVAS_WIDTH,
    PX_TO_METERS,
    MAX_FRAME_TIME,
    NAVIO_WEATHER,
} from '../config/Config.js';
import { JetSki } from '../entities/JetSki.js';
import { Lancha } from '../entities/Lancha.js';
import { Navio } from '../entities/Navio.js';
import { RescueSystem } from '../systems/RescueSystem.js';
import { ObstacleSystem } from '../systems/ObstacleSystem.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { Sea } from '../environment/Sea.js';
import { Weather } from '../environment/Weather.js';

/** Os cinco momentos em que o jogo pode estar. Só um vale de cada vez. */
export const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameover',
    VICTORY: 'victory',
};

export class Game {
    /**
     * @param {object} deps - dependências injetadas pelo main.js (já criadas fora).
     * @param {HTMLCanvasElement} deps.canvas
     * @param {object} deps.assets - imagens já carregadas (ver main.js)
     * @param {import('./InputManager.js').InputManager} deps.input
     * @param {import('../ui/HUD.js').HUD} deps.hud
     * @param {import('../ui/PopupManager.js').PopupManager} deps.popups
     * @param {import('../ui/ScreenManager.js').ScreenManager} deps.screens
     */
    constructor({ canvas, assets, input, hud, popups, screens }) {
        // "ctx" é o pincel do Canvas: tudo o que aparece no jogo é desenhado com ele.
        this.ctx = canvas.getContext('2d');
        this.assets = assets;
        this.input = input;
        this.hud = hud;
        this.popups = popups;
        this.screens = screens;

        // Composição: o Game "tem" um mar, um clima e os sistemas de regras.
        this.sea = new Sea();
        this.weather = new Weather();
        this.progression = new ProgressionSystem();
        this.rescues = new RescueSystem(assets.survivors);
        this.obstacles = new ObstacleSystem();

        this.state = GAME_STATES.MENU;
        this.reset();
    }

    // Controle de partida

    /** Volta tudo para o começo de uma partida (jet ski com 1 ocupante, o condutor). */
    reset() {
        this.progression.reset();
        const phase = this.progression.phase;

        this.vehicle = this.createVehicle('jetski', 1);
        this.rescueTimer = this.vehicle.rescueTimeLimit;
        this.rescues.reset();
        this.obstacles.reset();
        this.rescues.configure(phase);
        this.obstacles.configure(phase);
        this.sea.setSeaState(phase.seaState);
        this.weather.setWeatherState(phase.seaState);

        this.distanceMeters = 0;
        this.maxSpeedKmh = 0;
        this.navioWeatherIndex = 0; // etapa do clima durante o navio (ver NAVIO_WEATHER)
        // Fases cujo aviso "primeiro resgate" já foi mostrado (para não repetir).
        this.announcedPhases = new Set();
        this.collisionEnabled = true;
        this.updateHud();
    }

    /** Inicia uma nova partida a partir do menu, de uma derrota ou de uma vitória. */
    start() {
        this.reset();
        this.state = GAME_STATES.PLAYING;
        this.screens.hideAll();
        this.hud.show();
        this.popups.show(this.progression.phase.popupKey);
    }

    /** Pausa a partida (botão de pausa ou tecla P/Esc). */
    pause() {
        if (this.state !== GAME_STATES.PLAYING) return;
        this.state = GAME_STATES.PAUSED;
        this.popups.hide();
        this.screens.show('pause');
    }

    /** Continua a partida pausada. */
    resume() {
        if (this.state !== GAME_STATES.PAUSED) return;
        this.state = GAME_STATES.PLAYING;
        this.screens.hideAll();
    }

    /** Alterna entre pausado e jogando (tecla P ou Esc). */
    togglePause() {
        if (this.state === GAME_STATES.PLAYING) this.pause();
        else if (this.state === GAME_STATES.PAUSED) this.resume();
    }

    /** Volta ao menu inicial e deixa uma partida nova pronta por trás. */
    goToMenu() {
        this.state = GAME_STATES.MENU;
        this.hud.hide();
        this.popups.hide();
        this.screens.show('menu');
        this.reset();
    }

    // Loop: atualização e desenho

    /**
     * Atualiza a lógica do jogo. É chamado a cada quadro pelo GameLoop.
     * @param {number} dt - tempo desde o quadro anterior (s).
     */
    update(dt) {
        // Fora do estado "jogando" (menu, pausa, fim) nada se move.
        if (this.state !== GAME_STATES.PLAYING) return;

        // Math.min com MAX_FRAME_TIME evita um salto gigante se o navegador travar um instante.
        this.updateSailing(Math.min(dt, MAX_FRAME_TIME));
        this.popups.update(Math.min(dt, MAX_FRAME_TIME));
        this.updateHud();
    }

    /** Lógica de navegação: movimento, resgates, obstáculos, tempo e colisões. */
    updateSailing(dt) {
        // 1) Move a embarcação. Aqui há polimorfismo: cada tipo se move do seu jeito.
        const vehicle = this.vehicle;
        vehicle.setSeaAmplitude(this.sea.waveAmplitude);
        vehicle.update(dt, this.input.snapshot());

        // 2) A velocidade do barco vira a velocidade com que o cenário "rola".
        const scrollSpeed = vehicle.speed;
        if (scrollSpeed > 0) {
            this.distanceMeters += scrollSpeed * dt * PX_TO_METERS;
        }
        this.maxSpeedKmh = Math.max(this.maxSpeedKmh, this.speedKmh);

        // 3) Atualiza o cenário, o clima, os obstáculos e as pessoas na água.
        this.sea.update(dt, scrollSpeed);
        this.weather.update(dt);
        this.obstacles.update(dt, scrollSpeed, this.rescues.survivors);

        const events = this.rescues.update(dt, scrollSpeed, vehicle, this.obstacles.obstacles);
        for (const event of events) {
            this.handleRescueEvent(event);
        }

        // Regra de tempo: sem resgatar a tempo, a partida termina.
        this.rescueTimer -= dt;
        if (this.rescueTimer <= 0) {
            this.gameOver('tempo');
            return;
        }

        // Regra de derrota: bater em um obstáculo termina a partida.
        if (this.collisionEnabled && CollisionSystem.boatHitsObstacle(vehicle, this.obstacles.obstacles)) {
            this.gameOver();
            return;
        }

        // Regra de evolução: embarcação cheia muda de veículo, ou vence no navio.
        if (this.progression.shouldEvolve(vehicle)) {
            this.onVehicleFull();
        }
    }

    /** Desenha o cenário e as entidades, do fundo para a frente (a ordem importa). */
    render() {
        const ctx = this.ctx;
        // Apaga o quadro anterior; depois desenhamos tudo de novo.
        ctx.clearRect(0, 0, CANVAS_WIDTH, this.ctx.canvas.height);

        this.sea.draw(ctx);        // fundo: céu, água, ondas e areia
        this.obstacles.draw(ctx);  // pedras e boias
        this.rescues.draw(ctx);    // pessoas na água
        this.vehicle.draw(ctx);    // o barco, por cima da água
        this.weather.draw(ctx);    // chuva e escurecimento, por cima de tudo
    }

    // Eventos do jogo

    /** Trata os avisos do RescueSystem: o clima do navio e o pop-up da primeira pessoa de cada fase. */
    handleRescueEvent(event) {
        if (event.type === 'rescued') {
            // O tempo de resgate NÃO reinicia a cada pessoa: continua de onde estava.
            // Só reinicia quando a embarcação evolui (ver onVehicleFull).
            this.updateNavioWeather();
        }
        if (event.type === 'spawn') {
            const phaseIndex = this.progression.phaseIndex;
            if (!this.announcedPhases.has(phaseIndex)) {
                this.announcedPhases.add(phaseIndex);
                this.popups.show('resgate');
            }
        }
    }

    /**
     * No navio, o clima muda conforme a ocupação (ver NAVIO_WEATHER em Config.js):
     * começa em tempestade, com 25 pessoas a bordo o mar fica agitado
     * e com 30 volta a ficar calmo.
     */
    updateNavioWeather() {
        if (this.vehicle.key !== 'navio') return;

        // Descobre em qual etapa do clima a ocupação atual se encaixa.
        let index = 0;
        NAVIO_WEATHER.forEach((step, i) => {
            if (this.vehicle.occupants >= step.occupants) index = i;
        });
        // Se continua na mesma etapa, não há nada a mudar.
        if (index === this.navioWeatherIndex) return;

        this.navioWeatherIndex = index;
        const step = NAVIO_WEATHER[index];
        this.sea.setSeaState(step.seaState);
        this.weather.setWeatherState(step.seaState);
        this.popups.show(step.popupKey);
    }

    /**
     * Embarcação cheia: troca para a próxima (mantendo os passageiros)
     * e mostra os pop-ups de evolução e de clima. Lotar o navio dá a vitória.
     */
    onVehicleFull() {
        if (this.progression.isLastPhase) {
            this.victory();
            return;
        }

        const previous = this.vehicle;
        const nextPhase = this.progression.advance();
        // A nova embarcação herda os ocupantes da anterior.
        const next = this.createVehicle(nextPhase.vehicleKey, previous.occupants);
        next.x = previous.x;
        next.y = previous.y; // a nova embarcação nasce no mesmo lugar onde a anterior estava
        next.speed = previous.speed;
        this.vehicle = next;
        this.rescueTimer = next.rescueTimeLimit; // a nova embarcação tem o seu próprio tempo
        this.navioWeatherIndex = 0;

        // Ajusta pessoas, obstáculos, mar e clima para a nova fase.
        this.rescues.configure(nextPhase);
        this.obstacles.configure(nextPhase);
        this.sea.setSeaState(nextPhase.seaState);
        this.weather.setWeatherState(nextPhase.seaState);

        // Descarta pop-ups antigos ainda na fila (ex.: "Mar calmo" depois de já estar
        // na tempestade). Sem isso, o jogador lê informações de uma fase anterior.
        this.popups.hide();
        this.popups.playEvolutionEffect();
        this.popups.show(`evolucao-${nextPhase.vehicleKey}`);
        this.popups.show(nextPhase.popupKey);
    }

    /** Derrota: colisão com obstáculo ou tempo de resgate esgotado. */
    gameOver(reason = 'colisao') {
        this.gameOverReason = reason;
        this.state = GAME_STATES.GAME_OVER;
        this.hud.hide();
        this.popups.hide();
        this.screens.showGameOver(this.getStats());
    }

    /** Vitória: o navio lotou (40 ocupantes). Vai direto para a tela final. */
    victory() {
        this.state = GAME_STATES.VICTORY;
        this.hud.hide();
        this.popups.hide();
        this.screens.showVictory(this.getStats());
    }

    // Dados para a interface

    /**
     * Fábrica de embarcações: devolve o objeto certo a partir da chave.
     * Cada classe (JetSki, Lancha, Navio) traz as suas próprias regras.
     */
    createVehicle(key, occupants) {
        const image = this.assets.vehicles[key];
        switch (key) {
            case 'jetski':
                return new JetSki(image, occupants);
            case 'lancha':
                return new Lancha(image, occupants);
            case 'navio':
                return new Navio(image, occupants);
            default:
                throw new Error(`Embarcação desconhecida: ${key}`);
        }
    }

    /** Velocidade atual em km/h (convertida a partir de px/s). */
    get speedKmh() {
        // Fica negativa quando o barco dá ré (o HUD mostra "Ré").
        return this.vehicle.speed * PX_TO_METERS * 3.6;
    }

    /** Pessoas resgatadas até agora. O condutor também é ocupante, mas não conta como resgatado. */
    get rescuedCount() {
        return this.vehicle.occupants - 1;
    }

    /** Resumo da partida, usado nas telas de derrota e de vitória. */
    getStats() {
        return {
            reason: this.gameOverReason,
            distanceKm: this.distanceMeters / 1000,
            rescued: this.rescuedCount,
            maxSpeedKmh: this.maxSpeedKmh,
            phaseReached: this.progression.phaseIndex + 1,
            vehicleKey: this.vehicle.key,
            vehicleName: this.vehicle.name,
        };
    }

    /** Envia os valores atuais para a barra superior (HUD). */
    updateHud() {
        this.hud.update({
            timeLeft: Math.max(0, this.rescueTimer),
            distanceKm: this.distanceMeters / 1000,
            rescued: this.rescuedCount,
            speedKmh: this.speedKmh,
            occupancy: this.vehicle.occupants,
            capacity: this.vehicle.capacity,
        });
    }
}
