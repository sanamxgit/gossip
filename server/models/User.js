const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

// Seller Profile Schema (Sub-document)
const SellerProfileSchema = new mongoose.Schema({
  storeName: {
    type: String,
    trim: true
  },
  storeDescription: {
    type: String
  },
  storeImage: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  storeSlug: {
    type: String
  }
});

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: ['user', 'seller', 'admin'],
      default: 'user'
    },
    avatar: {
      type: String,
      default: ''
    },
    sellerProfile: SellerProfileSchema,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if password is correct
UserSchema.methods.matchPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
UserSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Method to convert user to seller
UserSchema.methods.becomeSellerRequest = function(sellerData) {
  this.sellerProfile = {
    ...sellerData,
    verificationStatus: 'pending',
    dateApplied: new Date()
  };
};

// Generate slug for seller store
UserSchema.methods.generateStoreSlug = function () {
  if (this.role === 'seller' && this.sellerProfile && this.sellerProfile.storeName) {
    this.sellerProfile.storeSlug = this.sellerProfile.storeName
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
    return this.sellerProfile.storeSlug;
  }
  return null;
};

// Update seller stats
UserSchema.methods.updateSellerStats = async function (totalSales, rating) {
  if (this.role === 'seller' && this.sellerProfile) {
    if (totalSales !== undefined) {
      this.sellerProfile.totalSales = totalSales;
    }
    
    if (rating !== undefined) {
      this.sellerProfile.rating = rating;
    }
    
    return await this.save();
  }
  return this;
};

const User = mongoose.model('User', UserSchema);

module.exports = User; 