export class Item {
    constructor(id, baseType) {
        this.id = id;
        this.baseType = baseType;
        this.state = 'idle'; // idle | cooking | ready
    }
}
