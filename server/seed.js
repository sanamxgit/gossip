// Seed script to initialize homepage sections in MongoDB
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

// Index for faster queries
homepageSectionSchema.index({ order: 1 });
homepageSectionSchema.index({ active: 1 });

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

// Connect to MongoDB and seed data
async function seedDatabase() {
  try {
    // Fallback MongoDB URI if not set in environment
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gossip';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB. Checking for existing homepage sections...');
    
    // Check if there are any existing sections
    const count = await HomepageSection.countDocuments();
    
    if (count > 0) {
      console.log(`Found ${count} existing homepage sections. Skipping seed.`);
    } else {
      console.log('No existing homepage sections found. Seeding database...');
      
      // Insert initial sections
      await HomepageSection.insertMany(initialSections);
      
      console.log(`Successfully seeded ${initialSections.length} homepage sections.`);
    }
    
    return 'Seed completed successfully';
  } catch (error) {
    console.error('Error seeding database:', error);
    return error;
  } finally {
    // Close the connection
    console.log('Closing MongoDB connection...');
    mongoose.connection.close();
  }
}

// Run the seed function
seedDatabase()
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Seed failed:', error);
    process.exit(1);
  }); 