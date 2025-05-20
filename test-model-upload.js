// Test script for model uploads
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const readline = require('readline');

// Configuration (update these values as needed)
const API_URL = 'http://localhost:5000/api/products';
let TOKEN = process.env.AUTH_TOKEN || ''; // You can set AUTH_TOKEN environment variable or enter it when prompted
const TEST_FILE_PATH = process.argv[2] || './test-model.usdz'; // Allow passing file path as command line argument

// Create a command line interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Create a dummy test file if it doesn't exist and no file path was provided
if (!fs.existsSync(TEST_FILE_PATH) && process.argv.length <= 2) {
  console.log('Creating dummy test file...');
  const dummyData = Buffer.alloc(1024 * 10, 'DUMMY'); // 10KB dummy file
  fs.writeFileSync(TEST_FILE_PATH, dummyData);
  console.log('Created dummy test file at:', TEST_FILE_PATH);
}

// Function to test the ping endpoint
async function testPing() {
  try {
    console.log(`Testing ping endpoint: ${API_URL}/ping`);
    const response = await axios.get(`${API_URL}/ping`);
    console.log('Ping successful:', response.data);
    return true;
  } catch (error) {
    console.error('Ping failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error(`Could not connect to server at ${API_URL}. Make sure the server is running.`);
    }
    return false;
  }
}

// Function to test model upload
async function testModelUpload() {
  // If no token provided, prompt for one
  if (!TOKEN) {
    TOKEN = await new Promise(resolve => {
      rl.question('Enter your auth token: ', answer => {
        resolve(answer.trim());
      });
    });
    if (!TOKEN) {
      console.error('No auth token provided. Aborting test.');
      rl.close();
      return;
    }
  }
  
  try {
    // First check if server is reachable
    const isPingSuccessful = await testPing();
    if (!isPingSuccessful) {
      console.error('Server is not reachable. Aborting upload test.');
      rl.close();
      return;
    }
    
    // Check if file exists
    if (!fs.existsSync(TEST_FILE_PATH)) {
      console.error(`Test file not found: ${TEST_FILE_PATH}`);
      rl.close();
      return;
    }
    
    console.log(`Using file: ${TEST_FILE_PATH}`);
    console.log(`File size: ${(fs.statSync(TEST_FILE_PATH).size / 1024).toFixed(2)} KB`);

    console.log('Creating form data...');
    const formData = new FormData();
    
    // Read the test file
    const fileBuffer = fs.readFileSync(TEST_FILE_PATH);
    
    // Get file details
    const fileName = path.basename(TEST_FILE_PATH);
    const fileExt = path.extname(TEST_FILE_PATH).toLowerCase();
    let contentType = 'application/octet-stream';
    
    // Set content type based on file extension
    if (fileExt === '.usdz') contentType = 'model/vnd.usdz+zip';
    if (fileExt === '.glb') contentType = 'model/gltf-binary';
    if (fileExt === '.gltf') contentType = 'model/gltf+json';
    
    // Add file to form data
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: contentType
    });
    
    // Add platform data
    const platform = fileExt === '.usdz' ? 'ios' : 'android';
    formData.append('platform', platform);
    
    console.log('Form data created with:');
    console.log(`- File: ${fileName} (${contentType})`);
    console.log(`- Platform: ${platform}`);
    
    console.log('Sending upload request...');
    console.log(`POST ${API_URL}/upload/model`);
    
    // Send the upload request
    const response = await axios.post(`${API_URL}/upload/model`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${TOKEN}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('Upload successful!');
    console.log('Response:', response.data);
    
    if (response.data && response.data.secure_url) {
      console.log(`\nModel URL: ${response.data.secure_url}`);
      console.log('You can use this URL in your product form.');
    }
  } catch (error) {
    console.error('Upload failed:');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Check that the server is running.');
    }
  } finally {
    rl.close();
  }
}

console.log('Starting model upload test...');
testModelUpload(); 