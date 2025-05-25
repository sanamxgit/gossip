const productRoutes = require('./routes/productRoutes');
const brandRoutes = require('./routes/brandRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const imageRoutes = require('./routes/imageRoutes');
const orderRoutes = require('./routes/orderRoutes');
const systemSettingsRoutes = require('./routes/systemSettingsRoutes');
const brandVerificationRoutes = require('./routes/brandVerificationRoutes');

// Routes
app.use('/api/products', productRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', systemSettingsRoutes);
app.use('/api/brand-verification', brandVerificationRoutes); 