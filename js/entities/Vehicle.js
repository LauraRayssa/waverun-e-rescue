/**
 * Vehicle.js
 * PAPEL NO JOGO: é a classe BASE (a "classe-mãe") de todas as embarcações.
 * JetSki, Lancha e Navio herdam dela com "extends".
 *
 * O QUE ELA GUARDA (o que toda embarcação tem em comum):
 *  - posição e velocidade;
 *  - quantas pessoas estão a bordo;
 *  - como se move, como acelera e como é a sua caixa de colisão.
 *
 * CONCEITOS DE POO NESTE ARQUIVO:
 *  - HERANÇA: as subclasses reaproveitam todo este código.
 *  - POLIMORFISMO: os "getters" abaixo (maxSpeed, capacity...) têm um valor
 *    padrão, e cada subclasse sobrescreve com o seu valor. O jogo chama
 *    vehicle.maxSpeed sem saber qual embarcação é; cada uma responde do seu jeito.
 *  - ENCAPSULAMENTO: a ocupação é um campo privado (#occupants). Só pode ser
 *    alterada pelo método addOccupant(), que respeita a capacidade.
 */
import { BOAT_SCREEN_X, SEA_TOP, SEA_BOTTOM, SEA_MIDDLE, REVERSE_SPEED, HITBOX_COMPRIMENTO, HITBOX_LARGURA } from '../config/Config.js';

export class Vehicle {
    /**
     * @param {HTMLImageElement} image - sprite da embarcação (vista de cima).
     * @param {number} occupants - ocupantes a bordo (inclui o condutor).
     *                             Ao evoluir, a nova embarcação herda esse número.
     */
    constructor(image, occupants = 1) {
        this.image = image;
        this.x = BOAT_SCREEN_X;      // posição horizontal fixa na tela
        this.y = SEA_MIDDLE;         // posição vertical (muda com as setas ↑ ↓)
        this.speed = 0;              // velocidade atual em px/s (negativa = dar ré)
        this.seaAmplitude = 0;       // altura das ondas do mar atual (balanço visual)
        this.bobTime = 0;            // tempo acumulado, usado no balanço

        this.#occupants = occupants;

        // Dimensões na tela, já com o barco apontando para a direita:
        
        const rotated = this.bowAngle !== 0;
        this.length = this.drawLengthValue;
        const scale = this.length / (rotated ? image.height : image.width);
        this.beam = (rotated ? image.width : image.height) * scale;
    }

    // Ocupação é privada: de fora, só leitura pública (ver o getter "occupants").
    #occupants;

    //  Valores que cada subclasse define (polimorfismo por getters)

    /** Segundos para fazer um resgate com esta embarcação. Passado esse tempo, a partida termina. */
    get rescueTimeLimit() {
        return 120;
    }

    /**
     * Capacidade máxima de ocupantes, incluindo o condutor.
     * Aqui lança erro de propósito: a classe base não sabe a capacidade,
     * então cada subclasse é OBRIGADA a definir a sua.
     */
    get capacity() {
        throw new Error('A subclasse precisa definir capacity.');
    }

    /** Nome exibido no HUD e nas telas. */
    get name() {
        return 'Embarcação';
    }

    /** Chave usada para carregar sprite e ícones. */
    get key() {
        return 'base';
    }

    /** Velocidade máxima ao acelerar (px/s). */
    get maxSpeed() {
        return 200;
    }

    /** Velocidade de cruzeiro quando nenhuma tecla de velocidade está pressionada. */
    get cruiseSpeed() {
        return 110;
    }

    /** Aceleração em px/s² ao mudar de velocidade. */
    get acceleration() {
        return 150;
    }

    /** Velocidade vertical ao usar ↑ ou ↓ (px/s). */
    get lateralSpeed() {
        return 200;
    }

    /** Comprimento desenhado na tela (px). */
    get drawLengthValue() {
        return 160;
    }

    /**
     * Rotação para que a embarcação aponte para a direita.
     * O sprite do jet ski já aponta para a direita (0). Lancha e navio
     * apontam para cima no sprite, então são girados 90° (PI/2).
     */
    get bowAngle() {
        return 0;
    }

    //  Ocupação 

    /** Número atual de ocupantes (somente leitura de fora da classe). */
    get occupants() {
        return this.#occupants;
    }

    /** Verdadeiro quando ainda há lugar a bordo. */
    hasSpace() {
        return this.#occupants < this.capacity;
    }

    /** Verdadeiro quando a embarcação atingiu a capacidade (dispara a evolução). */
    isFull() {
        return this.#occupants >= this.capacity;
    }

