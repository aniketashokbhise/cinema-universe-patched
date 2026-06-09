const express = require('express');
const router = express.Router();
const MovieRequest = require('../models/MovieRequest');
const authMiddleware = require('../middleware/auth');

// PUBLIC: Submit a movie request
router.post('/', async (req, res) => {
  try {
    const { title, year, director, language, description, requestedBy } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: 'Movie title is required' });
    const request = new MovieRequest({ title, year, director, language, description, requestedBy });
    await request.save();
    res.status(201).json({ message: 'Request submitted successfully', request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Get all requests
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [requests, total] = await Promise.all([
      MovieRequest.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)),
      MovieRequest.countDocuments(query)
    ]);
    res.json({ requests, total, totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Update request status
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const request = await MovieRequest.findByIdAndUpdate(
      req.params.id,
      { status, adminNote },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Delete request
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await MovieRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
