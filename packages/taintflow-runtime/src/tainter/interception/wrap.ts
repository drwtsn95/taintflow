import {
    DefaultIdentifier as Identifier,
    EvaluatedExpression,
    PropertyReference,
    RValue,
    ValueKind,
} from "@taintflow/types";

export type Wrapper<T> = (value: T) => T;
export type Callback<T> = (value: T) => T;

export function wrap<T>(
    evaluated: EvaluatedExpression<T>,
    wrapper: Wrapper<T>,
    baseWrapper?: Wrapper<T>,
): typeof evaluated {
    switch (evaluated.kind) {
        case ValueKind.RValue:
            return new RValue(wrapper(evaluated.value));
        case ValueKind.Identifier:
            return new Identifier(() => wrapper(evaluated.value));
        case ValueKind.PropertyReference:
            return new WrappedPropertyReference(evaluated, wrapper, undefined, <Wrapper<typeof evaluated.base>>baseWrapper);
        default:
            throw new Error("Invalid kind of EvaluatedExpression.");
    }
}

export class WrappedPropertyReference<Base, T> extends PropertyReference<
    Base,
    T
> {
    private readonly origin: PropertyReference<Base, T>;
    private readonly wrapper: Wrapper<T>;
    private readonly callback?: Callback<T>;
    private baseWrapper?: Wrapper<Base>;

    constructor(
        origin: PropertyReference<Base, T>,
        wrapper: Wrapper<T>,
        callback?: Callback<T>,
        baseWrapper?: Wrapper<Base>
    ) {
        super(origin.base, origin.propertyKey);
        this.origin = origin;
        this.wrapper = wrapper;
        if (callback) {
            this.callback = callback;
        }
        if (baseWrapper) {
            this.baseWrapper = baseWrapper;
        }
    }

    public get base() {
        if (this.baseWrapper) {
            return this.baseWrapper(this.origin.base);
        }
        return this.origin.base;
    }

    public get value() {
        return this.wrapper(this.origin.value);
    }

    public set value(value: T) {
        if (this.callback) {
            this.origin.value = this.callback(value);
        } else {
            this.origin.value = value;
        }
    }
}
