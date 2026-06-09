const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const authMiddleware = require('../middleware/auth');

// PUBLIC: Search & list movies
router.get('/', async (req, res) => {
  try {
    const { search, genre, category, year, page = 1, limit = 12, sort = '-createdAt' } = req.query;
    const query = { status: 'active' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { director: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { cast: { $elemMatch: { $regex: search, $options: 'i' } } }
      ];
    }
    if (genre) query.genre = { $in: [genre] };
    if (category) query.categories = { $in: [category] };
    if (year) query.year = parseInt(year);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [movies, total] = await Promise.all([
      Movie.find(query).sort(sort).skip(skip).limit(parseInt(limit)),
      Movie.countDocuments(query)
    ]);

    res.json({ movies, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUBLIC: Get single movie & increment views
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Get all movies (including archived)
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const { search, page = 1, limit = 10, status } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { director: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [movies, total] = await Promise.all([
      Movie.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)),
      Movie.countDocuments(query)
    ]);
    res.json({ movies, total, totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Get stats
router.get('/admin/stats', authMiddleware, async (req, res) => {
  try {
    const [total, active, archived, downloadable, totalViews, topMovies, genreStats] = await Promise.all([
      Movie.countDocuments(),
      Movie.countDocuments({ status: 'active' }),
      Movie.countDocuments({ status: 'archived' }),
      Movie.countDocuments({ downloadable: true }),
      Movie.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      Movie.find({ status: 'active' }).sort('-views').limit(5).select('title views rating poster'),
      Movie.aggregate([
        { $unwind: '$genre' },
        { $group: { _id: '$genre', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ])
    ]);
    res.json({
      total, active, archived, downloadable,
      totalViews: totalViews[0]?.total || 0,
      topMovies, genreStats
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Create movie
router.post('/', authMiddleware, async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json(movie);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ADMIN: Update movie
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    req.body.updatedAt = new Date();
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ADMIN: Delete movie
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json({ message: 'Movie deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Toggle movie status (active/archived)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    movie.status = movie.status === 'active' ? 'archived' : 'active';
    movie.updatedAt = new Date();
    await movie.save();
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Toggle download permission
router.patch('/:id/download', authMiddleware, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    movie.downloadable = !movie.downloadable;
    movie.updatedAt = new Date();
    await movie.save();
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
