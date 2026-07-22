import {types} from "@babel/core";
import template from "@babel/template";

import {
    isEvaluatedExpressionValueAccessor,
    removeAccessor,
} from "./EvaluatedExpressionValueAccessor";

export class EvaluatedExpression {
    private readonly origin: types.Expression;

    constructor(origin: types.Expression) {
        this.origin = origin;
    }

    public get ast() {
        if (isEvaluatedExpressionValueAccessor(this.origin)) {
            return removeAccessor(this.origin);
        }
        if (types.isIdentifier(this.origin)) {
            return Expressions.identifier(this.origin);
        }
        return Expressions.rvalue(this.origin);
    }
}

namespace Templates {
    export type Identifier =
        (nodes: {IDENTIFIER: types.Identifier}) => types.ExpressionStatement;
    export type RValue =
        (nodes: {EXPRESSION: types.Expression}) => types.ExpressionStatement;

    export const identifier = <Identifier> <{}>
        template("new taintflow.Identifier(() => IDENTIFIER)");
    export const rvalue = <RValue> <{}>
        template("new taintflow.RValue(EXPRESSION)");
}

namespace Expressions {
    export function identifier(id: types.Identifier) {
        return Templates.identifier({IDENTIFIER: id}).expression;
    }

    export function rvalue(expression: types.Expression) {
        return Templates.rvalue({EXPRESSION: expression}).expression;
    }
}
