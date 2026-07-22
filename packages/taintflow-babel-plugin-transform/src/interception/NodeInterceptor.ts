import { types } from "@babel/core";
import template from "@babel/template";

import { astify, NamedExpressions } from "./astify";
import { literals } from "./literals";
import { quotedExpressions } from "./quoted";

export class NodeInterceptor<T extends types.Node> {
    protected readonly node: T;

    constructor(node: T) {
        this.node = node;
    }

    public static intercepted<T extends types.Node>(node: T) {
        return new this(node).intercepted();
    }

    public intercepted() {
        return Nodes.interceptor(this.description());
    }

    protected description(): NamedExpressions {
        return {
            ...literals(this.node),
            ...quotedExpressions(this.node),
        };
    }
}

namespace Templates {
    export type Interceptor = (nodes: {
        DESCRIPTION: types.ObjectExpression;
    }) => types.ExpressionStatement;

    export const interceptor = <Interceptor>(
        (<{}>template("taintflow.intercept(DESCRIPTION).value"))
    );
}

namespace Nodes {
    export function interceptor(description: NamedExpressions) {
        return Templates.interceptor({ DESCRIPTION: astify(description) })
            .expression;
    }
}
