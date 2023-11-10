type Variable = {name : string, isNegated : boolean}

class Clause{
	vars : Variable[]
	svg : SVGGElement

	constructor(vars? : Variable[]|string){
		if(!vars)
			this.vars = [] as Variable[]
		else if(typeof vars == "string")
			this.vars = getClauseFromString(vars).vars
		else this.vars = vars
		this.sortLexically()
	}

	asString(){
		let result = "{"

		for(let i = 0; i < this.vars.length-1; i++){
			if(this.vars[i].isNegated) result += "¬"
			result += this.vars[i].name
			result += ", "
		}
		if(this.vars[this.vars.length-1].isNegated) result += "¬"
		result += this.vars[this.vars.length-1].name

		result += "}"
		return result
	}

	sortLexically(){
		this.vars.sort((var1,var2) => var1.name.charCodeAt(0) - var2.name.charCodeAt(0))
	}

	insertVariable(variable : Variable){
		if(!this.vars.some((v) => {return (v.name == variable.name && v.isNegated == variable.isNegated)}))this.vars.push(variable)
		this.sortLexically()
	}

	equals(otherClause : Clause){
		if(this.vars.length != otherClause.vars.length)return false
		return !this.vars.some((var1) => {
			return !otherClause.vars.some((var2) => (var1.isNegated == var2.isNegated && var1.name == var2.name))
		})
	}

	/**
	 * unneccesary
	 * @param otherClause 
	 * @returns 
	 */
	difference(otherClause : Clause){
		let result = Math.abs(otherClause.vars.length-this.vars.length)
		this.vars.forEach(var1 => {
			if(!otherClause.vars.some(var2 => (var1.name == var2.name && var1.isNegated == var2.isNegated)))
				result++
		})
		return result
	}

	/**
	 * resolves this clause with another clause, with respect to a given variable in this clause
	 * @param otherClause 
	 * @param variable 
	 * @returns 
	 */
	resolveWith(otherClause : Clause, variable : Variable){
		let result = new Clause()
		this.vars.forEach(thisVar => {
			if(thisVar != variable)result.insertVariable(thisVar)
		})
		otherClause.vars.forEach(otherVar => {
			// zur 2. Aussage: Bei der Resolution muss, wenn variable in this ist, bei der anderen Klausel die Variable mit der anderen Negation entfernt werden, wichtig bei Dingern wie (A, -A)
			if(otherVar.name != variable.name || variable.isNegated == otherVar.isNegated)result.insertVariable(otherVar)
		})
		return result
	}
}


function getVariableFromString(variable : string){
	const ALPHABET = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"]
	switch(variable.length){

		case 0:
			console.error("warning: no variable when expected. Empty sets mean that resolution is not neccesary")
			alert("warning: no variable when expected. Empty sets mean that resolution is not neccesary")
		break

		case 1:
			let name = variable[0]
			if(ALPHABET.some(letter => letter == name))
				return {name : variable[0], isNegated : false} as Variable

			console.error("error: letter expected : ", variable[0])
			alert("error: letter expected : " + variable[0])
		break

		case 2:
			name = variable[1]
			if(variable[0] != '-' && variable[0] != '¬'){				
				console.error("error: negation expected : ", variable[0])
				alert("error: negation expected : " + variable[0])
			}
			else if(!ALPHABET.some(letter => letter == name)){
				console.error("error: letter expected : ", name)
				alert("error: letter expected : " + name)
			}
			else
				return {name : variable[1], isNegated : true} as Variable	
		break

		default:
			console.error("error: notation wrong:", variable)
			alert("error: notation wrong:" + variable)
		}
}

function getClauseFromString(clause : string){

	let result = new Clause()
	clause.split(",").forEach(var1 => {
		let convVar = getVariableFromString(var1)
		//if no error and no duplicate
		if(convVar && !result.vars.some(var2 => var2 == convVar))result.insertVariable(convVar)
	})
	result.svg = getClauseSVG(result)

	return result
}


function getClausesFromStrings(clauses : string[]){
	let result = [] as Clause[]
	clauses.forEach(clause => {
		const newClause = getClauseFromString(clause)
		if(!result.some(clause => clause.equals(newClause)))
			result.push(newClause)
	})
	return result
}
/**
 * returns ALL POSSIBLE generated clauses with Resolution 
 * @param clauses 
 * @returns 
 */
function resolve(clauses : Clause[]){
	let result = [] as Clause[]

	//compare all clauses with each other
	clauses.forEach((clause1,index) => {
		for(let i = index+1; i < clauses.length; i++){
			let clause2 = clauses[i]

			//compare the variables of 2 clauses with each other
			for(let c1Index = 0; c1Index < clause1.vars.length;c1Index++){
				const var1 = clause1.vars[c1Index]
				for(let c2Index = 0; c2Index < clause2.vars.length; c2Index++){ //bc the clauses are sorted, you should be able to declare c1Index before the first for loop(c1Index), to increase efficiency
					const var2 = clause2.vars[c2Index]

					if(var1.name == var2.name){
						if(var2.isNegated != var1.isNegated){
							const genClause = clause1.resolveWith(clause2,var1)
							if(!(clauses.some(clause => clause.equals(genClause)) || result.some(clause => clause.equals(genClause)))){
								result.push(genClause)
								c1Index = clause1.vars.length // we cannot resolve 2 clauses twice, so we move on to the next clause
								break
							}
						}
						//c2Index++ //if c2Index is declared before c1Index  
						break //since a clause can only have one of every variable, if we find the same name once, we won't find it again later 
					}

				}
			}


		}
	})
	console.log("resolve: generated clauses: ", result)

	return result
}


