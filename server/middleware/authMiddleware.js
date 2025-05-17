const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to check if the user is authenticated
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
};

// Middleware to check if user is admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
};

// Middleware to check if user is seller
const seller = (req, res, next) => {
  if (req.user && req.user.role === 'seller') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as a seller');
  }
};

// Middleware to check if user is seller or admin
const sellerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'seller' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as a seller or admin');
  }
};

// Middleware to check if user is the owner of the resource
const isOwner = (resourceModel) => async (req, res, next) => {
  try {
    const resource = await resourceModel.findById(req.params.id);

    if (!resource) {
      res.status(404);
      throw new Error('Resource not found');
    }

    // Check if user is owner or admin
    if (
      resource.user &&
      resource.user.toString() === req.user._id.toString() ||
      req.user.role === 'admin'
    ) {
      next();
    } else {
      res.status(403);
      throw new Error('Not authorized as the owner of this resource');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { protect, admin, seller, sellerOrAdmin, isOwner };
