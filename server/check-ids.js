// Script to check MongoDB IDs of homepage sections
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// HomePage Section model (simplified schema)
const homepageSectionSchema = new mongoose.Schema({
  title: String,
  type: String,
  content: mongoose.Schema.Types.Mixed,
  order: Number,
  active: Boolean
});

const HomepageSection = mongoose.model('HomepageSection', homepageSectionSchema);

// Connect to MongoDB and get section IDs
async function checkIDs() {
  try {
    // Fallback MongoDB URI if not set in environment
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gossip';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB. Fetching homepage sections...');
    
    // Get all sections with their MongoDB IDs and titles
    const sections = await HomepageSection.find().sort({ order: 1 }).select('_id title type order');
    
    if (sections.length === 0) {
      console.log('No homepage sections found in the database.');
    } else {
      console.log('Found homepage sections:');
      console.log('-----------------------------');
      sections.forEach(section => {
        console.log(`ID: ${section._id}, Title: ${section.title}, Type: ${section.type}, Order: ${section.order}`);
      });
      console.log('-----------------------------');
      console.log('Copy these IDs to use in your frontend or update your code to handle MongoDB ObjectIds');
    }
    
    return 'Check completed successfully';
  } catch (error) {
    console.error('Error checking IDs:', error);
    return error;
  } finally {
    // Close the connection
    console.log('Closing MongoDB connection...');
    mongoose.connection.close();
  }
}

// Run the function
checkIDs()
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Check failed:', error);
    process.exit(1);
  }); 