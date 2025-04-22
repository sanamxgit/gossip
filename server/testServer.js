const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test routes
app.get('/', (req, res) => {
  res.send('Test server is running');
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  
  const { email, password } = req.body;
  
  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  // Hardcoded credentials check
  if (email === 'sanam@gmail.com' && password === 'Sanam@123') {
    res.json({
      _id: '123456789',
      username: 'Sanam',
      email: email,
      role: 'seller',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OSIsImVtYWlsIjoic2FuYW1AZ21haWwuY29tIiwicm9sZSI6InNlbGxlciIsImlhdCI6MTY0MzI5MjQ4MCwiZXhwIjoxNjQ1ODg0NDgwfQ.sample-token'
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

// Start server
const PORT = 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
}); 