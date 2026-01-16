/**
 * Level calculation utilities
 * Centralizes level calculation logic to avoid code duplication
 */

/**
 * Calculate user level based on total points
 * Formula: Level = floor(1 + √(points/500))
 *
 * Level progression:
 * - Level 1: 0 points
 * - Level 2: 500 points
 * - Level 3: 2,000 points
 * - Level 5: 8,000 points
 * - Level 10: 40,500 points
 * - Level 25: 288,000 points
 * - Level 50: 1,200,500 points
 *
 * @param {number} points - Total points earned
 * @returns {number} Calculated level (minimum 1)
 */
function calculateLevel(points) {
  if (!points || points < 0) return 1;
  return Math.floor(1 + Math.sqrt(points / 500));
}

/**
 * Calculate points required for a specific level
 * Formula: Points = (level - 1)² × 500
 *
 * @param {number} level - Target level
 * @returns {number} Points required
 */
function pointsForLevel(level) {
  if (level <= 1) return 0;
  return Math.pow(level - 1, 2) * 500;
}

/**
 * Calculate progress to next level
 *
 * @param {number} currentPoints - Current total points
 * @returns {object} { currentLevel, nextLevel, currentLevelPoints, nextLevelPoints, progress }
 */
function levelProgress(currentPoints) {
  const currentLevel = calculateLevel(currentPoints);
  const nextLevel = currentLevel + 1;

  const currentLevelPoints = pointsForLevel(currentLevel);
  const nextLevelPoints = pointsForLevel(nextLevel);

  const pointsInLevel = currentPoints - currentLevelPoints;
  const pointsNeeded = nextLevelPoints - currentLevelPoints;
  const progress = Math.round((pointsInLevel / pointsNeeded) * 100);

  return {
    currentLevel,
    nextLevel,
    currentLevelPoints,
    nextLevelPoints,
    pointsInLevel,
    pointsNeeded,
    progress: Math.min(100, Math.max(0, progress)),
  };
}

module.exports = {
  calculateLevel,
  pointsForLevel,
  levelProgress,
};
