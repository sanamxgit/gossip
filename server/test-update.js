// Test direct update of a section in MongoDB
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

// Connect to MongoDB and update a section
async function testUpdate() {
  try {
    // Fallback MongoDB URI if not set in environment
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gossip';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB. Finding sections...');
    
    // Get all sections
    const sections = await HomepageSection.find().sort({ order: 1 });
    
    if (sections.length === 0) {
      console.log('No sections found');
      return 'No sections to update';
    }
    
    // Find banner section (should be order 1)
    const bannerSection = sections.find(s => s.order === 1);
    
    if (!bannerSection) {
      console.log('Banner section not found');
      return 'Banner section not found';
    }
    
    console.log(`Found banner section: ID=${bannerSection._id}, Title=${bannerSection.title}`);
    
    // Update the banner
    bannerSection.content = {
      slides: [
        {
          imageUrl: "/uploads/updated-banner.svg",
          title: "Updated Banner",
          subtitle: "This is an updated banner",
          buttonText: "Shop Now Updated",
          buttonLink: "/products-updated"
        }
      ]
    };
    
    // Save the changes
    await bannerSection.save();
    
    console.log('Banner section updated successfully');
    
    return 'Update completed successfully';
  } catch (error) {
    console.error('Error updating section:', error);
    return error;
  } finally {
    // Close the connection
    console.log('Closing MongoDB connection...');
    mongoose.connection.close();
  }
}

// Run the function
testUpdate()
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Update failed:', error);
    process.exit(1);
  }); 