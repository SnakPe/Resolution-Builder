
class ResolutionGraph{
	private _nodes : Map<Clause,ClauseNode> = new Map()
	private _edges : Edge[] = []

	private _svg : SVGSVGElement

	private _draggedNode? : ClauseNode
	private _x : number = 0
	private _y : number = 0
	private _zoom : number = 1

	constructor(svg : SVGSVGElement){
		
		this._svg = svg

		//stop body from scrolling when hovering over it
		svg.addEventListener("pointerover", () => {
			document.getElementsByTagName("body")[0].style.overflow = "hidden"
		})
		svg.addEventListener("pointerout", () => {
			document.getElementsByTagName("body")[0].style.overflow = "auto"
		})

		
		svg.addEventListener("pointerdown", () => {
			this._draggedNode = undefined
		})

		//move node if one was clicked on, or mode entire view
		svg.addEventListener("pointermove",(ev) => {
			if(this._draggedNode !== undefined){
				const nodeX = (this._x) + this._zoom*ev.offsetX-this._draggedNode.width /2
				const nodeY = (this._y) + this._zoom*ev.offsetY-this._draggedNode.height/2
				this.setNodePosition(
					this._draggedNode, 
					nodeX, 
					nodeY
				)
			}
			else{
				if(ev.buttons === 1){
					this._x -= ev.movementX*this._zoom
					this._y -= ev.movementY*this._zoom
					this.refreshSVG()
				}
			}
		})
		// zoom in/out
		svg.addEventListener("wheel",(ev) => {
			let speed = (ev.deltaY/100)**2
			speed = ev.deltaY < 0 ? -speed : speed
			const newZoom = this._zoom+speed//alternatively: this.zoom*(1+speed)

			if(this._svg.width.baseVal.value * newZoom > 0.5){
				const oldZoom = this._zoom
				this._zoom = newZoom
				
				//zooms into/out of the middle of the canvas
				this._x += this._svg.width.baseVal.value * (oldZoom-this._zoom) / 2
				this._y += this._svg.height.baseVal.value * (oldZoom-this._zoom) / 2
			}
			this.refreshSVG()
		})

		this.clear()
	}

	clear(){
		this._nodes = new Map<Clause,ClauseNode>()
		this._edges = []
		this._svg.innerHTML = ""
	}

	refreshSVG(){
		const width = this._svg.width.baseVal.value * this._zoom
		const height = this._svg.height.baseVal.value * this._zoom

		if(height > 0 && width > 0)
			this._svg.setAttribute("viewBox", `${this._x} ${this._y} ${width} ${height}`)
	}
	/**
	 * creates a new Node for a Clause, 
	 * 
	 * 
	 * @param resolvedClauses if clause was made by resolving 2 Clauses, add these here
	 * @returns new node for {@link newClause|the given clause}
	 */
	addClause(x : number, y : number, newClause : Clause, resolvedClauses? : [Clause,Clause]){
		if(this._nodes.has(newClause))console.warn("Already existing node has been added to graph")
		const newNode = new ClauseNode(newClause, x, y)
		
		//save node as being selected for dragging
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

			const randomColor = `#${Math.floor(Math.random()*16777216).toString(16).padStart(6,"0")}`

			let newEdge = new Edge(this._nodes.get(resolvedClauses[0])!,newNode)
			this._edges.push(newEdge)
			this._svg.insertBefore(newEdge.svg,this._svg.firstChild)
			newEdge.svg.style.stroke = randomColor
			newEdge.updateSVG()
			
			newEdge = new Edge(this._nodes.get(resolvedClauses[1])!,newNode)
			this._edges.push(newEdge)
			this._svg.insertBefore(newEdge.svg,this._svg.firstChild)
			newEdge.svg.style.stroke = randomColor
			newEdge.updateSVG()

		}
		return newNode
	}

	setNodePosition(node : ClauseNode, x: number, y: number){
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