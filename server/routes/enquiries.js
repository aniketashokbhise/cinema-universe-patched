const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');
const authMiddleware = require('../middleware/auth');

// PUBLIC: Submit an enquiry
router.post('/', async (req, res) => {
  try {
    const { name, email, category, subject, message } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });
    if (!email || !email.trim()) return res.status(400).json({ message: 'Email is required' });
    if (!category) return res.status(400).json({ message: 'Category is required' });
    if (!subject || !subject.trim()) return res.status(400).json({ message: 'Subject is required' });
    if (!message || !message.trim()) return res.status(400).json({ message: 'Message is required' });

    const enquiry = new Enquiry({ name, email, category, subject, message });
    await enquiry.save();
    res.status(201).json({ message: 'Enquiry submitted successfully', enquiry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Get all enquiries (with pagination + filters)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [enquiries, total] = await Promise.all([
      Enquiry.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)),
      Enquiry.countDocuments(query),
    ]);
    res.json({ enquiries, total, totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Get enquiry stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [total, open, in_progress, resolved, closed] = await Promise.all([
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: 'open' }),
      Enquiry.countDocuments({ status: 'in_progress' }),
      Enquiry.countDocuments({ status: 'resolved' }),
      Enquiry.countDocuments({ status: 'closed' }),
    ]);
    res.json({ total, open, in_progress, resolved, closed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Get single enquiry
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });
    res.json(enquiry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Reply and/or update status
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, adminReply } = req.body;
    const update = { updatedAt: new Date() };
    if (status) update.status = status;
    if (adminReply !== undefined) {
      update.adminReply = adminReply;
      if (adminReply.trim()) update.repliedAt = new Date();
    }
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });
    res.json(enquiry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Delete enquiry
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Enquiry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Enquiry deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
