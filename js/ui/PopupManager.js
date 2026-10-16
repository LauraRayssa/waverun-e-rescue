/**
 * PopupManager.js
 * PAPEL NO JOGO: mostra os pop-ups informativos (mar calmo, resgate à
 * frente, evolução...). Eles entram em uma FILA e aparecem um de cada vez,
 * para que nenhum aviso seja sobreposto por outro.
 *
 * COMO FUNCIONA: show("chave") coloca um aviso na fila. A cada quadro,
 * update() conta o tempo do aviso atual; quando ele termina, espera uma
 * pequena pausa e mostra o próximo da fila.
 */

/**
 * Textos e ícones de cada pop-up. A chave é usada por show().
 * Os textos seguem a V1 (telas PopUp - *.png).
 * "duration" é o tempo, em segundos, que o pop-up fica na tela.
 */
const POPUP_DEFINITIONS = {
    'mar-calmo': {
        icon: 'assets/ui/icon-mar-calmo.png',
        title: 'MAR CALMO',
        text: 'Aproveite para ganhar velocidade.',
        duration: 1.6,
    },
    'mar-agitado': {
        icon: 'assets/ui/icon-mar-agitado.png',
        title: 'MAR AGITADO',
        text: 'As ondas estão ficando mais fortes.',
        duration: 1.6,
    },
    tempestade: {
        icon: 'assets/ui/icon-tempestade.png',
        title: 'TEMPESTADE',
        text: 'Desvie das ondas e dos obstáculos!',
        duration: 1.9,
    },
    resgate: {
        icon: 'assets/ui/icon-resgates.png',
        title: 'RESGATE À FRENTE!',
        text: 'Uma pessoa precisa de ajuda!',
        duration: 1.2,
    },
    'evolucao-lancha': {
        icon: 'assets/ui/icon-lancha.png',
        title: 'EVOLUÇÃO!',
        text: 'Seu jet ski virou uma lancha: 14 passageiros.',
        duration: 1.8,
    },
    'evolucao-navio': {
        icon: 'assets/ui/icon-navio.png',
        title: 'EVOLUÇÃO!',
        text: 'Sua lancha virou um navio: 40 passageiros.',
        duration: 1.8,
    },
};

/** Pausa (s) entre um pop-up e o próximo da fila. */
const GAP_BETWEEN_POPUPS = 0.2;

export class PopupManager {
    /**
     * Efeito visual de evolução: um flash na moldura e o pop-up cresce.
     * A classe 'evoluindo' ativa as animações do style.css; ela é retirada ao final
     * para que a animação possa tocar de novo em uma próxima evolução.
     */
    playEvolutionEffect() {
        const frame = this.root.parentElement;
        frame.classList.remove('evoluindo');
        void frame.offsetWidth; // força o navegador a reiniciar a animação
        frame.classList.add('evoluindo');
        clearTimeout(this.evoTimer);
        this.evoTimer = setTimeout(() => frame.classList.remove('evoluindo'), 1000);
    }

    /** @param {Document} doc - a página, de onde buscamos os elementos pelo id. */
    constructor(doc) {
        this.root = doc.getElementById('popup');
        this.iconEl = doc.getElementById('popup-icon');
        this.titleEl = doc.getElementById('popup-title');
        this.textEl = doc.getElementById('popup-text');

        this.queue = [];      // pop-ups esperando para aparecer
        this.current = null;  // pop-up em exibição
        this.timer = 0;       // tempo restante do pop-up atual
        this.gap = 0;         // tempo de espera antes do próximo
    }

    /**
     * Adiciona um pop-up à fila.
     * @param {string} key - uma das chaves de POPUP_DEFINITIONS.
     */
    show(key) {
        const definition = POPUP_DEFINITIONS[key];
        if (!definition) {
            throw new Error(`Pop-up desconhecido: ${key}`);
        }
        this.queue.push(definition);
    }

    /**
     * Avança os tempos. Chamado pelo Game a cada quadro em que a partida está ativa.
     * @param {number} dt - tempo desde o quadro anterior (s).
     */
    update(dt) {
        // Há um pop-up na tela: conta o tempo dele e esconde quando acabar.
        if (this.current) {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.current = null;
                this.root.classList.add('hidden');
                this.gap = GAP_BETWEEN_POPUPS;
            }
            return;
        }

        // Nada na tela: se houver fila, espera a pequena pausa e mostra o próximo.
        if (this.queue.length === 0) return;
        this.gap -= dt;
        if (this.gap <= 0) {
            this.display(this.queue.shift());
        }
    }

    /** Mostra um pop-up na tela, preenchendo título, texto e ícone. */
    display(definition) {
        this.current = definition;
        this.timer = definition.duration;
        this.titleEl.textContent = definition.title;
        this.textEl.textContent = definition.text;
        if (definition.icon) {
            this.iconEl.src = definition.icon;
            this.iconEl.classList.remove('hidden');
        } else {
            this.iconEl.classList.add('hidden');
        }
        this.root.classList.remove('hidden');
    }

    /** Remove todos os pop-ups, o da tela e os da fila (pausa, derrota, vitória, evolução). */
    hide() {
        this.queue = [];
        this.current = null;
        this.root.classList.add('hidden');
    }
}
