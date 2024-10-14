"use strict";
class Clause {
    constructor(vars) {
        if (!vars)
            this.literals = [];
        else if (typeof vars == "string")
            this.literals = getClauseFromString(vars).literals;
        else
            this.literals = vars;
        this.sortLexically();
    }
    toString() {
        let result = "{";
        for (let i = 0; i < this.literals.length - 1; i++) {
            if (this.literals[i].isNegated)
                result += "\u00AC";
            result += this.literals[i].name;
            result += ", ";
        }
        if (this.literals[this.literals.length - 1]?.isNegated)
            result += "\u00AC";
        result += this.literals[this.literals.length - 1] ? this.literals[this.literals.length - 1].name : "";
        result += "}";
        return result;
    }
    isRedundant() {
        for (let i = 1; i < this.literals.length; i++)
            if (this.literals[i].name == this.literals[i - 1].name)
                return true;
        return false;
    }
    sortLexically() {
        this.literals.sort((var1, var2) => var1.name.charCodeAt(0) - var2.name.charCodeAt(0));
    }
    insertLiteral(literal) {
        if (!this.literals.some((v) => { return (v.name == literal.name && v.isNegated == literal.isNegated); })) {
            this.literals.push(literal);
            this.sortLexically();
        }
    }
    equals(otherClause) {
        if (this.literals.length != otherClause.literals.length)
            return false;
        return !this.literals.some((var1) => {
            return !otherClause.literals.some((var2) => (var1.isNegated == var2.isNegated && var1.name == var2.name));
        });
    }
    difference(otherClause) {
        let result = Math.abs(otherClause.literals.length - this.literals.length);
        this.literals.forEach(var1 => {
            if (!otherClause.literals.some(var2 => (var1.name == var2.name && var1.isNegated == var2.isNegated)))
                result++;
        });
        return result;
    }
    resolveWith(otherClause, literal) {
        let result = new Clause();
        this.literals.forEach(thisVar => {
            if (thisVar != literal)
                result.insertLiteral(thisVar);
        });
        otherClause.literals.forEach(otherVar => {
            if (otherVar.name != literal.name || literal.isNegated == otherVar.isNegated)
                result.insertLiteral(otherVar);
        });
        return result;
    }
}
const NODE_PADDING = 5;
class ClauseNode {
    constructor(clause, x, y) {
        this._clause = clause;
        this._svg = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this._svg.classList.add("Node");
        this._text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        this._text.classList.add("Text");
        this._text.textContent = clause.toString();
        this._backborder = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this._backborder.classList.add("Box");
        this._svg.append(this._backborder, this._text);
        this._coords = { x, y };
    }
    updateSVG() {
        this._backborder.setAttribute("width", `${this._text.getBBox().width + NODE_PADDING}`);
        this._backborder.setAttribute("height", `${this._text.getBBox().height + NODE_PADDING}`);
        this.setPosition(this._coords.x, this._coords.y);
    }
    setPosition(x, y) {
        if (x !== undefined) {
            this._coords.x = x;
            this._backborder.setAttribute("x", `${x}`);
            this._text.setAttribute("x", `${this.center.x}`);
        }
        if (y !== undefined) {
            this._coords.y = y;
            this._backborder.setAttribute("y", `${y}`);
            this._text.setAttribute("y", `${this.center.y}`);
        }
    }
    get clause() {
        return this._clause;
    }
    get position() {
        return this._coords;
    }
    get width() {
        return Number(this._backborder.getAttribute("width"));
    }
    get height() {
        return Number(this._backborder.getAttribute("height"));
    }
    get svg() {
        return this._svg;
    }
    get center() {
        return add(this._coords, { x: this.width / 2, y: this.height / 2 });
    }
}
const TIPSIZE = 15;
class Edge {
    constructor(from, to) {
        this._from = from;
        this._to = to;
        this._svg = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this._svg.classList.add("Edge");
        this._outerLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        this._outerLine.classList.add("Edge", "Line", "Outer");
        this._edgeLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        this._edgeLine.classList.add("Edge", "Line", "Inner");
        this._arrowTip = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        this._arrowTip.classList.add("Edge", "ArrowTip");
        this._svg.append(this._outerLine, this._edgeLine, this._arrowTip);
    }
    updateSVG() {
        const line = this.NodeIntersection();
        if (!line)
            return;
        this._outerLine.setAttribute("x1", `${line.start.x}`);
        this._outerLine.setAttribute("y1", `${line.start.y}`);
        this._outerLine.setAttribute("x2", `${line.end.x}`);
        this._outerLine.setAttribute("y2", `${line.end.y}`);
        this._edgeLine.setAttribute("x1", `${line.start.x}`);
        this._edgeLine.setAttribute("y1", `${line.start.y}`);
        this._edgeLine.setAttribute("x2", `${line.end.x}`);
        this._edgeLine.setAttribute("y2", `${line.end.y}`);
        const tipPointsLineStartDir = scalarMult(normalizedVector(subtract({ x: 0, y: 0 }, vectorForm(line).direction)), TIPSIZE);
        if (isNaN(tipPointsLineStartDir.x))
            return;
        const tipPointsLine = pointForm({ start: add(line.end, tipPointsLineStartDir), direction: orthogonalVector(tipPointsLineStartDir) });
        const tipPoint1 = getPointOnLine(tipPointsLine, .5, true);
        const tipPoint2 = getPointOnLine(tipPointsLine, -.5, true);
        this._arrowTip.setAttribute("points", `${line.end.x},${line.end.y} ${tipPoint1.x},${tipPoint1.y} ${tipPoint2.x},${tipPoint2.y}`);
    }
    NodeIntersection() {
        const fromWidth = this._from.width;
        const fromHeight = this._from.height;
        const toWidth = this._to.width;
        const toHeight = this._to.height;
        const edgePoints = { start: this._from.center, end: this._to.center };
        const ulFrom = this._from.position;
        const dlFrom = add(ulFrom, { x: 0, y: fromHeight });
        const urFrom = add(ulFrom, { x: fromWidth, y: 0 });
        const drFrom = add(ulFrom, { x: fromWidth, y: fromHeight });
        const fromNodeBorderLines = [
            { start: ulFrom, end: dlFrom },
            { start: dlFrom, end: drFrom },
            { start: urFrom, end: ulFrom },
            { start: drFrom, end: urFrom },
        ];
        const ulTo = this._to.position;
        const dlTo = add(ulTo, { x: 0, y: toHeight });
        const urTo = add(ulTo, { x: toWidth, y: 0 });
        const drTo = add(ulTo, { x: toWidth, y: toHeight });
        const toNodeBorderLines = [
            { start: ulTo, end: dlTo },
            { start: dlTo, end: drTo },
            { start: urTo, end: ulTo },
            { start: drTo, end: urTo },
        ];
        function lineIntersection(e, n) {
            const divisor = (e.start.x - e.end.x) * (n.start.y - n.end.y) - (e.start.y - e.end.y) * (n.start.x - n.end.x);
            const t = ((e.start.x - n.start.x) * (n.start.y - n.end.y) - (e.start.y - n.start.y) * (n.start.x - n.end.x)) / divisor;
            const u = -((e.start.x - e.end.x) * (e.start.y - n.start.y) - (e.start.y - e.end.y) * (e.start.x - n.start.x)) / divisor;
            if (0 <= t && t <= 1 && 0 <= u && u <= 1)
                return { x: e.start.x + t * (e.end.x - e.start.x), y: e.start.y + t * (e.end.y - e.start.y) };
            return undefined;
        }
        let start = undefined;
        let end = undefined;
        for (let i = 0; i < fromNodeBorderLines.length; i++) {
            const lineFrom = fromNodeBorderLines[i];
            const lineTo = toNodeBorderLines[i];
            const isFrom = lineIntersection(edgePoints, lineFrom);
            const isTo = lineIntersection(edgePoints, lineTo);
            if (isFrom)
                start = isFrom;
            if (isTo)
                end = isTo;
        }
        if (start == undefined || end == undefined)
            return undefined;
        return { start, end };
    }
    get svg() {
        return this._svg;
    }
    connects(node) {
        return this._to === node || this._from === node;
    }
}
function isPoint(a) {
    return a.x !== undefined && a.y !== undefined;
}
const isVector = isPoint;
function isLine(a) {
    return (a.start !== undefined && a.end !== undefined);
}
function add(a, b) {
    if (isLine(a)) {
        if (isLine(b)) {
            return { start: add(a.start, b.start), end: add(a.end, b.end) };
        }
    }
    else if (isPoint(b)) {
        return { x: a.x + b.x, y: a.y + b.y };
    }
    throw new Error("Points and lines cannot be added");
}
function subtract(a, b) {
    if (isPoint(a)) {
        if (isPoint(b)) {
            return { x: a.x - b.x, y: a.y - b.y };
        }
    }
    else if (isLine(b)) {
        return { start: subtract(a.start, b.start), end: subtract(a.end, b.end) };
    }
    throw new Error("Points and lines cannot be subtracted");
}
function distance(a) {
    if (isLine(a)) {
        const diff = subtract(a.end, a.start);
        return (diff.x ** 2 + diff.y ** 2) ** 0.5;
    }
    return (a.x ** 2 + a.y ** 2) ** 0.5;
}
function scalarMult(a, b) {
    return { x: a.x * b, y: a.y * b };
}
function dotProduct(a, b) {
    return a.x * b.x + a.y * b.y;
}
function orthogonalVector(a) {
    return { x: a.y, y: -a.x };
}
function normalizedVector(a) {
    return scalarMult(a, 1 / distance(a));
}
function vectorForm(a) {
    return { start: a.start, direction: subtract(a.end, a.start) };
}
function pointForm(vectorRep) {
    return { start: vectorRep.start, end: add(vectorRep.direction, vectorRep.start) };
}
function normalizedLine(a) {
    const diff = vectorForm(a).direction;
    return pointForm({ start: a.start, direction: normalizedVector(diff) });
}
function getPointOnLine(a, lengthOrPercentage, isPercentage) {
    if (isPercentage)
        return add(a.start, scalarMult(subtract(a.end, a.start), lengthOrPercentage));
    const norm = normalizedLine(a);
    return add(norm.start, scalarMult(subtract(norm.end, norm.start), lengthOrPercentage));
}
class ResolutionGraph {
    constructor(svg) {
        this._nodes = new Map();
        this._edges = [];
        this._x = 0;
        this._y = 0;
        this._zoom = 1;
        this._svg = svg;
        svg.addEventListener("pointerover", () => {
            document.getElementsByTagName("body")[0].style.overflow = "hidden";
        });
        svg.addEventListener("pointerout", () => {
            document.getElementsByTagName("body")[0].style.overflow = "auto";
        });
        svg.addEventListener("pointerdown", () => {
            this._draggedNode = undefined;
        });
        svg.addEventListener("pointermove", (ev) => {
            if (this._draggedNode !== undefined) {
                const nodeX = (this._x) + this._zoom * ev.offsetX - this._draggedNode.width / 2;
                const nodeY = (this._y) + this._zoom * ev.offsetY - this._draggedNode.height / 2;
                this.setNodePosition(this._draggedNode, nodeX, nodeY);
            }
            else {
                if (ev.buttons === 1) {
                    this._x -= ev.movementX * this._zoom;
                    this._y -= ev.movementY * this._zoom;
                    this.refreshSVG();
                }
            }
        });
        svg.addEventListener("wheel", (ev) => {
            let speed = Math.abs(ev.deltaY / 100) ** 1.5;
            speed = ev.deltaY < 0 ? -speed : speed;
            const newZoom = this._zoom + speed;
            if (this._svg.width.baseVal.value * newZoom > 0.5) {
                const oldZoom = this._zoom;
                this._zoom = newZoom;
                this._x += this._svg.width.baseVal.value * (oldZoom - this._zoom) / 2;
                this._y += this._svg.height.baseVal.value * (oldZoom - this._zoom) / 2;
            }
            this.refreshSVG();
        });
        this.clear();
    }
    clear() {
        this._nodes = new Map();
        this._edges = [];
        this._svg.innerHTML = "";
    }
    refreshSVG() {
        const width = this._svg.width.baseVal.value * this._zoom;
        const height = this._svg.height.baseVal.value * this._zoom;
        if (height > 0 && width > 0)
            this._svg.setAttribute("viewBox", `${this._x} ${this._y} ${width} ${height}`);
    }
    addClause(x, y, newClause, resolvedClauses) {
        if (this._nodes.has(newClause))
            console.warn("Already existing node has been added to graph");
        const newNode = new ClauseNode(newClause, x, y);
        newNode.svg.addEventListener("pointerdown", (ev) => {
            this._draggedNode = newNode;
            ev.stopPropagation();
        });
        newNode.svg.addEventListener("pointerup", (ev) => {
            this._draggedNode = undefined;
            ev.stopPropagation();
        });
        this._svg.appendChild(newNode.svg);
        newNode.updateSVG();
        this._nodes.set(newClause, newNode);
        if (resolvedClauses) {
            console.assert(this._nodes.get(resolvedClauses[0]) !== undefined && this._nodes.get(resolvedClauses[1]) !== undefined);
            const randomColor = `#${Math.floor(Math.random() * 16777216).toString(16).padStart(6, "0")}`;
            let newEdge = new Edge(this._nodes.get(resolvedClauses[0]), newNode);
            this._edges.push(newEdge);
            this._svg.insertBefore(newEdge.svg, this._svg.firstChild);
            newEdge.svg.style.stroke = randomColor;
            newEdge.updateSVG();
            newEdge = new Edge(this._nodes.get(resolvedClauses[1]), newNode);
            this._edges.push(newEdge);
            this._svg.insertBefore(newEdge.svg, this._svg.firstChild);
            newEdge.svg.style.stroke = randomColor;
            newEdge.updateSVG();
        }
        return newNode;
    }
    setNodePosition(node, x, y) {
        node.setPosition(x, y);
        this.getEdgesConnectingNode(node).forEach(edge => edge.updateSVG());
    }
    getNode(clause) {
        return this._nodes.get(clause);
    }
    getEdgesConnectingNode(node) {
        return this._edges.filter(edge => edge.connects(node));
    }
}
function getVariableFromString(variable) {
    const ALPHABET = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    switch (variable.length) {
        case 0:
            console.error("warning: no variable when expected. Empty sets mean that resolution is not neccesary");
            alert("warning: no variable when expected. Empty sets mean that resolution is not neccesary");
            break;
        case 1:
            var name = variable[0];
            if (ALPHABET.some(letter => letter == name))
                return { name: variable[0], isNegated: false };
            console.error("error: letter expected : ", variable[0]);
            alert("error: letter expected : " + variable[0]);
            break;
        case 2:
            name = variable[1];
            if (variable[0] != '\u00AC') {
                console.error("error: negation expected : ", variable[0]);
                alert("error: negation expected : " + variable[0]);
            }
            else if (!ALPHABET.some(letter => letter == name)) {
                console.error("error: letter expected : ", name);
                alert("error: letter expected : " + name);
            }
            else
                return { name: variable[1], isNegated: true };
            break;
        default:
            console.error("error: notation wrong:", variable);
            alert("error: notation wrong:" + variable);
    }
}
function getClauseFromString(clause) {
    let result = new Clause();
    clause.split(",").forEach(var1 => {
        let convVar = getVariableFromString(var1);
        if (convVar && !result.literals.some(var2 => var2 == convVar))
            result.insertLiteral(convVar);
    });
    return result;
}
function getClausesFromStrings(clauses) {
    let result = [];
    clauses.forEach(clause => {
        const newClause = getClauseFromString(clause);
        if (!result.some(clause => clause.equals(newClause)))
            result.push(newClause);
    });
    return result;
}
function resolve(clauses) {
    let result = [];
    clauses.forEach((clause1, index) => {
        for (let i = index + 1; i < clauses.length; i++) {
            let clause2 = clauses[i];
            let char1Index = 0, char2Index = 0;
            while (char1Index < clause1.literals.length && char2Index < clause2.literals.length) {
                const var1 = clause1.literals[char1Index];
                const var2 = clause2.literals[char2Index];
                if (var1.name == var2.name) {
                    if (var2.isNegated != var1.isNegated) {
                        const genClause = clause1.resolveWith(clause2, var1);
                        if (!(clauses.some(clause => clause.equals(genClause)) || result.some(res => res.result.equals(genClause)))) {
                            result.push({ c1: clause1, c2: clause2, result: genClause });
                            break;
                        }
                    }
                    char1Index++;
                }
                if (var1.name.charCodeAt(0) < var2.name.charCodeAt(0))
                    char1Index++;
                else
                    char2Index++;
            }
        }
    });
    return result;
}
function rmOuterBrackets(input) {
    while (input.substring(0, 2) == "{{") {
        if (input.substring(input.length - 2, input.length) == "}}")
            input = input.substring(2, input.length - 2);
        else {
            console.error("outer brackets not complete");
            alert("error: outer brackets not complete");
            break;
        }
    }
    if (input[0] == '{') {
        if (input[input.length - 1] == '}') {
            input = input.substring(1, input.length - 1);
        }
        else {
            console.error("inner brackets not complete ");
            alert("error: inner brackets not complete");
        }
    }
    return input;
}
function getStringFromClauses(clauses) {
    let result = "";
    clauses.forEach(clause => {
        result += "{";
        clause.literals.forEach(variable => {
            if (variable.isNegated)
                result += "\u00AC";
            result += variable.name;
            result += ",";
        });
        if (clause.literals.length != 0)
            result = result.substring(0, result.length - 1);
        result += "}, ";
    });
    result = result.substring(0, result.length - 2);
    return result;
}
let graph;
onload = function () {
    graph = new ResolutionGraph(document.getElementsByTagNameNS("http://www.w3.org/2000/svg", "svg")[0]);
    function handleSetInputButton() {
        graph.clear();
        let input = document.getElementById("SetInput").value;
        input = input.replaceAll(" ", "");
        input = input.replaceAll("-", "\u00AC");
        input = input.toUpperCase();
        input = rmOuterBrackets(input);
        const rawClauses = input.split("},{");
        const clauses = getClausesFromStrings(rawClauses);
        let xPos = 20;
        clauses.forEach((c, index) => {
            const node = graph.addClause(20 + index * 100, 20, c);
            graph.setNodePosition(node, xPos, node.position.y);
            xPos += node.width + 20;
        });
        let generatedResolutions;
        let level = 1;
        do {
            generatedResolutions = resolve(clauses);
            if (document.getElementById("RedundantClauseCheckbox").checked)
                generatedResolutions = generatedResolutions.filter(res => !res.result.isRedundant());
            clauses.push(...generatedResolutions.map((res) => res.result));
            xPos = 20;
            for (let i = 0; i < generatedResolutions.length; i++) {
                const res = generatedResolutions[i];
                const node = graph.addClause(0, 20 + (level) * 150, res.result, [res.c1, res.c2]);
                graph.setNodePosition(node, xPos, node.position.y);
                xPos += node.width + 20;
            }
            level++;
        } while (generatedResolutions.length != 0);
    }
    document.getElementById("SetInputButton")?.addEventListener("click", handleSetInputButton);
    document.getElementById("SetInput")?.addEventListener("keydown", (ev) => {
        if (ev.key == "Enter")
            handleSetInputButton();
    });
    document.getElementById("ClearButton")?.addEventListener("click", () => graph.clear());
};
