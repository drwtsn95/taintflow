import {Visitor} from "@babel/traverse";

import * as visitor from "./visitor";

export function plugin(): {visitor: Visitor} {
    return {visitor};
}
