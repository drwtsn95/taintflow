export * from "./taxonomy";
export * from "./interception";

import * as nodes from "./nodes";
export {nodes};

import { Identifier as defaultIdentifier } from "./taxonomy";

export let identifier: typeof defaultIdentifier = defaultIdentifier;

export function replaceIdentifier(newIdentifier: typeof defaultIdentifier) {
    identifier = newIdentifier;
}

export { identifier as Identifier };
