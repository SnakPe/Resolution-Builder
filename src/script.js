"use strict";
function getVariableFromString(variable) {
    const ALPHABET = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    switch (variable.length) {
        case 0:
            console.error("warning: no variable when expected. Empty sets mean that resolution is not neccesary");
            alert("warning: no variable when expected. Empty sets mean that resolution is not neccesary");
            break;
        case 1:
            var name = variable[0];
            if (ALPHABET.some(letter => letter == name))
                return { name: variable[0], isNegated: false };
            console.error("error: letter expected : ", variable[0]);
            alert("error: letter expected : " + variable[0]);
            break;
        case 2:
            name = variable[1];
            if (variable[0] != '\u00AC') {
                console.error("error: negation expected : ", variable[0]);
                alert("error: negation expected : " + variable[0]);
            }
            else if (!ALPHABET.some(letter => letter == name)) {
                console.error("error: letter expected : ", name);
                alert("error: letter expected : " + name);
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
    let result = new Clause();
    clause.split(",").forEach(var1 => {
        let convVar = getVariableFromString(var1);
        if (convVar && !result.vars.some(var2 => var2 == convVar))
            result.insertVariable(convVar);
    });
    return result;
}
function getClausesFromStrings(clauses) {
    let result = [];
    clauses.forEach(clause => {
        const newClause = getClauseFromString(clause);
        if (!result.some(clause => clause.equals(newClause)))
            result.push(newClause);
    });
    return result;
}
function resolve(clauses) {
    let result = [];
    clauses.forEach((clause1, index) => {
        for (let i = index + 1; i < clauses.length; i++) {
            let clause2 = clauses[i];
            let char1Index = 0, char2Index = 0;
            while (char1Index < clause1.vars.length && char2Index < clause2.vars.length) {
                const var1 = clause1.vars[char1Index];
                const var2 = clause2.vars[char2Index];
                if (var1.name == var2.name) {
                    if (var2.isNegated != var1.isNegated) {
                        const genClause = clause1.resolveWith(clause2, var1);
                        if (!(clauses.some(clause => clause.equals(genClause)) || result.some(res => res.result.equals(genClause)))) {
                            result.push({ c1: clause1, c2: clause2, result: genClause });
                            break;
                        }
                    }
                    char1Index++;
                }
                if (var1.name.charCodeAt(0) < var2.name.charCodeAt(0))
                    char1Index++;
                else
                    char2Index++;
            }
        }
    });
    console.log("resolve: generated clauses: ", result);
    return result;
}
function rmOuterBrackets(input) {
    while (input.substring(0, 2) == "{{") {
        if (input.substring(input.length - 2, input.length) == "}}")
            input = input.substring(2, input.length - 2);
        else {
            console.error("outer brackets not complete");
            alert("error: outer brackets not complete");
            break;
        }
    }
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
    let result = "";
    clauses.forEach(clause => {
        result += "{";
        clause.vars.forEach(variable => {
            if (variable.isNegated)
                result += "\u00AC";
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
let graph;
onload = function () {
    graph = new ResolutionGraph(document.getElementsByTagNameNS("http://www.w3.org/2000/svg", "svg")[0]);
    document.getElementById("SetInputButton")?.addEventListener("click", () => {
        graph.clear();
        let input = document.getElementById("SetInput").value;
        console.log("Raw Input: " + input);
        input = input.replaceAll(" ", "");
        input = input.replaceAll("-", "\u00AC");
        input = input.toUpperCase();
        console.log("Input: " + input);
        input = rmOuterBrackets(input);
        const rawClauses = input.split("},{");
        console.log("Raw Clauses: ", rawClauses);
        const clauses = getClausesFromStrings(rawClauses);
        console.log("Clauses: ", clauses);
        const node = document.createElement("div");
        node.innerHTML = getStringFromClauses(clauses);
        document.getElementsByTagName("body")[0].appendChild(node);
        let generatedResolutions;
        let level = 0;
        do {
            generatedResolutions = resolve(clauses);
            let generatedNewClauses = generatedResolutions.map((res) => res.result);
            if (this.document.getElementById("RedundantClauseCheckbox").checked)
                generatedNewClauses = generatedNewClauses.filter(clause => !clause.isRedundant());
            clauses.push(...generatedNewClauses);
            let node = document.createElement("div");
            node.innerHTML = getStringFromClauses(clauses);
            document.getElementsByTagName("body")[0].appendChild(node);
            generatedResolutions.forEach((res, index) => graph.addClause(10 + index * 50, 10 + level * 20, res.result, [res.c1, res.c2]));
            level++;
        } while (generatedResolutions.length != 0);
    });
};
setInterval(() => { document.getElementById("SetInputButton").style.backgroundColor = Math.floor(Math.random() * 16777215).toString(16); }, 0);
