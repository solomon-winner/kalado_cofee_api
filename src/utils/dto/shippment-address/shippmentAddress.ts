// path: src/utils/shippment-address.dto.js

class ShippmentAddressDTO {
  id: number | null;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  zipcode: string;
  city: string;
  isDefault: boolean;
  method: string;
  createdAt: string | null;
  updatedAt: string | null;

  constructor(address: any = {}) {
    this.id = address.id ?? null;
    this.firstName = address.firstName ?? '';
    this.lastName = address.lastName ?? '';
    this.address1 = address.address1 ?? '';
    this.address2 = address.address2 ?? '';
    this.zipcode = address.zipcode ?? '';
    this.city = address.city ?? '';
    this.isDefault = !!address.isDefault;
    this.method = address.method ?? '';
    this.createdAt = address.createdAt ?? null;
    this.updatedAt = address.updatedAt ?? null;
  }
}

const ShippmentAddressListDTO = (addresses = []) => {
  return addresses.map((address) => new ShippmentAddressDTO(address));
};

module.exports = {
  ShippmentAddressDTO,
  ShippmentAddressListDTO,
};
