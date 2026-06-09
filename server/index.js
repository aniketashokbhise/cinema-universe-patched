const { setServers } = require("node:dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/enquiries', require('./routes/enquiries'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// PUBLIC: Real-time total views counter (no auth required)
app.get('/api/views/total', async (req, res) => {
  try {
    const Movie = require('./models/Movie');
    const result = await Movie.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]);
    res.json({ totalViews: result[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUBLIC: Track a website visit — called once per session by the frontend
// Increments a persistent counter every time any user/admin opens the site
app.post('/api/visits/track', async (req, res) => {
  try {
    const SiteVisit = require('./models/SiteVisit');
    const doc = await SiteVisit.findByIdAndUpdate(
      'global',
      { $inc: { count: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true, new: true }
    );
    res.json({ totalVisits: doc.count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUBLIC: Get current total visit count
app.get('/api/visits/total', async (req, res) => {
  try {
    const SiteVisit = require('./models/SiteVisit');
    const doc = await SiteVisit.findById('global');
    res.json({ totalVisits: doc ? doc.count : 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cache clearing endpoint — called by frontend on load
app.post('/api/cache/clear', (req, res) => {
  const cacheDir = path.join(__dirname, 'cache');
  if (fs.existsSync(cacheDir)) {
    const now = Date.now();
    const maxAge = 1000 * 60 * 60 * 6; // 6 hours
    let cleared = 0;
    fs.readdirSync(cacheDir).forEach(file => {
      const filePath = path.join(cacheDir, file);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          cleared++;
        }
      } catch {}
    });
    res.json({ message: `Cleared ${cleared} outdated cache files` });
  } else {
    fs.mkdirSync(cacheDir, { recursive: true });
    res.json({ message: 'Cache directory initialized' });
  }
});

// Seed function
// async function seedDatabase() {
//   const Movie = require('./models/Movie');
//   const Admin = require('./models/Admin');

//   const count = await Movie.countDocuments();
//   if (count === 0) {
//     console.log('Seeding movies...');
//     const movies = [
  
//     ];

//     await Movie.insertMany(movies);
//     console.log('✅ Movies seeded!');
//   }


// }

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
  
  })
  .catch(err => console.error('❌ MongoDB error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
