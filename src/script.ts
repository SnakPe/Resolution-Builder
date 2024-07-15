

function getVariableFromString(variable : string){
	const ALPHABET = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"]
	switch(variable.length){

		case 0:
			console.error("warning: no variable when expected. Empty sets mean that resolution is not neccesary")
			alert("warning: no variable when expected. Empty sets mean that resolution is not neccesary")
		break

		case 1:
			var name = variable[0]
			if(ALPHABET.some(letter => letter == name))
				return {name : variable[0], isNegated : false} as Literal

			console.error("error: letter expected : ", variable[0])
			alert("error: letter expected : " + variable[0])
		break

		case 2:
			name = variable[1]
			if(variable[0] != '\u00AC'){				
				console.error("error: negation expected : ", variable[0])
				alert("error: negation expected : " + variable[0])
			}
			else if(!ALPHABET.some(letter => letter == name)){
				console.error("error: letter expected : ", name)
				alert("error: letter expected : " + name)
			}
			else
				return {name : variable[1], isNegated : true} as Literal	
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
function resolve(clauses : Clause[]) : Resolution[]{
	let result = [] as Resolution[]

	//compare all clauses with each other
	clauses.forEach((clause1,index) => {
		for(let i = index+1; i < clauses.length; i++){
			let clause2 = clauses[i]

			//compare the variables of 2 clauses with each other
			
			let char1Index = 0, char2Index = 0
			while(char1Index < clause1.vars.length && char2Index < clause2.vars.length){
				const var1 = clause1.vars[char1Index]
				const var2 = clause2.vars[char2Index]

				if(var1.name == var2.name){
					if(var2.isNegated != var1.isNegated){
						const genClause = clause1.resolveWith(clause2,var1)
						if(!(clauses.some(clause => clause.equals(genClause)) || result.some(res => res.result.equals(genClause)))){
							result.push({c1 : clause1, c2 : clause2, result : genClause})
							break; // we cannot resolve 2 clauses twice, so we move on to the next clause
						}
					}
					char1Index++; //since a clause can only have one of every variable, if we find the same name once, we won't find it again later. So we can move on to the next variable 
				}

				//bc the clauses are sorted, we only need to increase the index with the "smaller" character as a name
				//e.g: if we compare var1 = A and var2 = B, we know that no second character after B is going to be A, it could on be a character between C and Z 
				if(var1.name.charCodeAt(0) < var2.name.charCodeAt(0))
					char1Index++
				else 
					char2Index++
			}


			/* OLD CODE, LESS EFFICIENT */
			// for(let char1Index = 0; char1Index < clause1.vars.length;char1Index++){
			// 	const var1 = clause1.vars[char1Index]
			// 	for(let char2Index = 0; char2Index < clause2.vars.length; char2Index++){ 
			// 		const var2 = clause2.vars[char2Index]

			// 		if(var1.name == var2.name){
			// 			if(var2.isNegated != var1.isNegated){
			// 				const genClause = clause1.resolveWith(clause2,var1)
			// 				if(!(clauses.some(clause => clause.equals(genClause)) || result.some(clause => clause.equals(genClause)))){
			// 					result.push(genClause)
			// 					char1Index = clause1.vars.length // we cannot resolve 2 clauses twice, so we move on to the next clause
			// 					break
			// 				}
			// 			}
			// 			//c2Index++ //if c2Index is declared before c1Index  
			// 			break //since a clause can only have one of every variable, if we find the same name once, we won't find it again later 
			// 		}

			// 	}


			// }


		}
	})
	// console.log("resolve: generated clauses: ", result)

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
			break;
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
			if(variable.isNegated)result += "\u00AC"
			result += variable.name
			result += ","
		})
		if(clause.vars.length != 0)result = result.substring(0,result.length-1)
		result += "}, "
	})
	result = result.substring(0,result.length-2)
	return result
}

let graph : ResolutionGraph



onload = function(){
	graph = new ResolutionGraph(document.getElementsByTagNameNS("http://www.w3.org/2000/svg","svg")[0] as SVGSVGElement)
	document.getElementById("SetInputButton")?.addEventListener("click",()=>{
		graph.clear()

		let input = (document.getElementById("SetInput")as HTMLInputElement).value
		
		input = input.replaceAll(" ","")
		input = input.replaceAll("-","\u00AC")
		input = input.toUpperCase()

		input = rmOuterBrackets(input)
		const rawClauses = input.split("},{")
		
		const clauses = getClausesFromStrings(rawClauses)
		
		let xPos = 20
		clauses.forEach((c,index) => {
			const node = graph.addClause(20+index*100,20,c)
			graph.setNodePosition(node,xPos)
			xPos += node.width + 20
		})
		let generatedResolutions : Resolution[]
		let level = 1;
		do{
			generatedResolutions = resolve(clauses)
			if((this.document.getElementById("RedundantClauseCheckbox") as HTMLInputElement).checked)
				generatedResolutions = generatedResolutions.filter(res => !res.result.isRedundant())

			clauses.push(...generatedResolutions.map((res) => res.result))

			//TODO: set x and y correctly. 
			xPos = 20
			for (let i = 0; i < generatedResolutions.length; i++) {
				const res = generatedResolutions[i];
				const node = graph.addClause(0, 20+(level)*150, res.result, [res.c1,res.c2])
				graph.setNodePosition(node,xPos)
				xPos += node.width + 20
				
			}

			level++
		}while(generatedResolutions.length != 0)
		
	})
	document.getElementById("ClearButton")?.addEventListener("click", () => graph.clear())
}


//Some test inputs
// { {A, B}, {A,¬B}, {¬A, B}, {¬A,¬B} }
//{{A, B, C, D}, {A, ¬C, D}, {A, B, ¬D}, {¬B, C, D}, {¬A, ¬D}, {¬B, ¬C}, {¬A, C}}
//{{¬A, ¬B, ¬H}, {C, D}, {E, ¬F, ¬G}, {¬B, ¬D, ¬E}, {¬C, F, H}, {A, B, D}, {¬A, E, G}}