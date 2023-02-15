export namespace reflection {
    const functionToString = Function.prototype.toString;
    export function isInstrumented(f: Function) {
        return !/{ \[native code\] }$/.test(functionToString.call(f)) || Object.prototype.hasOwnProperty.call(f, '0-tf-instrumented-1');
    }
}
