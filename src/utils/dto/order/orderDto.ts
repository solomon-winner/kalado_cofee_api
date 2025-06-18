// path: src/utils/order.dto.js

class OrderDTO {
  id: number | null;
  customer: { id: number | null; name: string } | null;
  retailer: { id: number | null; name: string } | null;
  totalAmount: number;
  orderedAt: string | null;
  status: string;
  shippmentAddress: { id: number | null; region: string } | null;
  phoneNumber: string;
  orderItems: {
    id: number | null;
    quantity: number;
    price: number;
    product: { id: number | null; name: string } | null;
  }[];
  paymentStatus: string;
  paymentMethod: string;
  paidAt: string | null;

  constructor(order: any = {}) {
    this.id = order.id ?? null;

    this.customer = order.customer
      ? {
          id: order.customer.id ?? null,
          name: order.customer.name ?? '',
        }
      : null;

    this.retailer = order.retailer
      ? {
          id: order.retailer.id ?? null,
          name: order.retailer.name ?? '',
        }
      : null;

    this.totalAmount = order.total_amount ?? 0;
    this.orderedAt = order.orderedAt ?? null;
    this.status = order.status ?? 'pending';

    this.shippmentAddress = order.shippment_address
      ? {
          id: order.shippment_address.id ?? null,
          region: order.shippment_address.region ?? '',
        }
      : null;

    this.phoneNumber = order.phoneNumber ?? '';

    this.orderItems = Array.isArray(order.order_items)
      ? order.order_items.map((item: any) => ({
          id: item.id ?? null,
          quantity: item.quantity ?? 0,
          price: item.price ?? 0,
          product: item.product
            ? {
                id: item.product.id ?? null,
                name: item.product.name ?? '',
              }
            : null,
        }))
      : [];

    this.paymentStatus = order.paymentStatus ?? 'unpaid';
    this.paymentMethod = order.paymentMethod ?? 'online';
    this.paidAt = order.paidAt ?? null;
  }
}

const OrderListDTO = (orders = []) => {
  return orders.map((order) => new OrderDTO(order));
};

module.exports = {
  OrderDTO,
  OrderListDTO,
};
