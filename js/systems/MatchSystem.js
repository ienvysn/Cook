export class MatchSystem {
    static evaluate(servedItemType, servedToppings, order) {
        const baseType = servedItemType.replace('plated-', '');
        const baseTypeCorrect = (baseType === order.baseType);

        if (!baseTypeCorrect) {
            return {
                success: false,
                baseTypeCorrect: false,
                toppingAccuracy: 0,
                payment: 0,
                tipEligible: false,
                breaksCombo: true,
                countsAsPerfectForMilestone: false,
                missingToppings: [],
                extraToppings: []
            };
        }

        const reqToppings = order.requestedToppings || [];
        
        let correctToppings = 0;
        const servedCopy = [...servedToppings];
        const missingToppings = [];
        const extraToppings = [];
        
        for (const t of reqToppings) {
            const idx = servedCopy.indexOf(t);
            if (idx !== -1) {
                correctToppings++;
                servedCopy.splice(idx, 1);
            } else {
                missingToppings.push(t);
            }
        }
        
        extraToppings.push(...servedCopy);
        
        let toppingAccuracy = 1.0;
        const maxLen = Math.max(reqToppings.length, servedToppings.length);
        if (maxLen > 0) {
            toppingAccuracy = correctToppings / maxLen;
        }

        const basePrice = 100;
        const MIN_PARTIAL_PAYMENT_FLOOR = 0.2;
        const paymentMultiplier = Math.max(toppingAccuracy, MIN_PARTIAL_PAYMENT_FLOOR);
        const payment = Math.floor(basePrice * paymentMultiplier);

        const isPerfect = toppingAccuracy === 1.0;

        return {
            success: true,
            baseTypeCorrect: true,
            toppingAccuracy: toppingAccuracy,
            payment: payment,
            tipEligible: isPerfect,
            breaksCombo: false,
            countsAsPerfectForMilestone: isPerfect,
            missingToppings: missingToppings,
            extraToppings: extraToppings
        };
    }
}
