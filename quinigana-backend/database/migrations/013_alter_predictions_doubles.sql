-- Allow double and triple predictions (1X, 12, X2, 1X2)
ALTER TABLE `proposal_predictions`
  MODIFY COLUMN `prediction_1x2` VARCHAR(3) NOT NULL;

-- Support 0.5 points for double predictions
ALTER TABLE `quiniela_results`
  MODIFY COLUMN `points_1x2` DECIMAL(5,1) NOT NULL DEFAULT 0;

-- Support decimal totals
ALTER TABLE `group_scores`
  MODIFY COLUMN `total_points` DECIMAL(7,1) NOT NULL DEFAULT 0;
