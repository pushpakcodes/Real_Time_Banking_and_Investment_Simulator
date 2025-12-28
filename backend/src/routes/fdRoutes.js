const express = require('express');
const router = express.Router();
const { createFD, getFDs } = require('../controllers/fdController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, createFD);
router.get('/', protect, getFDs);

module.exports = router;
