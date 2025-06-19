// path: src/utils/cart-item.dto.js

class CartItemDto {
  id: number | null;
  unitPrice: number;
  totalPrice: number;
  createdAt: string | null;
  updatedAt: string | null;
  quantity: number;
  product: {
    id: number | null;
    name: string;
    price: number;
    quantity: number;
    discount: number;
    createdAt: string | null;
    updatedAt: string | null;
    description: string;
    isPopular: boolean;
    properties: Record<string, any>;
    category: string;
    tags: string[];
  } | null;

  constructor(item: any = {}) {
    this.id = item.id ?? null;
    this.unitPrice = item.unitPrice ?? 0;
    this.totalPrice = item.totalPrice ?? 0;
    this.createdAt = item.createdAt ?? null;
    this.updatedAt = item.updatedAt ?? null;
    this.quantity = item.quantity ?? 0;

    this.product = item.product
      ? {
          id: item.product.id ?? null,
          name: item.product.name ?? '',
          price: item.product.price ?? 0,
          quantity: parseInt(item.product.quantity ?? '0', 10),
          discount: item.product.discount ?? 0,
          createdAt: item.product.createdAt ?? null,
          updatedAt: item.product.updatedAt ?? null,
          description: item.product.description ?? '',
          isPopular: !!item.product.isPopular,
          properties: item.product.properties ?? {},
          category: item.product.category ?? '',
          tags: Array.isArray(item.product.tags) ? item.product.tags : [],
        }
      : null;
  }
}

const CartItemListDTO = (items = []) => {
  return items.map((item) => new CartItemDto(item));
};

module.exports = {
  CartItemDto,
  CartItemListDTO,
};
