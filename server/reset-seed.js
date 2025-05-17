// Reset and reseed script for homepage sections in MongoDB
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// HomePage Section model
const homepageSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['banner', 'categories', 'products', 'icon-categories', 'custom'],
    default: 'custom'
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {}
  },
  order: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const HomepageSection = mongoose.model('HomepageSection', homepageSectionSchema);

// Initial sections data
const initialSections = [
  {
    title: "Main Banner",
    type: "banner",
    content: {
      slides: [
        {
          imageUrl: "/uploads/placeholder.svg",
          title: "Welcome to Our Store",
          subtitle: "Find amazing deals",
          buttonText: "Shop Now",
          buttonLink: "/products"
        }
      ]
    },
    order: 1,
    active: true
  },
  {
    title: "Trending Categories",
    type: "categories",
    content: {
      categories: [
        {
          name: "Furniture",
          image: "/uploads/placeholder.svg",
          description: "Home furniture"
        },
        {
          name: "Lamp",
          image: "/uploads/placeholder.svg",
          description: "Modern lighting"
        },
        {
          name: "Your skincare",
          image: "/uploads/placeholder.svg",
          description: "Beauty products"
        }
      ]
    },
    order: 2,
    active: true
  },
  {
    title: "Flash Sale",
    type: "products",
    content: {
      productIds: []
    },
    order: 3,
    active: true
  },
  {
    title: "Categories",
    type: "icon-categories",
    content: {
      categories: [
        {
          name: "Mobile & Devices",
          imageUrl: "/uploads/placeholder.svg",
          link: "/category/mobile-devices"
        },
        {
          name: "Watch",
          imageUrl: "/uploads/placeholder.svg",
          link: "/category/watch"
        },
        {
          name: "Accessories",
          imageUrl: "/uploads/placeholder.svg",
          link: "/category/accessories"
        },
        {
          name: "Home & Decor",
          imageUrl: "/uploads/placeholder.svg",
          link: "/category/home-decor"
        }
      ]
    },
    order: 4,
    active: true
  }
];

// Connect to MongoDB and reset/seed data
async function resetAndSeedDatabase() {
  try {
    // Fallback MongoDB URI if not set in environment
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gossip';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB. Dropping HomepageSection collection...');
    
    // Drop the collection to start fresh
    await HomepageSection.collection.drop().catch(err => {
      // If collection doesn't exist, that's fine
      if (err.code !== 26) {
        throw err;
      }
      console.log('Collection does not exist yet, creating it...');
    });
    
    console.log('Seeding database with fresh homepage sections...');
    
    // Insert initial sections
    const result = await HomepageSection.insertMany(initialSections);
    
    console.log(`Successfully seeded ${result.length} homepage sections with IDs:`);
    result.forEach(section => {
      console.log(`- ID: ${section._id}, Title: ${section.title}, Order: ${section.order}`);
    });
    
    return 'Reset and seed completed successfully';
  } catch (error) {
    console.error('Error resetting/seeding database:', error);
    return error;
  } finally {
    // Close the connection
    console.log('Closing MongoDB connection...');
    mongoose.connection.close();
  }
}

// Run the function
resetAndSeedDatabase()
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Reset/seed failed:', error);
    process.exit(1);
  }); 