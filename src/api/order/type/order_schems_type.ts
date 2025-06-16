export interface PopulatedOrderItem {
  id: number;
  quantity: number;
  totalPrice: number;
  unitPrice: number;
  order: {
    id: number;
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    total_amount: number;
    customer: {
      id: number;
    };
  };
  product: {
    id: number;
    quantity: number;
    price: number;
    name: string;
  };
}
