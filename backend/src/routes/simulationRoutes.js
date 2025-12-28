const express = require('express');
const router = express.Router();
const { advanceTime } = require('../controllers/simulationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/advance', protect, advanceTime);

module.exports = router;
