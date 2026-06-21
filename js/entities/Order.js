export class Order {
    constructor(baseType, quantity = 1) {
        this.baseType = baseType;
        this.requestedToppings = []; // Unused in sprint 2
        this.quantity = quantity;
    }
}
