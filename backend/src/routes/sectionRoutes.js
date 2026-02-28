const express = require('express');
const {
  createSection,
  getSections,
  deleteSection
} = require('../controllers/sectionController');
const { authRequired } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authRequired);

router.post('/', createSection);
router.get('/', getSections);
router.delete('/:id', deleteSection);

module.exports = router;


