var Clause = /** @class */ (function () {
    function Clause(vars) {
        if (!vars)
            this.vars = [];
        else if (typeof vars == "string")
            this.vars = getClauseFromString(vars).vars;
        else
            this.vars = vars;
        this.sortLexically();
    }
    Clause.prototype.asString = function () {
        var result = "{";
        for (var i = 0; i < this.vars.length - 1; i++) {
            if (this.vars[i].isNegated)
                result += "¬";
            result += this.vars[i].name;
            result += ", ";
        }
        if (this.vars[this.vars.length - 1].isNegated)
            result += "¬";
        result += this.vars[this.vars.length - 1].name;
        result += "}";
        return result;
    };
    Clause.prototype.sortLexically = function () {
        this.vars.sort(function (var1, var2) { return var1.name.charCodeAt(0) - var2.name.charCodeAt(0); });
    };
    Clause.prototype.insertVariable = function (variable) {
        if (!this.vars.some(function (v) { return (v.name == variable.name && v.isNegated == variable.isNegated); }))
            this.vars.push(variable);
        this.sortLexically();
    };
    Clause.prototype.equals = function (otherClause) {
        if (this.vars.length != otherClause.vars.length)
            return false;
        return !this.vars.some(function (var1) {
            return !otherClause.vars.some(function (var2) { return (var1.isNegated == var2.isNegated && var1.name == var2.name); });
        });
    };
    /**
     * unneccesary
     * @param otherClause
     * @returns
     */
    Clause.prototype.difference = function (otherClause) {
        var result = Math.abs(otherClause.vars.length - this.vars.length);
        this.vars.forEach(function (var1) {
            if (!otherClause.vars.some(function (var2) { return (var1.name == var2.name && var1.isNegated == var2.isNegated); }))
                result++;
        });
        return result;
    };
    /**
     * resolves this clause with another clause, with respect to a given variable in this clause
     * @param otherClause
     * @param variable
     * @returns
     */
    Clause.prototype.resolveWith = function (otherClause, variable) {
        var result = new Clause();
        this.vars.forEach(function (thisVar) {
            if (thisVar != variable)
                result.insertVariable(thisVar);
        });
        otherClause.vars.forEach(function (otherVar) {
            // zur 2. Aussage: Bei der Resolution muss, wenn variable in this ist, bei der anderen Klausel die Variable mit der anderen Negation entfernt werden, wichtig bei Dingern wie (A, -A)
            if (otherVar.name != variable.name || variable.isNegated == otherVar.isNegated)
                result.insertVariable(otherVar);
        });
        return result;
    };
    return Clause;
}());
function getVariableFromString(variable) {
    var ALPHABET = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    switch (variable.length) {
        case 0:
            console.error("warning: no variable when expected. Empty sets mean that resolution is not neccesary");
            alert("warning: no variable when expected. Empty sets mean that resolution is not neccesary");
            break;
        case 1:
            var name_1 = variable[0];
            if (ALPHABET.some(function (letter) { return letter == name_1; }))
                return { name: variable[0], isNegated: false };
            console.error("error: letter expected : ", variable[0]);
            alert("error: letter expected : " + variable[0]);
            break;
        case 2:
            name_1 = variable[1];
            if (variable[0] != '-' && variable[0] != '¬') {
                console.error("error: negation expected : ", variable[0]);
                alert("error: negation expected : " + variable[0]);
            }
            else if (!ALPHABET.some(function (letter) { return letter == name_1; })) {
                console.error("error: letter expected : ", name_1);
                alert("error: letter expected : " + name_1);
            }
            else
                return { name: variable[1], isNegated: true };
            break;
        default:
            console.error("error: notation wrong:", variable);
            alert("error: notation wrong:" + variable);
    }
}
function getClauseFromString(clause) {
    var result = new Clause();
    clause.split(",").forEach(function (var1) {
        var convVar = getVariableFromString(var1);
        //if no error and no duplicate
        if (convVar && !result.vars.some(function (var2) { return var2 == convVar; }))
            result.insertVariable(convVar);
    });
    result.svg = getClauseSVG(result);
    return result;
}
function getClausesFromStrings(clauses) {
    var result = [];
    clauses.forEach(function (clause) {
        var newClause = getClauseFromString(clause);
        if (!result.some(function (clause) { return clause.equals(newClause); }))
            result.push(newClause);
    });
    return result;
}
/**
 * returns ALL POSSIBLE generated clauses with Resolution
 * @param clauses
 * @returns
 */
