import {Mixed} from "@taintflow/types";
import * as _ from "lodash";

export interface Template {
    operators: ReadonlyArray<string>;
    expression(operator: string): string;
}

export interface Operators<Operator> {
    readonly [operator: string]: Operator;
}

export function compile({operators, expression}: Template): Operators<Mixed> {
    return <Operators<Mixed>> <unknown> _(operators)
        .keyBy()
        .mapValues(expression)
        .mapValues(compileExpression)
        .pickBy()
        .value();
}

// `@babel/types` lists AST-level operators that are not usable as plain
// expression operators (e.g. the `throw` unary and the `|>` pipeline binary
// added in Babel 7). Compiling those into a function body is a syntax error,
// so we skip any operator whose generated source fails to parse instead of
// letting it crash module initialisation.
function compileExpression(source: string): Mixed | undefined {
    try {
        // tslint:disable-next-line: no-eval
        return eval(source);
    } catch (error) {
        if (error instanceof SyntaxError) {
            return undefined;
        }
        throw error;
    }
}
