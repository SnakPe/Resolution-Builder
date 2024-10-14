const TIPSIZE = 15

/**
 * An edge between two {@link ClauseNode | nodes}. 
 * The class provides both the logic for an edge in a graph, as well as the DOM representation through the {@link _svg} object.
 * 
 * 
 */
class Edge{
	//edge ends
	private readonly _from : ClauseNode
	private readonly _to : ClauseNode

	//svg representations
	private readonly _svg : SVGGElement
	private readonly _outerLine : SVGLineElement
	private readonly _edgeLine : SVGLineElement
	private readonly _arrowTip : SVGPolygonElement
 

	/**
	 * Creates an edge from one node to another node
	 * 
	 * @param from The starting node of this edge 
	 * @param to The end node of this edge. The svg representation has an arrow tip pointing to this node 
	 */
	constructor(from : ClauseNode, to : ClauseNode){
		this._from = from
		this._to = to

		this._svg = document.createElementNS("http://www.w3.org/2000/svg","g")
		this._svg.classList.add("Edge")
		this._outerLine = document.createElementNS("http://www.w3.org/2000/svg","line")
		this._outerLine.classList.add("Edge", "Line", "Outer")
		this._edgeLine = document.createElementNS("http://www.w3.org/2000/svg","line")
		this._edgeLine.classList.add("Edge", "Line", "Inner")
		this._arrowTip = document.createElementNS("http://www.w3.org/2000/svg","polygon")
		this._arrowTip.classList.add("Edge", "ArrowTip")

		this._svg.append(this._outerLine, this._edgeLine, this._arrowTip)
	}

	/**
	 * Updates all the properties of the SVG DOM representations of this edge
	 */
	updateSVG(){
		const line = this.NodeIntersection()
		//TODO: find a better alternative, that hides or removes the arrow
		if(!line)return

		this._outerLine.setAttribute("x1", `${line.start.x}`)
		this._outerLine.setAttribute("y1", `${line.start.y}`)
		this._outerLine.setAttribute("x2", `${line.end.x}`)
		this._outerLine.setAttribute("y2", `${line.end.y}`)
		this._edgeLine .setAttribute("x1", `${line.start.x}`)
		this._edgeLine .setAttribute("y1", `${line.start.y}`)
		this._edgeLine .setAttribute("x2", `${line.end.x}`)
		this._edgeLine .setAttribute("y2", `${line.end.y}`)

		//draw arrow tip pointing to this._to
		const tipPointsLineStartDir = scalarMult(normalizedVector((subtract({x:0,y:0},vectorForm(line).direction) as Vector)), TIPSIZE)
		if(isNaN(tipPointsLineStartDir.x))return
		const tipPointsLine = pointForm({start : add(line.end,tipPointsLineStartDir) as Point, direction : orthogonalVector(tipPointsLineStartDir)})
		const tipPoint1 = getPointOnLine(tipPointsLine,.5,true)
		const tipPoint2 = getPointOnLine(tipPointsLine,-.5,true)
		this._arrowTip.setAttribute("points", `${line.end.x},${line.end.y} ${tipPoint1.x},${tipPoint1.y} ${tipPoint2.x},${tipPoint2.y}`)
	}


	/**
	 * Finds the line between the border of the {@link _from | start node} and the {@link _to | end node},
	 * so that they "point" to the middle of both nodes
	 * 
	 * This function should, in practice, always be able find a line. But theoretically, the math could fail. If that happens, we return undefined
	 * 
	 * It should be noted that this functions assumes that the border is a rectangle, even though the actual border in {@link _svg} has rounded corners
	 * This is done because it's easier that way lol.
	 * 
	 * @returns A line connecting the borders of the 2 nodes in this edge
	 */
	NodeIntersection() : Line|undefined{
		// helper consts
		const fromWidth = this._from.width
		const fromHeight = this._from.height
		const toWidth = this._to.width
		const toHeight = this._to.height

		//lines between the 2 nodes
		const edgePoints : Line = {start : this._from.center, end : this._to.center} 

		//border lines of _from node
		const ulFrom : Point = this._from.position
		const dlFrom : Point = add(ulFrom, {x : 0, y : fromHeight}) as Point
		const urFrom : Point = add(ulFrom, {x : fromWidth, y : 0}) as Point
		const drFrom : Point = add(ulFrom, {x : fromWidth, y : fromHeight}) as Point

		//dont change order!
		const fromNodeBorderLines : Line[] = [
			{start: ulFrom, end : dlFrom},
			{start: dlFrom, end : drFrom},
			{start: urFrom, end : ulFrom},
			{start: drFrom, end : urFrom},
		]

		//border lines of _to node
		const ulTo : Point = this._to.position
		const dlTo : Point = add(ulTo, {x : 0, y : toHeight}) as Point
		const urTo : Point = add(ulTo, {x : toWidth, y : 0}) as Point
		const drTo : Point = add(ulTo, {x : toWidth, y : toHeight}) as Point
		
		//dont change order
		const toNodeBorderLines : Line[] = [
			{start: ulTo, end : dlTo},
			{start: dlTo, end : drTo},
			{start: urTo, end : ulTo},
			{start: drTo, end : urTo},
		]

		function lineIntersection(e : Line, n : Line ) : Point|undefined{
			const divisor = (e.start.x-e.end.x) * (n.start.y-n.end.y) - (e.start.y-e.end.y) * (n.start.x-n.end.x)
			//if(divisor === 0)return undefined
			const t =  ((e.start.x-n.start.x) * (n.start.y-n.end.y) - (e.start.y-n.start.y) * (n.start.x-n.end.x))/divisor
			const u = -((e.start.x-e.end.x) * (e.start.y-n.start.y) - (e.start.y-e.end.y) * (e.start.x-n.start.x))/divisor
			if(0 <= t && t <= 1 && 0 <= u && u <= 1) return {x : e.start.x+t*(e.end.x-e.start.x), y : e.start.y+t*(e.end.y-e.start.y)}
			return undefined
		}
		
		//start and end point of the node intersection
		let start : Point|undefined = undefined
		let end   : Point|undefined = undefined
		
		
		for (let i = 0; i < fromNodeBorderLines.length; i++) {
			//go through every possible pair of border lines that can contain the start and end point of the node intersection
			const lineFrom = fromNodeBorderLines[i];
			const lineTo = toNodeBorderLines[i];

			const isFrom = lineIntersection(edgePoints,lineFrom)
			const isTo = lineIntersection(edgePoints,lineTo)
			if(isFrom)	
				start = isFrom
			if(isTo)
				end = isTo
		}

		if(start == undefined || end == undefined) return undefined
		return {start, end}
	}
	
	public get svg() : SVGGElement{
		return this._svg
	}

	/**
	 * Checks if we have {@link node} at one of the ends 
	 * 
	 * @param node The node we might have a connection with
	 * @returns true if this edge has the node
	 */
	public connects(node : ClauseNode){
		return this._to === node || this._from === node 
	}
}
