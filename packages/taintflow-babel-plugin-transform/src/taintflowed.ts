import {transform, types} from "babel-core";

import {plugin} from "./plugin";

export function taintflowed(source: string) {
    const {ast, code} = transform(source, {
        plugins: [
            // tslint:disable-next-line
            require("babel-plugin-transform-es2015-arrow-functions"),
            require("./assignment-transformation.js").default,
            plugin,
        ],
    });
    return {
        ast: <types.Node> ast,
        code: <string> code,
    };
}
