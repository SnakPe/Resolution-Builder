/**
 * Creates a graph to show all the possible new clauses that can be derived with resolution
 * 
 * Nodes represent clauses, edges show the 2 clauses needed to get a new clause
 * The 2 "parent edges" of a child have the same colour, to help the user see what 2 clauses were used to generate the new clause
 * 
 * If there are multiple ways of getting the same new Clause, only the first way is shown
 */
class ResolutionGraph{
	/**
	 * Saves {@link Clause | Clauses} and their corresponding {@link ClauseNode}
	 */
	private _nodes : Map<Clause,ClauseNode> = new Map()

	/**
	 * Saves all edges of the graph 
	 */
	private _edges : Edge[] = []

	/**
	 * The svg DOM element showing the graph. 
	 */
	private readonly _svg : SVGSVGElement

	/**
	 * Saves the node a user pressed on, or undefined otherwise
	 */
	private _draggedNode? : ClauseNode
	/**
	 * The x-position of our "camera" on the graph  
	 */
	private _x : number = 0
	/**
	 * The y-position of our "camera" on the graph  
	 */
	private _y : number = 0
	/**
	 * The amount of zoom we have. The smaller the number, the more zoomed in we are
	 */
	private _zoom : number = 1

	/**
	 * 
	 * @param svg the SVG DOM element used to represent the entire graph field.
	 *   Should usualy be document.getElementById("ResolutionTree")
	 */
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
			let speed = Math.abs(ev.deltaY/100)**1.5
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

	/**
	 * Cleares the entire graph. Both the internal nodes and edges, and the DOM representation are deleted
	 */
	clear(){
		this._nodes = new Map<Clause,ClauseNode>()
		this._edges = []
		this._svg.innerHTML = ""
	}

	/**
	 * update properties of {@link _svg} when the properties of this class changes
	 */
	refreshSVG(){
		const width = this._svg.width.baseVal.value * this._zoom
		const height = this._svg.height.baseVal.value * this._zoom

		if(height > 0 && width > 0)
			this._svg.setAttribute("viewBox", `${this._x} ${this._y} ${width} ${height}`)
	}
	/**
	 * Creates a new Node for a Clause. 
	 * If the {@link newClause} was derived through resolution, {@link resolvedClauses} also needs to be provided
	 * 
	 * 
	 * @param resolvedClauses If {@link newClause} was derived by resolution, saves the 2 clauses used for it
	 * @returns A new node for {@link newClause}
	 */
	addClause(x : number, y : number, newClause : Clause, resolvedClauses? : [Clause,Clause]){
		if(this._nodes.has(newClause))console.warn("Already existing node has been added to graph")
		const newNode = new ClauseNode(newClause, x, y)
		
		//save node for dragging it when user presses on it
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

		//create edges for clauses derived from resolution
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

	/**
	 * Sets the position of a node. Also updates all the edges connected to the {@link node}  
	 * 
	 * @param node The node where we change the position
	 * @param x The new x-Position of the node 
	 * @param y The new y-Position of the node
	 */
	setNodePosition(node : ClauseNode, x: number, y: number){
		node.setPosition(x,y)
		this.getEdgesConnectingNode(node).forEach(edge => edge.updateSVG())
	}

	/**
	 * Tries to find a node in this graph that represents the {@link clause} 
	 * 
	 * @param clause A clause lol
	 * @returns The corresponding node in the graph, or undefined if {@link clause} cannot be found inside of the graph 
	 */
	getNode(clause : Clause){
		return this._nodes.get(clause)
	}
	
	/**
	 * Finds all edges that has {@link node}
	 * 
	 * @param node A node in this graph
	 * @returns All edges of this graph containing {@link node}. Returns an empty array in none are found. 
	 */
	private getEdgesConnectingNode(node : ClauseNode) : Edge[]{
		return this._edges.filter(edge => edge.connects(node))
	}
	
}