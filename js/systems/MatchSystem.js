export class MatchSystem {
    static evaluate(servedItemType, order) {
        // v1: boolean match only (baseType equality)
        const success = (servedItemType === order.baseType);
        return {
            success: success,
            payment: success ? 100 : 0
        };
    }
}
