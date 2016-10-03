import "mocha";

import {should} from "chai";
should();

import {MemberExpression, Identifier, RValue} from "../taintflow-runtime";

describe("MemberExpression", () => {
    context("like foo.bar", () => {
        type Foo = {bar: string};

        let foo: Foo;
        let expr: MemberExpression<Foo, string>;

        beforeEach(() => {
            foo = {bar: "baz"};
            expr = new MemberExpression({
                object: () => new Identifier(() => foo),
                property: () => new RValue("bar"),
            });
        });

        it("should evaluate", () => {
            expr.evaluate().value.should.equal(foo.bar);
        });

        it("should be assignable", () => {
            const next = "next";
            expr.evaluate().value = next;
            foo.bar.should.equal(next);
        });
    });
});
