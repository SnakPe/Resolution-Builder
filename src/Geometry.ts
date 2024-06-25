// Graph types
type Line = {start : Point, end : Point} // Line Segment, to be speccific
type Point = {x : number, y : number}
type Vector = {x : number, y : number}

/* Type Checks */
function isPoint(a : any) : a is Point|Vector{
	return (a as Point).x !== undefined && (a as Point).y !== undefined
}
const isVector = isPoint
function isLine(a : any) : a is Line{
	return ((a as Line).start !== undefined && (a as Line).end !== undefined)
}

/* Functions for multiple types */

function add(a : Point|Line, b : Point|Line) : Point | Line{
	if(isLine(a)){
		if(isLine(b)){
			return {start : add(a.start,b.start), end : add(a.end, b.end)} as Line
		}
	}
	else if(isPoint(b)){
		return {x : a.x + b.x, y : a.y + b.y}
	}
	throw new Error("Points and lines cannot be added");
}

function subtract(a : Point|Line, b : Point|Line) : Point|Line{
	if(isPoint(a)){
		if(isPoint(b)){
			return {x : a.x - b.x, y : a.y - b.y} as Point
		}
	}
	else if(isLine(b)){
		return {start : subtract(a.start,b.start), end : subtract(a.end, b.end)} as Line
	}
	throw new Error("Points and lines cannot be subtracted");
	
}
function distance(a : Line|Vector) : number{
	if(isLine(a)){
		const diff = subtract(a.end,a.start) as Vector
		return (diff.x**2 + diff.y**2)**0.5
	}
	return (a.x**2 + a.y**2)**0.5
}

/* functions for vectors */
function scalarMult(a : Vector, b : number) : Vector{
	return {x : a.x*b, y : a.y*b}
}
function dotProduct(a:Vector, b:Vector) : number{
	return a.x*b.x + a.y*b.y
}
function orthogonalVector(a : Vector) : Vector{
	return {x : a.y, y : -a.x}
}
function normalizedVector(a : Vector) : Vector{
	return scalarMult(a,1/distance(a))
}

/* Conversions of Vector(https://en.wikipedia.org/wiki/Line_(geometry)#Other_representations) 
   and Point form(https://en.wikipedia.org/wiki/Line_coordinates) for lines 
*/
function vectorForm(a : Line){
	return {start : a.start, direction : subtract(a.end,a.start) as Vector}
} 
function pointForm(vectorRep : {start : Vector, direction : Vector}) : Line{
	return {start : vectorRep.start, end : add(vectorRep.direction, vectorRep.start) as Point}
}

/* functions for lines */
function normalizedLine(a : Line) : Line{
	const diff = vectorForm(a).direction
	return pointForm({start: a.start, direction : normalizedVector(diff)})
}

/**
 * there are 2 ways to get a certain point of the line. 
 * 
 * Either, one takes a part of {@link a} starting from the start of {@link a} with a certain length, in which case the end of that line segment is returned
 * Or one treats the start point as 0% and the end point as 100% of the line. 
 * 
 * @param a 
 * @param lengthOrPercentage  
 * @param isPercentage if true, interprets {@link lengthOrPercentage} as the percentage of line, else as length
 */
function getPointOnLine(a : Line, lengthOrPercentage : number, isPercentage? : boolean) : Point{
	if(isPercentage)
		return add(a.start, scalarMult(subtract(a.end,a.start) as Point,lengthOrPercentage)) as Point
	
	const norm = normalizedLine(a)
	return add(norm.start, scalarMult(subtract(norm.end,norm.start) as Point,lengthOrPercentage)) as Point
}
