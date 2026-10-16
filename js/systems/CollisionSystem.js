/**
 * CollisionSystem.js
 * PAPEL NO JOGO: reúne, em um único lugar, as regras de colisão: quando o
 * barco bateu em algo e quando está perto o bastante para resgatar alguém.
 *
 * COMO FUNCIONA: obstáculos e pessoas são retângulos (AABB: dois retângulos
 * colidem quando se sobrepõem em x e em y). Já o barco é um conjunto de
 * círculos ao longo do casco (ver Vehicle.getHullCircles). A colisão do barco
 * com um retângulo testa se algum desses círculos toca o retângulo.
 *
 * CONCEITO DE POO: todos os métodos são "static". Isso quer dizer que não é
 * preciso criar um objeto para usá-los: basta chamar CollisionSystem.canRescue(...).
 * Faz sentido porque a classe não guarda nenhum estado, só faz cálculos.
 */
export class CollisionSystem {
    /**
     * Verifica se dois retângulos se sobrepõem.
     * @param {{x:number,y:number,width:number,height:number}} a
     * @param {{x:number,y:number,width:number,height:number}} b
     * @returns {boolean}
     */
    static rectsOverlap(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    /**
     * Escolhe uma altura livre para criar um obstáculo ou uma pessoa.
     * Tenta algumas alturas sorteadas; se todas estiverem ocupadas perto
     * do ponto de nascimento, devolve null e o objeto não é criado agora.
     * Assim, ninguém nasce em cima de uma pedra ou de uma boia.
     * @param {number} x - posição horizontal de nascimento (centro).
     * @param {Array<{getBounds: Function}>} others - objetos já na água.
     * @param {number} minY - altura mínima.
     * @param {number} maxY - altura máxima.
     * @param {number} attempts - quantas alturas sortear antes de desistir.
     * @param {number} clearanceY - metade da altura da área livre ao redor do novo objeto.
     * @returns {number|null}
     */
    static pickFreeY(x, others, minY, maxY, attempts = 12, clearanceY = 80) {
        const CLEARANCE_X = 110;      // pixels de folga horizontal
        const CLEARANCE_Y = clearanceY; // folga vertical (maior para obstáculos: deixa passagem ao navio)
        for (let i = 0; i < attempts; i++) {
            // Sorteia uma altura entre minY e maxY.
            const y = minY + Math.random() * (maxY - minY);
            // "spot" é a área que precisa estar livre ao redor do ponto sorteado.
            const spot = {
                x: x - CLEARANCE_X,
                y: y - CLEARANCE_Y,
                width: CLEARANCE_X * 2,
                height: CLEARANCE_Y * 2,
            };
            // Se algum objeto já está nessa área, a altura é recusada.
            const blocked = others.some((other) =>
                CollisionSystem.rectsOverlap(spot, other.getBounds()),
            );
            if (!blocked) return y;
        }
        // Nenhuma altura serviu: o chamador tenta de novo mais tarde.
        return null;
    }

    /**
     * Regra de derrota: a embarcação bateu em algum obstáculo?
     * @param {import('../entities/Vehicle.js').Vehicle} vehicle
     * @param {import('../entities/Obstacle.js').Obstacle[]} obstacles
     * @returns {boolean}
     */
    static boatHitsObstacle(vehicle, obstacles) {
        return obstacles.some((obstacle) =>
            CollisionSystem.boatTouchesRect(vehicle, obstacle.getBounds()),
        );
    }

    /**
     * O casco toca o retângulo? Basta um dos círculos do casco tocar a área.
     * @param {import('../entities/Vehicle.js').Vehicle} vehicle
     * @param {{x:number,y:number,width:number,height:number}} rect
     * @param {number} [extra=0] - folga somada ao raio de cada círculo.
     * @returns {boolean}
     */
    static boatTouchesRect(vehicle, rect, extra = 0) {
        return vehicle.getHullCircles().some((c) => {
            // Passo 1: acha o ponto do retângulo mais perto do centro do círculo.
            const nearX = Math.max(rect.x, Math.min(c.x, rect.x + rect.width));
            const nearY = Math.max(rect.y, Math.min(c.y, rect.y + rect.height));
            // Passo 2: mede a distância (ao quadrado, para não precisar de raiz).
            const dx = c.x - nearX;
            const dy = c.y - nearY;
            const reach = c.r + extra;
            // Passo 3: se a distância é menor que o raio, o círculo encostou.
            return dx * dx + dy * dy < reach * reach;
        });
    }

    /**
     * Regra de resgate: a embarcação está perto o bastante da pessoa?
     * A área de resgate é o barco com uma margem extra ao redor.
     * @param {import('../entities/Vehicle.js').Vehicle} vehicle
     * @param {import('../entities/Survivor.js').Survivor} survivor
     * @returns {boolean}
     */
    static canRescue(vehicle, survivor) {
        const RESCUE_MARGIN = 16; // pixels de tolerância ao redor do casco
        return CollisionSystem.boatTouchesRect(vehicle, survivor.getBounds(), RESCUE_MARGIN);
    }
}
