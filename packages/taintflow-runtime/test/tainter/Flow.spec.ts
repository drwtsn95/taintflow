import { should } from "chai";
import "mocha";

import { Flow } from "../../src";
import { run } from "../sandbox";

should();

describe("Flow", () => {
    context("ordinary string", () => {
        it("should not be recognized as tainted", () => {
            run(() => Flow.of("").isTainted).should.be.false;
        });

        it("should be released as it is", () => {
            run(() => Flow.of("test").release()).should.equal("test");
        });

        it("should be watched as it is", () => {
            run(() => Flow.of("test").watch()).should.equal("test");
        });
    });

    context("tainted string", () => {
        it("should be recognized as tainted", () => {
            run(() => Flow.of(Flow.tainted("")).isTainted).should.be.true;
        });

        it("should have string type", () => {
            run(() => typeof Flow.tainted("")).should.equal("string");
        });

        it("should proxify `toString` method call", () => {
            run(() => Flow.tainted("test").toString()).should.equal("test");
        });

        it("should propagate after concatenation", () => {
            // tslint:disable-next-line: prefer-template
            run(() => Flow.of(Flow.tainted("") + "").isTainted).should.be.true;
        });

        it("should propagate when getting property", () => {
            run(() => {
                return Flow.of(Flow.tainted("").length).isTainted;
            }).should.be.true;
        });

        it("should propagate after the method call", () => {
            run(() => {
                return Flow.of(Flow.tainted("a1#b2").slice(3)).isTainted;
            }).should.be.true;
        });

        it("should propagate to called function as an argument", () => {
            run(() => {
                const isFlowedInto = <T>(x: T) => Flow.of(x).isTainted;
                return isFlowedInto(Flow.tainted(""));
            }).should.be.true;
        });

        it("should propagate after addition assignment", () => {
            run(() => {
                let accumulator = {text: "biba"};
                accumulator.text += Flow.tainted("boba");
                return (
                    Flow.of(accumulator.text).isTainted &&
                    Flow.of(accumulator.text).release() === "bibaboba"
                );
            }).should.be.true;
        });
    });

    context("tainted value interacting with native API", () => {
        it("should pass to native function as an argument", () => {
            run(() => parseInt(Flow.tainted("1"), 10)).should.equal(1);
        });
    });

    it("should propagate when getting property by tainted name", () => {
        run(() => {
            const method = {}[Flow.tainted("toString")];
            return Flow.of(method).isTainted;
        }).should.be.true;
    });

    context("tainted property in tainted object", () => {
        it("should remain the same after tainting", () => {
            run(() => {
                return Flow.tainted({ foo: Flow.tainted("bar") }).foo === "bar";
            }).should.be.true;
        });

        it("should not be retainted by the object", () => {
            run(() => {
                const taintedProp = Flow.of("bar").taint("prop").watch();
                const taintedObj = Flow.of({ foo: taintedProp })
                    .taint("obj")
                    .watch();
                return Flow.of(taintedObj.foo).source?.meta === "prop";
            }).should.be.true;
        });
    });

    // This test fails because vm sandbox rewrites base object's prototypes
    // context("instrumented function called via context linking methods", () => {
    //     it("should propagate arguments into f.call() if f is instrumented", () => {
    //         run(() => {
    //             let y;
    //             const f = function (x: string) {
    //                 y = x.split(" ");
    //             };
    //             f.call({}, Flow.tainted("test 123"));
    //             return Flow.of(y).isTainted;
    //         }).should.be.true;
    //     });
    // });
    // TODO: add same test for apply

    context("calling methods of tainted object", () => {
        it("should propagate tainted `this` into instrumented methods", () => {
            run(() => {
                let global: unknown;
                Flow.tainted({
                    foo() {
                        global = this;
                    },
                }).foo();
                return Flow.of(global).isTainted;
            }).should.be.true;
        });
    });

    context("native methods", () => {
        it("should not taint Array return value but taint each of Array elements", () => {
            run(() => {
                return Flow.tainted("a#b")
                    .split("#")
                    .every((x) => Flow.of(x).isTainted);
            }).should.be.true;
        });

        // This test fails because vm sandbox rewrites base object's prototypes
        // it("should not release arguments in Array.prototype.push", () => {
        //     run(() => {
        //         let arr = [];
        //         arr.push(Flow.tainted("direct"));
        //         Array.prototype.push.call(arr, Flow.tainted("via_call"));
        //         Array.prototype.push.apply(arr, [Flow.tainted("via_apply")]);
        //         return arr.every((x) => Flow.of(x).isTainted);
        //     }).should.be.true;
        // });
    });
});
