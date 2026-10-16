/**
 * main.js
 * PAPEL NO JOGO: é a "porta de entrada". É o único arquivo que o
 * index.html carrega; todo o resto é importado a partir daqui.
 *
 * EM PALAVRAS SIMPLES: antes de o jogo começar, este arquivo
 *   1. carrega as imagens (jet ski, lancha, navio e pessoas);
 *   2. cria os objetos principais (tela, HUD, pop-ups, teclado, jogo);
 *   3. liga os botões do HTML às ações do jogo;
 *   4. liga o "motor" (GameLoop), que desenha um quadro depois do outro.
 *
 * COMO ABRIR O JOGO: pelo link do GitHub Pages ou por um servidor local.
 * Os módulos ES6 (import/export) não funcionam com duplo clique no
 * index.html; veja o README.
 */
import { Game } from './core/Game.js';
import { GameLoop } from './core/GameLoop.js';
import { InputManager } from './core/InputManager.js';
import { HUD } from './ui/HUD.js';
import { PopupManager } from './ui/PopupManager.js';
import { ScreenManager } from './ui/ScreenManager.js';

/** Caminhos de todas as imagens que o jogo precisa carregar. */
const ASSET_PATHS = {
    vehicles: {
        jetski: 'assets/vehicles/jetski.png',
        lancha: 'assets/vehicles/lancha.png',
        navio: 'assets/vehicles/navio.png',
    },
    // Cinco pessoas diferentes; o RescueSystem sorteia uma a cada nascimento.
    survivors: [
        'assets/survivors/survivor-1.png',
        'assets/survivors/survivor-2.png',
        'assets/survivors/survivor-3.png',
        'assets/survivors/survivor-4.png',
        'assets/survivors/survivor-5.png',
    ],
};

/**
 * Carrega uma imagem e devolve uma Promise, que é uma "promessa de entrega":
 * ela só se resolve quando a imagem terminou de carregar.
 * @param {string} src - caminho do arquivo da imagem.
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Não foi possível carregar ${src}`));
        image.src = src;
    });
}

/**
 * Carrega todas as imagens de uma vez e só continua quando todas chegarem.
 * Assim o jogo nunca tenta desenhar uma imagem que ainda não existe.
 */
async function loadAssets() {
    const [jetski, lancha, navio, survivors] = await Promise.all([
        loadImage(ASSET_PATHS.vehicles.jetski),
        loadImage(ASSET_PATHS.vehicles.lancha),
        loadImage(ASSET_PATHS.vehicles.navio),
        Promise.all(ASSET_PATHS.survivors.map(loadImage)),
    ]);
    return {
        vehicles: { jetski, lancha, navio },
        survivors,
    };
}

/**
 * Executa a ação de um botão. No HTML, cada botão tem um atributo
 * data-action (por exemplo, data-action="play"); aqui traduzimos esse
 * texto para o método certo do jogo.
 */
function runAction(action, game, screens) {
    switch (action) {
        case 'play':
            game.start();
            break;
        case 'howto':
            screens.show('howto');
            break;
        case 'credits':
            screens.show('credits');
            break;
        case 'menu':
            game.goToMenu();
            break;
        case 'pause':
            game.pause();
            break;
        case 'resume':
            game.resume();
            break;
        case 'restart':
            // Reiniciar e jogar de novo fazem a mesma coisa: começar uma partida limpa.
            game.start();
            break;
        default:
            console.warn(`Ação desconhecida: ${action}`);
    }
}

/** Monta e liga tudo. É chamada uma única vez, no final do arquivo. */
async function boot() {
    const loadingEl = document.getElementById('loading');
    try {
        const assets = await loadAssets();

        // Objetos de apoio: cada um cuida de uma parte da interface.
        const canvas = document.getElementById('game-canvas');
        const screens = new ScreenManager(document);
        const popups = new PopupManager(document);
        const hud = new HUD(document);

        // O InputManager precisa do Game para pausar, e o Game precisa do InputManager
      
        let game = null;
        const input = new InputManager({
            onPauseToggle: () => game && game.togglePause(),
        });

        // O Game recebe os objetos prontos (injeção de dependências).
        // Assim ele não precisa saber como cada um é criado.
        game = new Game({ canvas, assets, input, hud, popups, screens });

        // O loop chama esta função a cada quadro: primeiro atualiza a lógica, depois desenha.
        const loop = new GameLoop((dt) => {
            game.update(dt);
            game.render();
        });

        // Botões com data-action (menu, pausa, Game Over...). Um único "ouvinte" no
        // documento atende todos os botões, inclusive os que forem criados depois.
        document.addEventListener('click', (event) => {
            const button = event.target.closest('[data-action]');
            if (button) {
                runAction(button.dataset.action, game, screens);
            }
        });

        loop.start();
        game.goToMenu();

        // Gancho para testes automatizados e para inspeção no console do navegador.
        window.waverun = { game, input };

        // Tudo pronto: some a mensagem "Carregando...".
        loadingEl.classList.add('hidden');
    } catch (error) {
        // Se algo falhar (ex.: imagem faltando), mostramos o erro na tela em vez de travar em silêncio.
        loadingEl.textContent = `Erro ao iniciar o jogo: ${error.message}`;
        console.error(error);
    }
}

boot();