function resolve(clauses) {
    var result = [];
    //compare all clauses with each other
    clauses.forEach(function (clause1, index) {
        for (var i = index + 1; i < clauses.length; i++) {
            var clause2 = clauses[i];
            //compare the variables of 2 clauses with each other
            for (var c1Index = 0; c1Index < clause1.vars.length; c1Index++) {
                var var1 = clause1.vars[c1Index];
                var _loop_1 = function (c2Index) {
                    var var2 = clause2.vars[c2Index];
                    if (var1.name == var2.name) {
                        if (var2.isNegated != var1.isNegated) {
                            var genClause_1 = clause1.resolveWith(clause2, var1);
                            if (!(clauses.some(function (clause) { return clause.equals(genClause_1); }) || result.some(function (clause) { return clause.equals(genClause_1); }))) {
                                result.push(genClause_1);
                                c1Index = clause1.vars.length; // we cannot resolve 2 clauses twice, so we move on to the next clause
                                return "break";
                            }
                        }
                        return "break";
                    }
                };
                for (var c2Index = 0; c2Index < clause2.vars.length; c2Index++) {
                    var state_1 = _loop_1(c2Index);
                    if (state_1 === "break")
                        break;
                }
            }
        }
    });
    console.log("resolve: generated clauses: ", result);
    return result;
}
function rmOuterBrackets(input) {
    //remove outer brackets of K(phi)
    while (input.substring(0, 2) == "{{") {
        if (input.substring(input.length - 2, input.length) == "}}")
            input = input.substring(2, input.length - 2);
        else {
            console.error("outer brackets not complete");
            alert("error: outer brackets not complete");
        }
    }
    //remove bracket of first and last clause for later use
    if (input[0] == '{') {
        if (input[input.length - 1] == '}') {
            input = input.substring(1, input.length - 1);
        }
        else {
            console.error("inner brackets not complete ");
            alert("error: inner brackets not complete");
        }
    }
    return input;
}
function getStringFromClauses(clauses) {
    var result = "";
    clauses.forEach(function (clause) {
        result += "{";
        clause.vars.forEach(function (variable) {
            if (variable.isNegated)
                result += "¬";
            result += variable.name;
            result += ",";
        });
        if (clause.vars.length != 0)
            result = result.substring(0, result.length - 1);
        result += "}, ";
    });
    result = result.substring(0, result.length - 2);
    return result;
}
var svg;
function drawClauseFromResolution(fromClause1, fromClause2, toClause) {
    var line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line1.setAttribute("x1", fromClause1.svg.firstChild.x.animVal.valueAsString);
    line1.setAttribute("x1", fromClause1.svg.firstChild.y.animVal.valueAsString);
    line1.setAttribute("x1", toClause.svg.firstChild.x.animVal.valueAsString);
    line1.setAttribute("x1", toClause.svg.firstChild.y.animVal.valueAsString);
    var line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line1.setAttribute("x1", fromClause2.svg.firstChild.x.animVal.valueAsString);
    line1.setAttribute("x1", fromClause2.svg.firstChild.y.animVal.valueAsString);
    line1.setAttribute("x1", toClause.svg.firstChild.x.animVal.valueAsString);
    line1.setAttribute("x1", toClause.svg.firstChild.y.animVal.valueAsString);
    svg.append(line1, line2);
}
function getClauseSVG(clause) {
    var result = document.createElementNS("http://www.w3.org/2000/svg", "g");
    result.classList.add("Clause");
    var backbox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    backbox.classList.add("ClauseBox");
    backbox.textContent = clause.asString();
    var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.classList.add("ClauseText");
    result.appendChild(backbox);
    result.appendChild(text);
    //svg.appendChild(result)
    return result;
}
onload = function () {
    svg = document.getElementsByTagName("svg")[0];
    document.getElementById("SetInputButton").addEventListener("click", function () {
        var input = document.getElementById("SetInput").value;
        console.log("Raw Input: " + input);
        input = input.replaceAll(" ", "");
        input = input.toUpperCase();
        console.log("Input: " + input);
        input = rmOuterBrackets(input);
        var rawClauses = input.split("},{");
        console.log("Raw Clauses: ", rawClauses);
        var clauses = getClausesFromStrings(rawClauses);
        console.log("Clauses: ", clauses);
        var node = document.createElement("div");
        node.innerHTML = getStringFromClauses(clauses);
        document.getElementsByTagName("body")[0].appendChild(node);
        //drawNextLevel(clauses,0)
        var generatedClauses;
        var level = 1;
        do {
            generatedClauses = resolve(clauses);
            clauses.push.apply(clauses, generatedClauses);
            console.log("Clauses after Resolution: ", clauses);
            var node_1 = document.createElement("div");
            node_1.innerHTML = getStringFromClauses(clauses);
            document.getElementsByTagName("body")[0].appendChild(node_1);
        } while (generatedClauses.length != 0);
    });
};
setInterval(function () { document.getElementById("SetInputButton").style.backgroundColor = Math.floor(Math.random() * 16777215).toString(16); }, 0);
// { {A, B}, {A,¬B}, {¬A, B}, {¬A,¬B} }
//{{A, B, C, D}, {A, ¬C, D}, {A, B, ¬D}, {¬B, C, D}, {¬A, ¬D}, {¬B, ¬C}, {¬A, C}}
