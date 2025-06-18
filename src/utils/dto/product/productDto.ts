// path: src/utils/product.dto.js

class ProductDTO {
  id: number | null;
  name: string;
  price: number;
  quantity: number;
  description: string;
  discount: number;
  retailer: { id: number | null; name: string } | null;
  isPopular: boolean;
  properties: Record<string, any>;
  images: { id: number | null; url: string; name: string }[];
  category: string;
  tags: string[];

  constructor(product: any = {}) {
    this.id = product.id ;
    this.name = product.name ;
    this.price = product.price;
    this.quantity = product.quantity;
    this.description = product.description ;
    this.discount = product.discount;

    this.retailer = product.retailer
      ? {
          id: product.retailer.id ,
          name: product.retailer.name ,
        }
      : null;

    this.isPopular = !!product.isPopular;
    this.properties = product.properties;

    this.images = Array.isArray(product.images)
      ? product.images.map((img: any) => ({
          id: img.id ,
          url: img.url,
          name: img.name,
        }))
      : [];

    this.category = product.category;
    this.tags = product.tags
  }
}

// Function to convert a list of products
const ProductListDTO = (products = []) => {
  return products.map((product) => new ProductDTO(product));
};

module.exports = {
  ProductDTO,
  ProductListDTO,
};
