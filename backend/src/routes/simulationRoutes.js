const express = require('express');
const router = express.Router();
const { advanceTime, startSimSession, endSimSession, getSimSessionStatus } = require('../controllers/simulationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/advance', protect, advanceTime);
router.post('/session/start', protect, startSimSession);
router.post('/session/end', protect, endSimSession);
router.get('/session/status', protect, getSimSessionStatus);

module.exports = router;
