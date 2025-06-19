// path: src/utils/order-item.dto.js

class OrderItemDTO {
  id: number | null;
  unitPrice: number;
  totalPrice: number;
  createdAt: string | null;
  updatedAt: string | null;
  quantity: number;

  constructor(item: any = {}) {
    this.id = item.id ?? null;
    this.unitPrice = item.unitPrice ?? 0;
    this.totalPrice = item.totalPrice ?? 0;
    this.createdAt = item.createdAt ?? null;
    this.updatedAt = item.updatedAt ?? null;
    this.quantity = item.quantity ?? 0;
  }
}

const OrderItemListDTO = (items = []) => {
  return items.map((item) => new OrderItemDTO(item));
};

module.exports = {
  OrderItemDTO,
  OrderItemListDTO,
};
