/**
 * THE LAST LIGHTKEEPER - QuadTree Spatial Partitioning
 * Broad Phase collision detection using AABB (Axis-Aligned Bounding Box)
 * O(n log n) performance vs O(n²) brute force
 */

export class QuadTree {
    constructor(bounds, maxObjects = 10, maxLevels = 4, level = 0) {
        this.maxObjects = maxObjects; // Limite de objetos antes de subdividir
        this.maxLevels = maxLevels;   // Profundidade máxima da árvore
        this.level = level;           // Nível atual
        this.bounds = bounds;         // { x, y, width, height }
        
        this.objects = [];            // Entidades neste nodo
        this.nodes = [];              // Sub-quadrantes
    }

    /**
     * Limpa a árvore para o próximo frame
     * Zero Garbage Collection se bem gerenciado
     */
    clear() {
        this.objects.length = 0;
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].clear();
        }
        this.nodes.length = 0;
    }

    /**
     * Subdivide o nodo atual em 4 quadrantes
     * [0] Top Right, [1] Top Left, [2] Bottom Left, [3] Bottom Right
     */
    split() {
        const subWidth = this.bounds.width / 2;
        const subHeight = this.bounds.height / 2;
        const x = this.bounds.x;
        const y = this.bounds.y;

        this.nodes[0] = new QuadTree(
            { x: x + subWidth, y: y, width: subWidth, height: subHeight }, 
            this.maxObjects, this.maxLevels, this.level + 1
        ); // Top Right
        
        this.nodes[1] = new QuadTree(
            { x: x, y: y, width: subWidth, height: subHeight }, 
            this.maxObjects, this.maxLevels, this.level + 1
        ); // Top Left
        
        this.nodes[2] = new QuadTree(
            { x: x, y: y + subHeight, width: subWidth, height: subHeight }, 
            this.maxObjects, this.maxLevels, this.level + 1
        ); // Bottom Left
        
        this.nodes[3] = new QuadTree(
            { x: x + subWidth, y: y + subHeight, width: subWidth, height: subHeight }, 
            this.maxObjects, this.maxLevels, this.level + 1
        ); // Bottom Right
    }

    /**
     * Determina em qual quadrante o objeto se encaixa
     * -1 significa que sobrepõe múltiplos quadrantes
     */
    getIndex(rect) {
        let index = -1;
        const verticalMidpoint = this.bounds.x + (this.bounds.width / 2);
        const horizontalMidpoint = this.bounds.y + (this.bounds.height / 2);

        const topQuadrant = (rect.y < horizontalMidpoint && rect.y + rect.height < horizontalMidpoint);
        const bottomQuadrant = (rect.y > horizontalMidpoint);

        if (rect.x < verticalMidpoint && rect.x + rect.width < verticalMidpoint) {
            if (topQuadrant) index = 1;
            else if (bottomQuadrant) index = 2;
        } else if (rect.x > verticalMidpoint) {
            if (topQuadrant) index = 0;
            else if (bottomQuadrant) index = 3;
        }

        return index;
    }

    /**
     * Insere o objeto na árvore
     * Se exceder a capacidade, subdivide e redistribui
     */
    insert(rect) {
        if (this.nodes.length > 0) {
            const index = this.getIndex(rect);
            if (index !== -1) {
                this.nodes[index].insert(rect);
                return;
            }
        }

        this.objects.push(rect);

        if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
            if (this.nodes.length === 0) this.split();

            let i = 0;
            while (i < this.objects.length) {
                const index = this.getIndex(this.objects[i]);
                if (index !== -1) {
                    const removed = this.objects.splice(i, 1)[0];
                    this.nodes[index].insert(removed);
                } else {
                    i++;
                }
            }
        }
    }

    /**
     * Retorna todos os objetos que podem colidir com o retângulo fornecido
     * Broad Phase - apenas candidatos, não colisões confirmadas
     */
    retrieve(returnObjects, rect) {
        const index = this.getIndex(rect);
        if (index !== -1 && this.nodes.length > 0) {
            this.nodes[index].retrieve(returnObjects, rect);
        } else if (this.nodes.length > 0) {
            // Se o objeto cruza múltiplos quadrantes, verifica todos
            for (let i = 0; i < this.nodes.length; i++) {
                this.nodes[i].retrieve(returnObjects, rect);
            }
        }
        returnObjects.push(...this.objects);
        return returnObjects;
    }

    /**
     * Debug: retorna estatísticas da árvore
     */
    getStats() {
        let totalObjects = this.objects.length;
        let totalNodes = 1;
        let maxDepth = this.level;

        for (const node of this.nodes) {
            const stats = node.getStats();
            totalObjects += stats.totalObjects;
            totalNodes += stats.totalNodes;
            maxDepth = Math.max(maxDepth, stats.maxDepth);
        }

        return {
            totalObjects,
            totalNodes,
            maxDepth,
            currentLevel: this.level
        };
    }

    /**
     * Debug: visualiza a estrutura da árvore
     */
    visualize(level = 0) {
        const indent = '  '.repeat(level);
        console.log(`${indent}Level ${level}: ${this.objects.length} objects`);
        
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].visualize(level + 1);
        }
    }
}
