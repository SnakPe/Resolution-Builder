
class ResolutionGraph{
	private _nodes : Map<Clause,ClauseNode> = new Map()
	private _edges : Edge[] = []

	svg : SVGSVGElement

	private draggedNode? : ClauseNode

	constructor(svg : SVGSVGElement){
		this.svg = svg
		svg.addEventListener("pointermove",(ev) => {
			if(this.draggedNode)
				this.setPosition(this.draggedNode, ev.offsetX-this.draggedNode.width/2, ev.offsetY-this.draggedNode.height/2)
		})
		this.clear()
	}

	clear(){
		this._nodes = new Map<Clause,ClauseNode>()
		this._edges = []
		this.svg.innerHTML = ""
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
		newNode.svg.addEventListener("pointerdown", () => {
			this.draggedNode = newNode
		})
		newNode.svg.addEventListener("pointerup", () => {
			this.draggedNode = undefined
		})
		
		this.svg.appendChild(newNode.svg)
		newNode.updateSVG()
		this._nodes.set(newClause,newNode)

		if(resolvedClauses){
			console.assert(this._nodes.get(resolvedClauses[0]) !== undefined && this._nodes.get(resolvedClauses[1]) !== undefined)

			let newEdge = new Edge(this._nodes.get(resolvedClauses[0])!,newNode)
			this._edges.push(newEdge)
			this.svg.insertBefore(newEdge.svg,this.svg.firstChild)
			newEdge.updateSVG()
			
			newEdge = new Edge(this._nodes.get(resolvedClauses[1])!,newNode)
			this._edges.push(newEdge)
			this.svg.insertBefore(newEdge.svg,this.svg.firstChild)
			newEdge.updateSVG()

		}
		return newNode
	}

	setPosition(node : ClauseNode, x?: number, y?: number){
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