const { Router } = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const leaderboardController = require('./leaderboard.controller');

const router = Router();

// Student-facing leaderboard route (requires active login)
router.use(protect);

router.get('/', leaderboardController.getLeaderboard);

module.exports = router;
