const NODE_PADDING = 5 //in pixels

class ClauseNode{
	private _clause : Clause

	/**
	 * 0.Child is backbox : Rect
	 * 1.Child is text : Text
	 */
	private readonly _svg : SVGGElement
	private readonly _backborder : SVGRectElement
	private readonly _text : SVGTextElement

	/**@ignore probably unneccesary, since no big calculations are needed */
	private readonly _coords : Point

	constructor(clause : Clause, x : number, y : number){
		this._clause = clause
		this._svg = document.createElementNS("http://www.w3.org/2000/svg","g")
		this._svg.classList.add("Node")

		this._text = document.createElementNS("http://www.w3.org/2000/svg","text")
		this._text.classList.add("Text")
		this._text.textContent = clause.toString()
		
		this._backborder = document.createElementNS("http://www.w3.org/2000/svg","rect")
		this._backborder.classList.add("Box")

		this._svg.append(this._backborder,this._text)

		this._coords = {x,y}
	}

	public updateSVG(){
		this._backborder.setAttribute("width", `${this._text.getBBox().width + NODE_PADDING}`)
		this._backborder.setAttribute("height", `${this._text.getBBox().height + NODE_PADDING}`)
		this.setPosition(this._coords.x,this._coords.y)
	}

	/**
	 * Sets the {@link _coords| x- and y-coordinates} and updates the DOM representation to reflect the new position 
	 *  
	 * @param x x-coordinate   
	 * @param y y-coordinate
	 */

	public setPosition(x:number, y:number){

		if(x !== undefined){
			this._coords.x = x
			this._backborder.setAttribute("x", `${x}`)
			this._text.setAttribute("x", `${this.center.x}`)
		}
		if(y !== undefined){
			this._coords.y = y
			this._backborder.setAttribute("y", `${y}`)
			this._text.setAttribute("y", `${this.center.y}`)
		}

	}

	
	public get clause() : Clause {
		return this._clause
	}
	
	/**
	 * Look at {@link center} to get the actual center coordinates of the node
	 * 
	 * @returns The upper left corner of the node border in the graph 
	 */
	public get position() : Point {
		return this._coords
	}
	public get width() : number {
		return Number(this._backborder.getAttribute("width"))
	}
	public get height() : number {
		return Number(this._backborder.getAttribute("height")) 
	}
	
	public get svg() : SVGGElement {
		return this._svg
	}

	/**
	 * Look at {@link position} for the upper left corner coords of the node border
	 * 
	 * @returns The center position of the node 
	 */
	public get center() : Point {
		return add(this._coords,{x : this.width/2, y : this.height/2}) as Point
	}
	
	
}