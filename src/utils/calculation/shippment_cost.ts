// utils/shippingConstants.js

/**
 * Fetch constants from the database.
 */
const getConstants = async () => {
  const [constants] = await strapi.entityService.findMany("api::constant.constant");

  if (!constants) {
    throw new Error("No constants found in the database");
  }

  return constants;
};

/**
 * Get shipment cost, tax, and discount based on the shipping method.
 * @param {string} method - Shipping method ('standard', 'express', or 'next-day')
 * @returns {Object} - Object containing shippingCost, tax, and discount
 */
const getShippingDetails = async (method = 'standard') => {
  const constants = await getConstants();

  // Validate method
  const allowedMethods = ['standard', 'express', 'next-day'];
  if (!allowedMethods.includes(method)) {
    throw new Error("Invalid shipping method");
  }

  // Determine shipping cost
  const shippingCostMap = {
    standard: constants.standard_shippment_cost || 0,
    express: constants.express_shippment_cost || 0,
    'next-day': constants.next_day_shippment_cost || 0,
  };

  return {
    shippingCost: shippingCostMap[method],
    tax: constants.tax || 0.05,
    discount: constants.discount || 0,
  };
};

module.exports = {
  getShippingDetails,
};
