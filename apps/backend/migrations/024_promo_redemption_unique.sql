-- Prevent a user from redeeming the same promo code more than once.
-- The (promo_id, user_id) count check in AdminFeaturesRepo.RedeemPromo is not
-- locked and could race under concurrency, allowing duplicate redemptions.
-- Backing it with a unique constraint makes the DB the source of truth.

ALTER TABLE promo_redemptions
    ADD CONSTRAINT uq_promo_user UNIQUE (promo_id, user_id);
