import { createSlice } from "@reduxjs/toolkit";

// Helper function: Load cart safely from localStorage
const loadCartFromStorage = () => {
    try {
        const saved = localStorage.getItem("cartItems");
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Error reading cart from localStorage:", error);
        return [];
    }
};

// Helper function: Save cart safely to localStorage
const saveToLocalStorage = (cartItems) => {
    try {
        localStorage.setItem("cartItems", JSON.stringify(cartItems));
    } catch (error) {
        console.error("Error saving cart to localStorage:", error);
    }
};

// Helper function: Generate a unique ID for each cart line item
export const generateCartItemId = (item) => {
    const productId = item.id ?? "unknown";
    const variantId = item.CoffeeVariantId ?? item.coffee_variant_id ?? "default";
    const sugar = Number(item.sugar_percent ?? 100);
    return `${productId}_${variantId}_${sugar}`;
};

// Helper function: Calculate item totals with discount and tax
export const calculateItemTotals = (unitPrice, qty, discountPercent = 0, taxPercent = 0) => {
    const price = Number(unitPrice) || 0;
    const quantity = Math.max(1, Number(qty) || 1);
    const discPct = Math.min(Math.max(Number(discountPercent) || 0, 0), 100);
    const txPct = Math.max(Number(taxPercent) || 0, 0);

    const rawTotal = price * quantity;
    const discountAmount = (rawTotal * discPct) / 100;
    const afterDiscount = Math.max(rawTotal - discountAmount, 0);
    const taxAmount = (afterDiscount * txPct) / 100;
    const subTotal = Number((afterDiscount + taxAmount).toFixed(2));

    return {
        rawTotal: Number(rawTotal.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),
        taxAmount: Number(taxAmount.toFixed(2)),
        subTotal,
    };
};

const initialState = {
    items: loadCartFromStorage(),
};

