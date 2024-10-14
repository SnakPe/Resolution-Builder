type Alphabet = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z"

//Logic types
type Literal = {name : Alphabet, isNegated : boolean}
type Resolution = {c1 : Clause, c2 : Clause, result : Clause}