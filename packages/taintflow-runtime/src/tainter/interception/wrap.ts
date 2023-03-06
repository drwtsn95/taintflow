import {
    EvaluatedExpression,
    Identifier,
    PropertyReference,
    RValue,
    ValueKind,
} from "@taintflow/types";

export type Wrapper<T> = (value: T) => T;
export type Callback<T> = (value: T) => void;

export function wrap<T>(evaluated: EvaluatedExpression<T>, wrapper: Wrapper<T>):
                typeof evaluated {
    switch (evaluated.kind) {
        case ValueKind.RValue:
            return new RValue(wrapper(evaluated.value));
        case ValueKind.Identifier:
            return new Identifier(() => wrapper(evaluated.value));
        case ValueKind.PropertyReference:
            return new WrappedPropertyReference(evaluated, wrapper);
        default:
            throw new Error("Invalid kind of EvaluatedExpression.");
    }
}

export class WrappedPropertyReference<Base, T> extends PropertyReference<Base, T> {
    private readonly origin: PropertyReference<Base, T>;
    private readonly wrapper: Wrapper<T>;
    private readonly callback?: Callback<T>;

    constructor(origin: PropertyReference<Base, T>, wrapper: Wrapper<T>, callback?: Callback<T>) {
        super(origin.base, origin.propertyKey);
        this.origin = origin;
        this.wrapper = wrapper;
        if (callback) {
            this.callback = callback;
        }
    }

    public get value() {
        return this.wrapper(this.origin.value);
    }

    public set value(value: T) {
        if (this.callback) {
            this.callback(value);
        }
        this.origin.value = value;
    }
}
