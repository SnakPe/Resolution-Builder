"use strict";
class ResolutionGraph {
    constructor(svg) {
        this._nodes = new Map();
        this._edges = [];
        this.svg = svg;
        this.clear();
    }
    clear() {
        this._nodes = new Map();
        this._edges = [];
        this.svg.innerHTML = "";
    }
    addClause(x, y, newClause, resolvedClauses) {
        if (this._nodes.has(newClause))
            console.warn("Already existing node has been added to graph");
        const newNode = new ClauseNode(newClause, x, y);
        this.svg.appendChild(newNode.svg);
        this._nodes.set(newClause, newNode);
        if (resolvedClauses) {
            console.assert(this._nodes.get(resolvedClauses[0]) !== undefined && this._nodes.get(resolvedClauses[1]) !== undefined);
            let newEdge = new Edge(this._nodes.get(resolvedClauses[0]), newNode);
            this._edges.push(newEdge);
            newEdge = new Edge(this._nodes.get(resolvedClauses[1]), newNode);
            this._edges.push(newEdge);
        }
        return newNode;
    }
    getNode(clause) {
        return this._nodes.get(clause);
    }
}
