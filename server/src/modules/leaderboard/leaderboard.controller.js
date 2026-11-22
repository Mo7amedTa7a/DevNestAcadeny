const leaderboardService = require('./leaderboard.service');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');

const getLeaderboard = asyncHandler(async (req, res) => {
  const data = await leaderboardService.getCohortLeaderboard(
    req.user.id,
    req.query.courseId
  );
  sendSuccess(res, 'Cohort leaderboard retrieved', data);
});

module.exports = {
  getLeaderboard,
};