    /**
     * Adiciona uma pessoa resgatada. Retorna false se não houver vaga.
     * É o único ponto que altera a ocupação, o que evita estados inválidos
     * (como ter 4 pessoas em um jet ski de capacidade 3).
     */
    addOccupant() {
        if (!this.hasSpace()) {
            return false;
        }
        this.#occupants += 1;
        return true;
    }

    // Interface usada pelo jogo

    /** Informa a altura das ondas atual, usada no balanço do barco. */
    setSeaAmplitude(amplitude) {
        this.seaAmplitude = amplitude;
    }

    /**
     * Atualiza a embarcação a cada quadro: movimento vertical e velocidade.
     * @param {number} dt - tempo desde o quadro anterior (s).
     * @param {{up:boolean,down:boolean,left:boolean,right:boolean}} input - teclas pressionadas.
     */
    update(dt, input) {
        this.bobTime += dt;
        // move() pode ser sobrescrito: o Navio tem a sua versão, com inércia.
        this.move(dt, input);
        this.updateSpeed(dt, input);
    }

    /** Movimento vertical (raias). Subclasses podem sobrescrever para mudar o comportamento. */
    move(dt, input) {
        // -1 = sobe, +1 = desce, 0 = fica parado.
        let direction = 0;
        if (input.up) direction -= 1;
        if (input.down) direction += 1;
        this.y += direction * this.lateralSpeed * dt;
        this.clampY();
    }

    /**
     * Ajusta a velocidade em direção a um alvo:
     *  - → acelera até maxSpeed;
     *  - ← dá ré;
     *  - sem tecla, volta à velocidade de cruzeiro.
     */
    updateSpeed(dt, input) {
        let target = this.cruiseSpeed;
        if (input.right) target = this.maxSpeed;
        else if (input.left) target = REVERSE_SPEED;
        this.approachSpeed(target, dt);
    }

    /** Aproxima a velocidade atual de um valor alvo, respeitando a aceleração. */
    approachSpeed(target, dt) {
        const step = this.acceleration * dt;
        if (this.speed < target) {
            this.speed = Math.min(target, this.speed + step);
        } else {
            // Frear é um pouco mais rápido que acelerar, como em uma embarcação real.
            this.speed = Math.max(target, this.speed - step * 1.5);
        }
    }

    /** Retângulo de colisão (com margem interna para ser justo com o jogador). */
    getBounds() {
        const width = this.length * HITBOX_COMPRIMENTO;
        const height = this.beam * HITBOX_LARGURA;
        return {
            x: this.x - width / 2,
            y: this.y - height / 2,
            width,
            height,
        };
    }

    /**
     * Casco em forma de círculos, de popa a proa. Assim a proa e a popa são
     * arredondadas, como no barco de verdade, e o barco não bate em pedras
     * que estão só no canto da caixa retangular.
     * @returns {Array<{x:number, y:number, r:number}>}
     */
    getHullCircles() {
        const r = (this.beam * HITBOX_LARGURA) / 2;             // raio de cada círculo
        const reach = Math.max(0, (this.length * HITBOX_COMPRIMENTO) / 2 - r); // espaço do centro
        const count = Math.ceil(reach / r) + 1;                  // círculos sobrepostos
        const circles = [];
        for (let i = 0; i < count; i++) {
            const t = count === 1 ? 0 : i / (count - 1);          // 0 = popa, 1 = proa
            circles.push({ x: this.x - reach + 2 * reach * t, y: this.y, r });
        }
        return circles;
    }

    /**
     * Desenha a embarcação. A base desenha só o sprite, com balanço.
     * As subclasses chamam super.draw() e acrescentam efeitos próprios.
     * O sprite é desenhado no tamanho da imagem original (antes de girar),
     * depois girado para a direita. Assim a proporção nunca é distorcida.
     */
    draw(ctx) {
        // Balanço suave para cima e para baixo; quanto mais agitado o mar, maior.
        const bob = Math.sin(this.bobTime * 3) * this.seaAmplitude;
        const rotated = this.bowAngle !== 0;
        const spriteWidth = rotated ? this.beam : this.length;
        const spriteHeight = rotated ? this.length : this.beam;

        // save/restore isolam a rotação: ela vale só para este desenho.
        ctx.save();
        ctx.translate(this.x, this.y + bob);
        ctx.rotate(this.bowAngle);
        ctx.drawImage(this.image, -spriteWidth / 2, -spriteHeight / 2, spriteWidth, spriteHeight);
        ctx.restore();
    }

    /** Mantém a embarcação dentro da faixa de mar (sem sair pelo HUD nem pela areia). */
    clampY() {
        const halfHeight = this.beam / 2;
        this.y = Math.max(SEA_TOP + halfHeight, Math.min(SEA_BOTTOM - halfHeight, this.y));
    }
}
