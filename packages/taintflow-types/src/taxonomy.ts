export type Mixed = unknown;

export type QuotedExpression<Value> =
    () => EvaluatedExpression<Value>;

export type QuotedArgumentsExpression =
    () => ReadonlyArray<EvaluatedExpression<Mixed>>;

export type EvaluatedExpression<Value>
    = RValue<Value>
    | Reference<Value>;

export type Reference<Value>
    = Identifier<Value>
    | PropertyReference<Mixed, Value>;

export interface HasValue<T> {
    readonly value: T;
    readonly kind: ValueKind;
}

export enum ValueKind {
    RValue,
    Identifier,
    PropertyReference,
}

export class RValue<T> implements HasValue<T> {
    public readonly kind: ValueKind.RValue = ValueKind.RValue;
    public readonly value: T;

    constructor(value: T) {
        this.value = value;
    }
}

export class Identifier<T> implements HasValue<T> {
    public readonly kind: ValueKind.Identifier = ValueKind.Identifier;
    private readonly quotedValue: () => T;

    constructor(quotedValue: () => T) {
        this.quotedValue = quotedValue;
    }

    get value() {
        return this.quotedValue();
    }

    get isDeclared() {
        try {
            this.quotedValue();
        } catch (e) {
            return false;
        }
        return true;
    }
}

export class PropertyReference<Base, T> implements HasValue<T> {
    private readonly _base: Base;
    public readonly kind: ValueKind.PropertyReference
        = ValueKind.PropertyReference;
    public readonly propertyKey: PropertyKey;

    constructor(base: Base, propertyKey: PropertyKey) {
        this._base = base;
        this.propertyKey = propertyKey;
    }

    get base() {
        return this._base;
    }

    get value() {
        return Reflect.get(Object(this._base), this.propertyKey);
    }

    set value(value: T) {
        Reflect.set(Object(this._base), this.propertyKey, value);
    }
}
