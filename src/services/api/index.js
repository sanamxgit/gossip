import authService from './authService';
import productService from './productService';
import categoryService from './categoryService';
import brandService from './brandService';
import orderService from './orderService';

// Export individual services
export {
  authService,
  productService,
  categoryService, 
  brandService,
  orderService
};

// Export as a combined object
const apiServices = {
  auth: authService,
  products: productService,
  categories: categoryService,
  brands: brandService,
  orders: orderService
};

export default apiServices; 