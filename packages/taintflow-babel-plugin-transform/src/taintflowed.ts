import {transformSync, types} from "@babel/core";

import {plugin} from "./plugin";

export function taintflowed(source: string) {
    const result = transformSync(source, {
        ast: true,
        babelrc: false,
        configFile: false,
        plugins: [
            // tslint:disable-next-line
            require("@babel/plugin-transform-arrow-functions").default,
            require("./assignment-transformation.js").default,
            plugin,
        ],
    });
    if (result === null) {
        throw new Error("Babel transform returned no result.");
    }
    return {
        ast: <types.Node> <{}> result.ast,
        code: <string> result.code,
    };
}
