/**
 * Config.js
 * PAPEL NO JOGO: é o "painel de controle" do jogo. Todos os números que
 * mexem na dificuldade e no cenário ficam aqui.
 *
 * POR QUE EXISTE: se o professor ou o grupo quiser deixar o jogo mais fácil
 * ou mais difícil (mais obstáculos, mar mais agitado...), basta mudar um
 * número neste arquivo, sem mexer na lógica das classes.
 */

// Tamanho da tela

// Resolução interna do Canvas (16:9). O CSS estica o canvas para qualquer
// tamanho de janela, mantendo a proporção, então o jogo nunca fica distorcido.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

// Faixa de mar

// Região onde as embarcações podem navegar (y em pixels do canvas).
// Acima de SEA_TOP fica a faixa do HUD (5% da largura = 64 px); o mar começa
// logo abaixo dela, sem vão. Abaixo de SEA_BOTTOM começa a areia.
export const SEA_TOP = 64;
export const SEA_BOTTOM = 600;
// Altura inicial do barco: exatamente o meio da faixa de mar.
export const SEA_MIDDLE = (SEA_TOP + SEA_BOTTOM) / 2;

// Movimento e distância

// Posição horizontal fixa do barco na tela. Quem anda é o cenário, que "rola"
// para a esquerda; a distância percorrida é o quanto o cenário andou.
export const BOAT_SCREEN_X = 300;

// Conversão de pixels do cenário para metros. Serve para mostrar a distância
// em km e a velocidade em km/h de um jeito coerente no HUD.
export const PX_TO_METERS = 0.1;

// Velocidade ao dar ré (px/s). Valor negativo = o cenário anda para a direita.
export const REVERSE_SPEED = -60;

// Limite do passo de tempo (s) entre dois quadros. Sem isso, depois de uma pausa
// ou de uma aba em segundo plano, o jogo daria um salto enorme de uma vez.
export const MAX_FRAME_TIME = 1 / 20;

// Estados do mar

// Cada estado define as cores da água, a altura e a frequência das ondas,
// a quantidade de ondas brancas, a chuva e o escurecimento da tela.
export const SEA_STATES = {
    calmo: {
        topColor: '#43c9e8',
        midColor: '#1599b8',
        bottomColor: '#0c7f9d',
        waveAmplitude: 3,
        waveFrequency: 0.012,
        rippleCount: 18,      // quantidade de ondas brancas na água
        rippleLift: 7,        // curvatura das ondas (px)
        rainRate: 0,          // gotas de chuva por segundo (0 = sem chuva)
        darkness: 0,          // escurecimento da tela (0 a 1)
    },
    agitado: {
        topColor: '#2396b1',
        midColor: '#0e7894',
        bottomColor: '#0a5f79',
        waveAmplitude: 10,
        waveFrequency: 0.018,
        rippleCount: 26,
        rippleLift: 7,
        rainRate: 0,
        darkness: 0,
    },
    tempestade: {
        topColor: '#274f60',
        midColor: '#123c4e',
        bottomColor: '#082c3d',
        waveAmplitude: 20,
        waveFrequency: 0.026,
        rippleCount: 36,
        rippleLift: 12,
        rainRate: 120,
        darkness: 0.15,
    },
};

// Fases

/**
 * Fases do jogo. A ordem do vetor define a progressão:
 * jet ski (mar calmo) -> lancha (mar agitado) -> navio (tempestade).
 * Cada fase tem o seu pop-up de clima e os parâmetros de geração de
 * obstáculos e de pessoas na água.
 */
export const PHASES = [
    {
        vehicleKey: 'jetski',
        seaState: 'calmo',
        popupKey: 'mar-calmo',
        obstacleTypes: ['pedra'],
        obstacleInterval: 2.6,   // segundos entre obstáculos
        survivorInterval: 3.5,   // segundos entre pessoas na água
        maxSurvivors: 1,         // pessoas simultâneas na água
    },
    {
        vehicleKey: 'lancha',
        seaState: 'agitado',
        popupKey: 'mar-agitado',
        obstacleTypes: ['pedra', 'boia'],
        obstacleInterval: 1.7,
        survivorInterval: 2.4,
        maxSurvivors: 2,
    },
    {
        vehicleKey: 'navio',
        seaState: 'tempestade',
        popupKey: 'tempestade',
        obstacleTypes: ['pedra', 'boia'],
        obstacleInterval: 2.2,   // mais espaço entre pedras e boias: o navio precisa passar
        survivorInterval: 1.3,
        maxSurvivors: 3,
    },
];

/**
 * Clima durante o navio, conforme a ocupação (passageiros a bordo, com o condutor).
 * Cada etapa vale a partir de `occupants`. Exemplo: com 25 a bordo o mar fica
 * agitado; com 30 volta a ficar calmo. Com 40 o navio lota e a partida termina.
 */
export const NAVIO_WEATHER = [
    { occupants: 0, seaState: 'tempestade', popupKey: 'tempestade' },
    { occupants: 25, seaState: 'agitado', popupKey: 'mar-agitado' },
    { occupants: 30, seaState: 'calmo', popupKey: 'mar-calmo' },
];

// Colisão

/*
 * Tamanho da "caixa de colisão" da embarcação, como fração do tamanho desenhado.
 * Quanto menor o valor, mais o barco passa de raspão nas pedras e boias sem bater.
 * Valores maiores deixam a colisão mais rigorosa.
 */
export const HITBOX_COMPRIMENTO = 0.72;
export const HITBOX_LARGURA = 0.7;
