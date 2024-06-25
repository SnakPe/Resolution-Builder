"use strict";
class ClauseNode {
    constructor(clause, x, y) {
        this._clause = clause;
        this._svg = new SVGGElement();
        this._text = new SVGTextElement();
        this._text.classList.add("Node", "Text");
        this._text.textContent = this._clause.toString();
        this._backbox = new SVGRectElement();
        this._backbox.classList.add("Node", "Box");
        console.assert(this._text.getAttribute("textWidth") !== undefined);
        this._backbox.setAttribute("width", this._text.getAttribute("textWidth"));
        this._svg.append(this._backbox, this._text);
        this._coords = { x, y };
        this.setPosition(x, y);
    }
    setPosition(x, y) {
        if (x !== undefined) {
            this._coords.x = x;
            this._backbox.setAttribute("x", `${-this._backbox.width.baseVal.value / 2 + x}`);
            this._text.setAttribute("x", `${x}`);
        }
        if (y !== undefined) {
            this._coords.y = y;
            this._backbox.setAttribute("y", `${-this._backbox.height.baseVal.value / 2 + y}`);
            this._text.setAttribute("y", `${y}`);
        }
    }
    get clause() {
        return this._clause;
    }
    get position() {
        return this._coords;
    }
    get width() {
        return Number(this._backbox.getAttribute("width"));
    }
    get height() {
        return Number(this._backbox.getAttribute("width"));
    }
    get svg() {
        return this._svg;
    }
}