function rmOuterBrackets(input : string){
	//remove outer brackets of K(phi)
	while(input.substring(0,2) == "{{" ){
		if(input.substring(input.length-2,input.length) == "}}")
			input = input.substring(2,input.length-2)
		else{
			console.error("outer brackets not complete")
			alert("error: outer brackets not complete")
		}
	}
	//remove bracket of first and last clause for later use
	if(input[0] == '{'){
		if(input[input.length-1] == '}'){
			input = input.substring(1,input.length-1)
		}
		else {
			console.error("inner brackets not complete ")
			alert("error: inner brackets not complete")
		}
	}
	return input
}

function getStringFromClauses(clauses:Clause[]){
	let result = ""
	clauses.forEach(clause => {
		result += "{"
		clause.vars.forEach(variable => {
			if(variable.isNegated)result += "¬"
			result += variable.name
			result += ","
		})
		if(clause.vars.length != 0)result = result.substring(0,result.length-1)
		result += "}, "
	})
	result = result.substring(0,result.length-2)
	return result
}

let svg : SVGSVGElement

function drawClauseFromResolution(fromClause1 : Clause, fromClause2 : Clause, toClause : Clause){


	let line1 = document.createElementNS("http://www.w3.org/2000/svg", "line")
	line1.setAttribute("x1",(fromClause1.svg.firstChild as SVGRectElement).x.animVal.valueAsString)
	line1.setAttribute("x1",(fromClause1.svg.firstChild as SVGRectElement).y.animVal.valueAsString)
	line1.setAttribute("x1",(toClause.svg.firstChild as SVGRectElement).x.animVal.valueAsString)
	line1.setAttribute("x1",(toClause.svg.firstChild as SVGRectElement).y.animVal.valueAsString)
	
	
	let line2 = document.createElementNS("http://www.w3.org/2000/svg", "line")
	line1.setAttribute("x1",(fromClause2.svg.firstChild as SVGRectElement).x.animVal.valueAsString)
	line1.setAttribute("x1",(fromClause2.svg.firstChild as SVGRectElement).y.animVal.valueAsString)
	line1.setAttribute("x1",(toClause.svg.firstChild as SVGRectElement).x.animVal.valueAsString)
	line1.setAttribute("x1",(toClause.svg.firstChild as SVGRectElement).y.animVal.valueAsString)

	svg.append(line1,line2)
}

function getClauseSVG(clause : Clause){
	let result = document.createElementNS("http://www.w3.org/2000/svg", "g")
	result.classList.add("Clause")

	let backbox = document.createElementNS("http://www.w3.org/2000/svg", "rect")
	backbox.classList.add("ClauseBox")
	backbox.textContent = clause.asString()
	
	let text = document.createElementNS("http://www.w3.org/2000/svg", "text")
	text.classList.add("ClauseText")

	result.appendChild(backbox)
	result.appendChild(text)

	//svg.appendChild(result)
	return result
} 
onload = function(){
	svg = document.getElementsByTagName("svg")[0]
	document.getElementById("SetInputButton").addEventListener("click",()=>{
		
		let input = (document.getElementById("SetInput")as HTMLInputElement).value
		console.log("Raw Input: " + input)
		
		input = input.replaceAll(" ","")
		input = input.toUpperCase()
		console.log("Input: " + input)

		input = rmOuterBrackets(input)
		let rawClauses = input.split("},{")
		console.log("Raw Clauses: ", rawClauses)
		
		let clauses = getClausesFromStrings(rawClauses)
		console.log("Clauses: ", clauses)
		let node = document.createElement("div")
		node.innerHTML = getStringFromClauses(clauses)
		document.getElementsByTagName("body")[0].appendChild(node)
		
		drawNextLevel(clauses,0)

		let generatedClauses : Clause[]
		let level = 1;
		do{
			generatedClauses = resolve(clauses)
			clauses.push(...generatedClauses)
			
			console.log("Clauses after Resolution: ", clauses)
			let node = document.createElement("div")
			node.innerHTML = getStringFromClauses(clauses)
			document.getElementsByTagName("body")[0].appendChild(node)
		}while(generatedClauses.length != 0)
		
	})
}

setInterval(() => {document.getElementById("SetInputButton").style.backgroundColor = Math.floor(Math.random()*16777215).toString(16)}, 0)
// { {A, B}, {A,¬B}, {¬A, B}, {¬A,¬B} }