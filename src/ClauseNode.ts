const NODE_PADDING = 5 //px

class ClauseNode{
	private _clause : Clause

	/**
	 * 0.Child is backbox : Rect
	 * 1.Child is text : Text
	 */
	private _svg : SVGGElement
	private _backbox : SVGRectElement
	private _text : SVGTextElement

	/**@ignore probably unneccesary, since no big calculations are needed */
	private _coords : Point

	constructor(clause : Clause, x : number, y : number){
		this._clause = clause
		this._svg = document.createElementNS("http://www.w3.org/2000/svg","g")
		this._svg.classList.add("Node")

		this._text = document.createElementNS("http://www.w3.org/2000/svg","text")
		this._text.classList.add("Text")
		this._text.textContent = clause.toString()
		
		this._backbox = document.createElementNS("http://www.w3.org/2000/svg","rect")
		this._backbox.classList.add("Box")

		this._svg.append(this._backbox,this._text)
		

		this._coords = {x,y}
	}

	public updateSVG(){
		this._backbox.setAttribute("width", `${this._text.getBBox().width + NODE_PADDING}`)
		this._backbox.setAttribute("height", `${this._text.getBBox().height + NODE_PADDING}`)
		this.setPosition(this._coords.x,this._coords.y)
	}

	/**
	 * 
	 * @param x 
	 * @param y 
	 */

	public setPosition(x:number, y:number){

		if(x !== undefined){
			this._coords.x = x
			this._backbox.setAttribute("x", `${x}`)
			this._text.setAttribute("x", `${this.center.x}`)
		}
		if(y !== undefined){
			this._coords.y = y
			this._backbox.setAttribute("y", `${y}`)
			this._text.setAttribute("y", `${this.center.y}`)
		}

	}

	
	public get clause() : Clause {
		return this._clause
	}
	

	public get position() : Point {
		return this._coords
	}
	public get width() : number {
		return Number(this._backbox.getAttribute("width"))
	}
	public get height() : number {
		return Number(this._backbox.getAttribute("height")) 
	}
	
	public get svg() : SVGGElement {
		return this._svg
	}

	
	public get center() : Point {
		return add(this._coords,{x : this.width/2, y : this.height/2}) as Point
	}
	
	
}