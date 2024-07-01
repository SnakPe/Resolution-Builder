
class ResolutionGraph{
	private _nodes : Map<Clause,ClauseNode> = new Map()
	private _edges : Edge[] = []

	private _svg : SVGSVGElement

	private _draggedNode? : ClauseNode
	private _x : number = 0
	private _y : number = 0


	constructor(svg : SVGSVGElement){
		
		this._svg = svg
		
		svg.addEventListener("pointerdown", () => {
			this._draggedNode = undefined
		})
		svg.addEventListener("pointermove",(ev) => {
			console.log(ev.buttons)
			if(this._draggedNode)
				this.setNodePosition(this._draggedNode, this._x + ev.offsetX-this._draggedNode.width/2, this._y + ev.offsetY-this._draggedNode.height/2)
			else{
				if(ev.buttons === 1){
					this._x -= ev.movementX
					this._y -= ev.movementY
					svg.setAttribute("viewBox", `${this._x} ${this._y} ${svg.width.animVal.value} ${svg.height.animVal.value}`)
				}
			}
		})
		this.clear()
	}

	clear(){
		this._nodes = new Map<Clause,ClauseNode>()
		this._edges = []
		this._svg.innerHTML = ""
	}
	/**
	 * creates a new Node for a Clause, 
	 * 
	 * @param resolvedClauses if clause was made by resolving 2 Clauses, add these here
	 * @returns new node for {@link newClause|the given clause}
	 */
	addClause(x : number, y : number, newClause : Clause, resolvedClauses? : [Clause,Clause]){
		if(this._nodes.has(newClause))console.warn("Already existing node has been added to graph")
		const newNode = new ClauseNode(newClause, x, y)
		newNode.svg.addEventListener("pointerdown", (ev) => {
			this._draggedNode = newNode
			ev.stopPropagation()
		})
		newNode.svg.addEventListener("pointerup", (ev) => {
			this._draggedNode = undefined
			ev.stopPropagation()
		})
		
		this._svg.appendChild(newNode.svg)
		newNode.updateSVG()
		this._nodes.set(newClause,newNode)

		if(resolvedClauses){
			console.assert(this._nodes.get(resolvedClauses[0]) !== undefined && this._nodes.get(resolvedClauses[1]) !== undefined)

			let newEdge = new Edge(this._nodes.get(resolvedClauses[0])!,newNode)
			this._edges.push(newEdge)
			this._svg.insertBefore(newEdge.svg,this._svg.firstChild)
			newEdge.updateSVG()
			
			newEdge = new Edge(this._nodes.get(resolvedClauses[1])!,newNode)
			this._edges.push(newEdge)
			this._svg.insertBefore(newEdge.svg,this._svg.firstChild)
			newEdge.updateSVG()

		}
		return newNode
	}

	setNodePosition(node : ClauseNode, x?: number, y?: number){
		node.setPosition(x,y)
		this.getEdgesConnectingNode(node).forEach(edge => edge.updateSVG())
	}


	
	getNode(clause : Clause){
		return this._nodes.get(clause)
	}
	
	private getEdgesConnectingNode(node : ClauseNode) : Edge[]{
		return this._edges.filter(edge => edge.connects(node))
	}
	
}