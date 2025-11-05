import { Router } from "express";

const router = Router();

/**
 * @route   GET /api/appointments
 * @desc    Get all appointments (placeholder)
 * @access  Public (temporal - agregar auth después)
 */
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Appointments service is running",
    data: [],
  });
});

/**
 * @route   GET /api/appointments/health
 * @desc    Health check
 * @access  Public
 */
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "appointments",
    timestamp: new Date().toISOString(),
  });
});

export default router;
