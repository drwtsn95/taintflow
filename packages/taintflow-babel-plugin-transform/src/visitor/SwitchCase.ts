import { types } from "babel-core";
import { NodePath } from "babel-traverse";

import { NodeReleaser } from "../interception";
import { NodePathInterceptor } from "./NodePathInterceptor";

const interceptor = new NodePathInterceptor((node) =>
    NodeReleaser.released(node)
);

export namespace SwitchCase {
    export function exit(path: NodePath<types.SwitchCase>) {
        interceptor.intercept(path.get("test"));
    }
}
