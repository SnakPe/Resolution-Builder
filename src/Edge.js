"use strict";
const TIPSIZE = 30;
class Edge {
    constructor(to, from) {
        this._from = from;
        this._to = to;
        this._svg = new SVGGElement();
        this._edgeLine = new SVGLineElement();
        this._arrowTip = new SVGPolygonElement();
        this._svg.append(this._edgeLine, this._arrowTip);
        this._line = this.NodesIntersection();
    }
    updateSVG() {
        this._line = this.NodesIntersection();
        this._edgeLine.setAttribute("x1", `${this._line.start.x}`);
        this._edgeLine.setAttribute("y1", `${this._line.start.y}`);
        this._edgeLine.setAttribute("x2", `${this._line.end.x}`);
        this._edgeLine.setAttribute("y2", `${this._line.end.y}`);
        const tipStart = subtract({ x: 0, y: 0 }, vectorForm(this._line).direction);
        const tipPointsLine = normalizedVector(orthogonalVector(tipStart));
        const tipPoint1 = scalarMult(tipPointsLine, 0.5);
        const tipPoint2 = scalarMult(tipPointsLine, -0.5);
        this._arrowTip.points.appendItem(new DOMPoint(this._line.end.x, this._line.end.y));
        this._arrowTip.points.appendItem(new DOMPoint(tipPoint1.x, tipPoint1.y));
        this._arrowTip.points.appendItem(new DOMPoint(tipPoint2.x, tipPoint2.y));
    }
    NodesIntersection() {
        const fromCentre = this._from.position;
        const fromWidthRadius = this._from.width / 2;
        const fromHeightRadius = this._from.height / 2;
        const edgePoints = { start: this._from.position, end: this._to.position };
        const ul = { x: fromCentre.x - fromWidthRadius, y: fromCentre.y - fromHeightRadius };
        const dl = { x: fromCentre.x - fromWidthRadius, y: fromCentre.y + fromHeightRadius };
        const ur = { x: fromCentre.x + fromWidthRadius, y: fromCentre.y - fromHeightRadius };
        const dr = { x: fromCentre.x + fromWidthRadius, y: fromCentre.y + fromHeightRadius };
        const nodeBoxLines = [
            { start: ul, end: dl },
            { start: dl, end: dr },
            { start: dr, end: ur },
            { start: ur, end: ul }
        ];
        function lineIntersection(e, n) {
            const divisor = (e.start.x - e.end.x) * (n.start.y - n.end.y) - (e.start.y - e.end.y) * (n.start.x - n.end.x);
            const t = ((e.start.x - n.start.x) * (n.start.y - n.end.y) - (e.start.y - n.start.y) * (n.start.x - n.end.x)) / divisor;
            const u = -((e.start.x - e.end.x) * (e.start.y - n.start.y) + (e.start.y - e.end.y) * (e.start.x - n.start.x)) / divisor;
            if (0 <= t && t <= 1 && 0 <= u && u <= 1)
                return { xShift: t * (e.end.x - e.start.x), yShift: t * (e.end.y - e.start.y) };
        }
        for (let i = 0; i < nodeBoxLines.length; i++) {
            const line = nodeBoxLines[i];
            const is = lineIntersection(edgePoints, line);
            if (is) {
                const x1 = edgePoints.start.x + is.xShift;
                const y1 = edgePoints.start.y + is.yShift;
                const x2 = edgePoints.end.x - is.xShift;
                const y2 = edgePoints.end.y - is.yShift;
                return { start: { x: x1, y: y1 }, end: { x: x2, y: y2 } };
            }
        }
        throw new Error(`Couln't find a drawable line from node ${this._from.clause} to ${this._to.clause}`);
    }
}
