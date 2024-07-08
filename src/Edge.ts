const TIPSIZE = 15

class Edge{
	//edge ends
	private readonly _from : ClauseNode
	private readonly _to : ClauseNode

	//svg representations
	private readonly _svg : SVGGElement
	private readonly _outerLine : SVGLineElement
	private readonly _edgeLine : SVGLineElement
	private readonly _arrowTip : SVGPolygonElement

	//geometric abstraction for calculations
	private _line? : Line 

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

	updateSVG(){
		this._line = this.NodesIntersection()
		//TODO: find a better alternative, that hides or removes the arrow
		if(!this._line)return

		this._outerLine.setAttribute("x1", `${this._line.start.x}`)
		this._outerLine.setAttribute("y1", `${this._line.start.y}`)
		this._outerLine.setAttribute("x2", `${this._line.end.x}`)
		this._outerLine.setAttribute("y2", `${this._line.end.y}`)
		this._edgeLine.setAttribute("x1", `${this._line.start.x}`)
		this._edgeLine.setAttribute("y1", `${this._line.start.y}`)
		this._edgeLine.setAttribute("x2", `${this._line.end.x}`)
		this._edgeLine.setAttribute("y2", `${this._line.end.y}`)

		const tipPointsLineStartDir = scalarMult(normalizedVector((subtract({x:0,y:0},vectorForm(this._line).direction) as Vector)), TIPSIZE)
		if(isNaN(tipPointsLineStartDir.x))return
		const tipPointsLine = pointForm({start : add(this._line.end,tipPointsLineStartDir) as Point, direction : orthogonalVector(tipPointsLineStartDir)})
		const tipPoint1 = getPointOnLine(tipPointsLine,.5,true)
		const tipPoint2 = getPointOnLine(tipPointsLine,-.5,true)
		this._arrowTip.setAttribute("points", `${this._line.end.x},${this._line.end.y} ${tipPoint1.x},${tipPoint1.y} ${tipPoint2.x},${tipPoint2.y}`)
	}


	NodesIntersection() : Line|undefined{
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

		//dont change order
		const fromNodeBoxLines : Line[] = [
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
		const toNodeBoxLines : Line[] = [
			{start: ulTo, end : dlTo},
			{start: dlTo, end : drTo},
			{start: urTo, end : ulTo},
			{start: drTo, end : urTo},
		]

		function lineIntersection(e : Line, n : Line ) : {xShift : number, yShift : number}|undefined{
			const divisor = (e.start.x-e.end.x) * (n.start.y-n.end.y) - (e.start.y-e.end.y) * (n.start.x-n.end.x)
			//if(divisor === 0)return undefined
			const t =  ((e.start.x-n.start.x) * (n.start.y-n.end.y) - (e.start.y-n.start.y) * (n.start.x-n.end.x))/divisor
			const u = -((e.start.x-e.end.x) * (e.start.y-n.start.y) - (e.start.y-e.end.y) * (e.start.x-n.start.x))/divisor
			if(0 <= t && t <= 1 && 0 <= u && u <= 1) return {xShift : t*(e.end.x-e.start.x), yShift : t*(e.end.y-e.start.y)}
			return undefined
		}
		
		
		let x1 = NaN
		let y1 = NaN
		let x2 = NaN 
		let y2 = NaN 
		for (let i = 0; i < fromNodeBoxLines.length; i++) {
			const lineFrom = fromNodeBoxLines[i];
			const lineTo = toNodeBoxLines[i];
			const isFrom = lineIntersection(edgePoints,lineFrom)
			const isTo = lineIntersection(edgePoints,lineTo)
			if(isFrom){	
				x1 = edgePoints.start.x + isFrom.xShift
				y1 = edgePoints.start.y + isFrom.yShift
			}
			if(isTo){	
				x2 = edgePoints.start.x + isTo.xShift
				y2 = edgePoints.start.y + isTo.yShift
			}

		}
		if(isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return undefined
		return {start : {x : x1, y : y1}, end: {x : x2, y : y2}}
	}
	
	public get svg() : SVGGElement{
		return this._svg
	}
	public connects(node : ClauseNode){
		return this._to === node || this._from === node 
	}
	public setColor(){

	}
}
