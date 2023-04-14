import { types } from "babel-core";
import { NodePath } from "babel-traverse";

import { NodeReleaser } from "../interception";
import { NodePathInterceptor } from "./NodePathInterceptor";

const interceptor = new NodePathInterceptor((node) =>
    NodeReleaser.released(node)
);

export namespace DoWhileStatement {
    export function exit(path: NodePath<types.DoWhileStatement>) {
        interceptor.intercept(path.get("test"));
    }
}
