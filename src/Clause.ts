

class Clause{
	/**
	 * A list of all the literals in the clause 
	 */
	readonly literals : Literal[]

	constructor(vars? : Literal[]|string){
		if(!vars)
			this.literals = [] as Literal[]
		else if(typeof vars == "string")
			this.literals = getClauseFromString(vars).literals
		else this.literals = vars
		this.sortLexically()
	}

	/**
	 * 
	 * @returns A string showing the clause in the clausal form 
	 */
	toString(){
		let result = "{"

		for(let i = 0; i < this.literals.length-1; i++){
			if(this.literals[i].isNegated) result += "\u00AC"
			result += this.literals[i].name
			result += ", "
		}
		if(this.literals[this.literals.length-1]?.isNegated) result += "\u00AC"
		result += this.literals[this.literals.length-1] ? this.literals[this.literals.length-1].name : "" 

		result += "}"
		return result
	}

	/**
	 * A redundant clause is one that is equivalent to 1/true.
	 * This is the case when you have the same variable in a clause, but both negated and unnegated,
	 * so for example {A, -A} means (A or not A), with must always be true
	 * 
	 * @returns true if clause is redundant, else false
	 */
	isRedundant(){
		for(let i = 1; i < this.literals.length; i++)
			if(this.literals[i].name == this.literals[i-1].name)return true;
		
		return false;
	}

	/**
	 * Sorts the elements of {@link literals} depending on {@link Literal.name | its name} ascendingly
	 */
	sortLexically(){
		this.literals.sort((var1,var2) => var1.name.charCodeAt(0) - var2.name.charCodeAt(0))
	}

	/**
	 * Inserts a literal. If the literal is already in the clause, nothing happens
	 * 
	 * @param literal The new literal to be inserted
	 */
	insertLiteral(literal : Literal){
		if(!this.literals.some((v) => {return (v.name == literal.name && v.isNegated == literal.isNegated)})){
			this.literals.push(literal)
			this.sortLexically()
		}
	}

	equals(otherClause : Clause){
		if(this.literals.length != otherClause.literals.length)return false
		return !this.literals.some((var1) => {
			return !otherClause.literals.some((var2) => (var1.isNegated == var2.isNegated && var1.name == var2.name))
		})
	}

	/**
	 * 
	 * unneccesary
	 * @ignore
	 * @param otherClause 
	 * @returns 
	 */
	difference(otherClause : Clause){
		let result = Math.abs(otherClause.literals.length-this.literals.length)
		this.literals.forEach(var1 => {
			if(!otherClause.literals.some(var2 => (var1.name == var2.name && var1.isNegated == var2.isNegated)))
				result++
		})
		return result
	}

	/**
	 * resolves this clause with another clause, with respect to the {@link literal given variable} in this clause
	 * @param otherClause 
	 * @param literal 
	 * @returns A new clause derived from inference of the 2 clauses.
	 */
	resolveWith(otherClause : Clause, literal : Literal){
		let result = new Clause()
		this.literals.forEach(thisVar => {
			if(thisVar != literal)result.insertLiteral(thisVar)
		})
		otherClause.literals.forEach(otherVar => {
			// zur 2. Aussage: Bei der Resolution muss, wenn literal in this ist, bei der anderen Klausel die Variable mit der anderen Negation entfernt werden.
			// Wichtig bei Dingern wie (A, -A)
			if(otherVar.name != literal.name || literal.isNegated == otherVar.isNegated)result.insertLiteral(otherVar)
		})
		return result
	}
}