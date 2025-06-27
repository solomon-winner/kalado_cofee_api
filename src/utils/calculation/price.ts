export const CalculatePrice = (
  items: { price: number; quantity: number }[],
    taxRate: number = 0,
    discount: number = 0
): {
    totalPrice: number;
    tax: number;
    finalPrice: number;
    } => {
    const totalPrice = items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
    );
    
    const tax = totalPrice * taxRate;
    const finalPrice = totalPrice + tax - discount * totalPrice;

    return {
        totalPrice,
        tax,
        finalPrice,
    };
    }