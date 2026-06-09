const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
  title: {
    type: String,
    default: ''
  },

  links: {
    '720p': {
      type: String,
      default: ''
    },

    '1080p': {
      type: String,
      default: ''
    },

    '4k': {
      type: String,
      default: ''
    }
  }
}, { _id: false });

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true
  },

  genre: [{
    type: String
  }],

  categories: [{
    type: String
  }],

  year: {
    type: Number,
    required: true
  },

  director: {
    type: String,
    required: true
  },

  cast: [{
    type: String
  }],

  rating: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },

  poster: {
    type: String,
    default: ''
  },

  language: {
    type: String,
    default: 'English'
  },

  duration: {
    type: Number,
    default: 0
  },

  views: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },

  downloadable: {
    type: Boolean,
    default: false
  },

  // Legacy single download link
  downloadUrl: {
    type: String,
    default: ''
  },

  // Movie quality links
  downloadLinks: {
    '720p': {
      type: String,
      default: ''
    },

    '1080p': {
      type: String,
      default: ''
    },

    '4k': {
      type: String,
      default: ''
    }
  },

  // Web Series Toggle
  isSeries: {
    type: Boolean,
    default: false
  },

  // Episodes
  episodes: [episodeSchema],

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

movieSchema.index({
  title: 'text',
  description: 'text',
  director: 'text'
});

module.exports = mongoose.model('Movie', movieSchema);