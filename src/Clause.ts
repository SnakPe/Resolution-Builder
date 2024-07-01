
class Clause{
	vars : Literal[]

	constructor(vars? : Literal[]|string){
		if(!vars)
			this.vars = [] as Literal[]
		else if(typeof vars == "string")
			this.vars = getClauseFromString(vars).vars
		else this.vars = vars
		this.sortLexically()
	}

	toString(){
		let result = "{"

		for(let i = 0; i < this.vars.length-1; i++){
			if(this.vars[i].isNegated) result += "\u00AC"
			result += this.vars[i].name
			result += ", "
		}
		if(this.vars[this.vars.length-1]?.isNegated) result += "\u00AC"
		result += this.vars[this.vars.length-1] ? this.vars[this.vars.length-1].name : "" 

		result += "}"
		return result
	}

	isRedundant(){
		for(let i = 1; i < this.vars.length; i++)
			if(this.vars[i].name == this.vars[i-1].name)return true;
		
		return false;
	}

	sortLexically(){
		this.vars.sort((var1,var2) => var1.name.charCodeAt(0) - var2.name.charCodeAt(0))
	}

	insertVariable(variable : Literal){
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
	resolveWith(otherClause : Clause, variable : Literal){
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