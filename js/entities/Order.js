export class Order {
    constructor(baseType, quantity = 1, requestedToppings = []) {
        this.baseType = baseType;
        this.requestedToppings = requestedToppings;
        this.quantity = quantity;
    }
}
