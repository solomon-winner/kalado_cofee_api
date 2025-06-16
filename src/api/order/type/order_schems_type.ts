export interface PopulatedOrder {
  id: number;
  total_amount: number;
  order_items: {
    id: number;
    quantity: number;
    product: {
      id: number;
      name: string;
      price: number;
    };
  }[];
}