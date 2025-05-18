const express = require('express');
const router = express.Router();

// Simple ping endpoint to respond with status OK
router.get('/ping', (req, res) => {
  res.status(200).json({ message: 'pong' });
});

module.exports = router;
