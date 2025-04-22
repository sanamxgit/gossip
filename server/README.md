# Seller Store Backend API

This is the backend API for an e-commerce marketplace with seller functionality. It allows sellers to register, list products, manage inventory, and process orders.

## Features

- **User Authentication**: Register, login, and profile management
- **Seller Management**: Apply to become a seller, manage seller profiles
- **Product Management**: CRUD operations for products with image uploads
- **Category & Brand Management**: Organize products by categories and brands
- **Order Processing**: Create orders, update status, track deliveries
- **Admin Dashboard**: Manage users, approvals, and monitor system

## API Endpoints

### Authentication

- **POST /api/users/register** - Register a new user
- **POST /api/users/login** - Login and get token
- **GET /api/users/profile** - Get user profile (requires authentication)
- **PUT /api/users/profile** - Update user profile (requires authentication)

### Products

- **GET /api/products** - Get all products (with filtering options)
- **GET /api/products/:id** - Get single product
- **POST /api/products** - Create a product (seller only)
- **PUT /api/products/:id** - Update a product (seller only)
- **DELETE /api/products/:id** - Delete a product (seller only)
- **POST /api/products/:id/reviews** - Add product review
- **GET /api/products/seller** - Get seller's products (seller only)

### Sellers

- **POST /api/sellers/apply** - Apply to become a seller
- **GET /api/sellers/application** - Get seller application status
- **PUT /api/sellers/profile** - Update seller profile (seller only)
- **GET /api/sellers/dashboard** - Get seller dashboard data (seller only)
- **GET /api/sellers/orders** - Get seller's orders (seller only)
- **PUT /api/sellers/orders/:id** - Update order status (seller only)
- **GET /api/sellers/:id** - Get seller public profile

### Categories

- **GET /api/categories** - Get all categories
- **GET /api/categories/:id** - Get single category
- **POST /api/categories** - Create a category (admin only)
- **PUT /api/categories/:id** - Update a category (admin only)
- **DELETE /api/categories/:id** - Delete a category (admin only)
- **GET /api/categories/top** - Get top level categories
- **GET /api/categories/:id/subcategories** - Get subcategories
- **GET /api/categories/:id/products** - Get products in a category

### Brands

- **GET /api/brands** - Get all brands
- **GET /api/brands/:id** - Get single brand
- **POST /api/brands** - Create a brand (admin only)
- **PUT /api/brands/:id** - Update a brand (admin only)
- **DELETE /api/brands/:id** - Delete a brand (admin only)
- **GET /api/brands/featured** - Get featured brands
- **GET /api/brands/:id/products** - Get products of a brand

### Orders

- **POST /api/orders** - Create new order
- **GET /api/orders/:id** - Get order by ID
- **PUT /api/orders/:id/pay** - Update order to paid
- **PUT /api/orders/:id/deliver** - Update order to delivered (admin only)
- **GET /api/orders/myorders** - Get logged in user orders
- **GET /api/orders** - Get all orders (admin only)
- **PUT /api/orders/:id/status** - Update order status (admin only)
- **PUT /api/orders/:id/cancel** - Cancel order

### File Uploads

- **POST /api/upload/product** - Upload product images (seller only)
- **POST /api/upload/category** - Upload category image (admin only)
- **POST /api/upload/brand** - Upload brand logo (admin only)
- **POST /api/upload/avatar** - Upload user avatar
- **POST /api/upload/documents** - Upload seller verification documents
- **POST /api/upload/store** - Upload seller store logo (seller only)

### Admin

- **GET /api/admin/applications** - Get all seller applications (admin only)
- **GET /api/admin/applications/:id** - Get single seller application (admin only)
- **PUT /api/admin/applications/:id** - Update seller application status (admin only)
- **GET /api/admin/dashboard** - Get admin dashboard data (admin only)
- **PUT /api/admin/users/:id/role** - Change user role (admin only)

## Setup and Installation

1. Clone the repository
2. Install dependencies
   ```
   npm install
   ```
3. Create .env file with environment variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=30d
   UPLOAD_PATH=../uploads
   ```
4. Run the server
   ```
   npm run server
   ```

## Technologies Used

- Node.js
- Express
- MongoDB/Mongoose
- JWT Authentication
- Multer for file uploads
- bcryptjs for password hashing

## Database Models

- User
- Product
- Category
- Brand
- Order
- SellerApplication

## Future Enhancements

- Payment gateway integration
- Real-time order tracking
- Review and rating system
- Advanced search functionality
- Messaging system between buyer and seller 