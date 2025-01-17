import * as _ from "lodash";

import {
    EvaluatedExpression,
    Mixed,
    nodes,
    PropertyReference,
    QuotedExpression,
    ValueKind,
} from "@taintflow/types";

import { reflection } from "../../reflection";
import { Boxed, Flow } from "../Flow";
import { wrap, WrappedPropertyReference } from "./wrap";

const functionPrototypeCall = Function.prototype.call;
const functionPrototypeApply = Function.prototype.apply;
const arrayPrototypePush = Array.prototype.push;

export class PropagationStrategy {
    private flow?: Flow<Mixed>;
    private shouldReleaseThis?: boolean;
    private shouldReleaseArguments?: boolean;
    private objBaseFlow?: Flow<Mixed>;

    public attach(node: nodes.Node): typeof node {
        if (nodes.isMember(node)) {
            return this.attachMember(node);
        }
        const attached = this.attachGeneric(node);
        if (nodes.isCallable(attached)) {
            return this.attachCallable(attached);
        }
        return attached;
    }

    public propagate<T>(result: EvaluatedExpression<T>): typeof result {
        const { flow, objBaseFlow } = this;
        if (!flow) {
            return result;
        }
        const val = result.value;
        if (typeof val === "boolean") {
            return result;
        }
        if (result.kind === ValueKind.PropertyReference) {
            let baseWrapper;
            if (objBaseFlow) {
                baseWrapper = (value: T) => objBaseFlow.alter(value).watch();
            }
            const val = result.value;
            if (val instanceof Boxed && val.flow) {
                return wrap(
                    result,
                    this.defaultPropagateWrapper(val.flow),
                    baseWrapper
                );
            }
            return wrap(
                result,
                this.defaultPropagateWrapper(flow),
                baseWrapper
            );
        }
        return wrap(result, this.defaultPropagateWrapper(flow));
    }

    private defaultPropagateWrapper<T>(flow: Flow<Mixed>) {
        return (value: T) =>
            this.shouldReleaseArguments && Array.isArray(value)
                ? <T>(<Mixed>value.map((e) => flow.alter(e).watch()))
                : flow.alter(value).watch();
    }

    private attachMember(node: nodes.MemberNode): typeof node {
        return {
            ...node,
            object: () => this.attachObject(node.object()),
            property: () => this.attachProperty(node.property()),
        };
    }

    private attachObject(object: EvaluatedExpression<Mixed>) {
        return wrap(object, (value) => {
            if (value instanceof Boxed) {
                const flow = value.flow;
                this.objBaseFlow = flow;
                this.flow = flow;
                return flow.release();
            }
            return value;
        });
    }

    private attachProperty<T>(property: EvaluatedExpression<T>) {
        return this.attachEvaluated(property);
    }

    private attachGeneric(node: nodes.Node): typeof node {
        return <nodes.Node>(
            (<unknown>_(node).mapValues(this.attachIfQuoted.bind(this)).value())
        );
    }

    private attachCallable(node: nodes.CallableNode): typeof node {
        return {
            ...node,
            callee: () => this.attachCallee(node.callee()),
            arguments: () => this.attachArguments(node.arguments()),
        };
    }

    private defaultAttachCalleeWrapper() {
        return (func: Mixed) => {
            this.shouldReleaseThis =
                _.isFunction(func) && !reflection.isInstrumented(func);
            this.shouldReleaseArguments =
                (func === arrayPrototypePush) ? false : this.shouldReleaseThis;
            return func;
        };
    }

    private attachCallee(callee: EvaluatedExpression<Mixed>) {
        if (callee.kind === ValueKind.PropertyReference) {
            return this.attachPropRefCallee(callee);
        }
        return wrap(callee, this.defaultAttachCalleeWrapper());
    }

    private attachPropRefCallee(callee: PropertyReference<Mixed, Mixed>) {
        const base = callee.base;
        if (_.isFunction(base)) {
            const value = callee.value;
            if (
                value === functionPrototypeApply ||
                value === functionPrototypeCall
            ) {
                return wrap(callee, (func) => {
                    this.shouldReleaseThis =
                        _.isFunction(func) && !reflection.isInstrumented(base);
                    this.shouldReleaseArguments =
                        (base === arrayPrototypePush)
                            ? false
                            : this.shouldReleaseThis;
                    return func;
                });
            }
            return wrap(callee, this.defaultAttachCalleeWrapper());
        }
        if (callee instanceof WrappedPropertyReference) {
            return wrap(callee, this.defaultAttachCalleeWrapper(), (value) => {
                if (_.isUndefined(this.shouldReleaseThis)) {
                    throw new Error(
                        '"callee.value" should be accessed before "callee.base".'
                    );
                }
                return this.shouldReleaseThis ? this.release(value) : value;
            });
        }
        return wrap(callee, this.defaultAttachCalleeWrapper());
    }

    private attachArguments(args: ReadonlyArray<EvaluatedExpression<Mixed>>) {
        return args.map((evaluated) => this.attachArgument(evaluated));
    }

    private attachArgument<T>(argument: EvaluatedExpression<T>) {
        return wrap(argument, (value) => {
            if (_.isUndefined(this.shouldReleaseArguments)) {
                throw new Error(
                    '"callee" should be unquoted before "arguments".'
                );
            }
            return this.shouldReleaseArguments ? this.release(value) : value;
        });
    }

    private attachIfQuoted(value: Mixed, property: nodes.NodeProperty) {
        if (!isQuotedExpression(value, property)) {
            return value;
        }
        return this.attachQuoted(value);
    }

    private attachQuoted<T>(quoted: QuotedExpression<T>) {
        return () => this.attachEvaluated(quoted());
    }

    private attachEvaluated<T>(evaluated: EvaluatedExpression<T>) {
        return wrap(evaluated, (value) => this.release(value));
    }

    private release<T>(value: Boxed<T> | T) {
        if (value instanceof Boxed) {
            this.flow = value.flow;
            return value.flow.release();
        }
        return value;
    }
}

function isQuotedExpression<T>(
    value: Mixed,
    property: nodes.NodeProperty
): value is QuotedExpression<T> {
    return _.isFunction(value) && property !== "arguments";
}
