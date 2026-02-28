const Section = require('../models/Section');

async function createSection(req, res) {
  try {
    const { sectionName } = req.body;
    if (!sectionName) {
      return res.status(400).json({ message: 'Section name is required' });
    }

    const section = await Section.create({
      userId: req.userId,
      sectionName
    });

    res.status(201).json(section);
  } catch (err) {
    console.error('Create section error:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Section with this name already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

async function getSections(req, res) {
  try {
    const sections = await Section.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(sections);
  } catch (err) {
    console.error('Get sections error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteSection(req, res) {
  try {
    const { id } = req.params;
    const section = await Section.findOneAndDelete({ _id: id, userId: req.userId });
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }
    res.json({ message: 'Section deleted' });
  } catch (err) {
    console.error('Delete section error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  createSection,
  getSections,
  deleteSection
};