export const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addToCart: (state, action) => {
            const product = action.payload;
            if (!product || !product.id) return;

            const cartItemId = product.cartItemId || generateCartItemId(product);
            const unitPrice = Number(product.UnitPrice ?? product.price ?? 0);
            const addQty = Math.max(1, Number(product.Quantity || product.qty || 1));
            const sugar = Number(product.sugar_percent ?? 100);
            const variantId = product.CoffeeVariantId ?? product.coffee_variant_id ?? null;
            const discountPercent = Number(product.discound_item || 0);
            const taxPercent = Number(product.tax_item || 0);

            const existingItem = state.items.find((item) => {
                if (item.cartItemId && item.cartItemId === cartItemId) return true;
                return (
                    item.id === product.id &&
                    (item.CoffeeVariantId ?? null) === (variantId ?? null) &&
                    Number(item.sugar_percent ?? 100) === sugar
                );
            });

            if (existingItem) {
                const newQty = (Number(existingItem.qty) || 0) + addQty;
                existingItem.qty = newQty;
                existingItem.Quantity = newQty;
                const totals = calculateItemTotals(
                    existingItem.UnitPrice,
                    newQty,
                    existingItem.discound_item ?? discountPercent,
                    existingItem.tax_item ?? taxPercent
                );
                existingItem.rawTotal = totals.rawTotal;
                existingItem.discount_amount = totals.discountAmount;
                existingItem.tax_amount = totals.taxAmount;
                existingItem.SubTotal = totals.subTotal;
            } else {
                const totals = calculateItemTotals(unitPrice, addQty, discountPercent, taxPercent);
                state.items.push({
                    ...product,
                    cartItemId,
                    CoffeeVariantId: variantId,
                    coffee_variant_id: variantId,
                    variantName: product.variantName || "Default",
                    sugar_percent: sugar,
                    UnitPrice: unitPrice,
                    price: unitPrice,
                    qty: addQty,
                    Quantity: addQty,
                    discound_item: discountPercent,
                    tax_item: taxPercent,
                    rawTotal: totals.rawTotal,
                    discount_amount: totals.discountAmount,
                    tax_amount: totals.taxAmount,
                    SubTotal: totals.subTotal,
                });
            }

            saveToLocalStorage(state.items);
        },

        increaseQty: (state, action) => {
            const target = action.payload;
            if (!target) return;

            const targetId = target.cartItemId || generateCartItemId(target);
            const item = state.items.find((i) => (i.cartItemId || generateCartItemId(i)) === targetId);

            if (item) {
                const newQty = (Number(item.qty) || 0) + 1;
                item.qty = newQty;
                item.Quantity = newQty;
                const totals = calculateItemTotals(
                    item.UnitPrice,
                    newQty,
                    item.discound_item,
                    item.tax_item
                );
                item.rawTotal = totals.rawTotal;
                item.discount_amount = totals.discountAmount;
                item.tax_amount = totals.taxAmount;
                item.SubTotal = totals.subTotal;
            }

            saveToLocalStorage(state.items);
        },

        decreaseQty: (state, action) => {
            const target = action.payload;
            if (!target) return;

            const targetId = target.cartItemId || generateCartItemId(target);
            const itemIndex = state.items.findIndex((i) => (i.cartItemId || generateCartItemId(i)) === targetId);

            if (itemIndex !== -1) {
                const currentQty = Number(state.items[itemIndex].qty) || 1;
                if (currentQty > 1) {
                    const item = state.items[itemIndex];
                    const newQty = currentQty - 1;
                    item.qty = newQty;
                    item.Quantity = newQty;
                    const totals = calculateItemTotals(
                        item.UnitPrice,
                        newQty,
                        item.discound_item,
                        item.tax_item
                    );
                    item.rawTotal = totals.rawTotal;
                    item.discount_amount = totals.discountAmount;
                    item.tax_amount = totals.taxAmount;
                    item.SubTotal = totals.subTotal;
                } else {
                    state.items.splice(itemIndex, 1);
                }
            }

            saveToLocalStorage(state.items);
        },

        removeFromCart: (state, action) => {
            const target = action.payload;
            if (!target) return;

            const targetId = target.cartItemId || generateCartItemId(target);
            state.items = state.items.filter((i) => (i.cartItemId || generateCartItemId(i)) !== targetId);
            saveToLocalStorage(state.items);
        },

        clearCart: (state) => {
            state.items = [];
            try {
                localStorage.removeItem("cartItems");
            } catch (error) {
                console.error("Error clearing cartItems from localStorage:", error);
            }
        },
    },
});

// Main Actions
export const {
    addToCart,
    increaseQty,
    decreaseQty,
    removeFromCart,
    clearCart,
} = cartSlice.actions;

// Aliases for backward compatibility with previous code
export const addTocart = addToCart;
export const increasQty = increaseQty;
export const decreaasQty = decreaseQty;

// Selectors
export const selectCartItems = (state) => state.cart?.items || [];
export const selectTotalQty = (state) =>
    (state.cart?.items || []).reduce((acc, item) => acc + Number(item.qty || item.Quantity || 0), 0);
export const selectTotalPrice = (state) =>
    (state.cart?.items || []).reduce(
        (total, item) => total + Number(item.SubTotal ?? (Number(item.UnitPrice || item.price || 0) * Number(item.qty || item.Quantity || 1))),
        0
    );
export const selectRawSubtotal = (state) =>
    (state.cart?.items || []).reduce(
        (total, item) => total + Number(item.UnitPrice || item.price || 0) * Number(item.qty || item.Quantity || 1),
        0
    );
export const selectTotalDiscount = (state) =>
    (state.cart?.items || []).reduce(
        (total, item) => total + Number(item.discount_amount || 0),
        0
    );
export const selectTotalTax = (state) =>
    (state.cart?.items || []).reduce(
        (total, item) => total + Number(item.tax_amount || 0),
        0
    );

export default cartSlice.reducer;
