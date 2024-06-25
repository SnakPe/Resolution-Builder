"use strict";
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
