import express from "express";
import {
  getVeterinarianDashboard,
  getPendingFollowUps,
} from "../controllers/dashboardController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/dashboard/veterinarian
 * @desc    Obtener estadísticas del dashboard veterinario
 * @access  Private (veterinario)
 */
router.get("/veterinarian", verifyToken, getVeterinarianDashboard);

/**
 * @route   GET /api/dashboard/follow-ups
 * @desc    Obtener seguimientos pendientes
 * @access  Private (veterinario)
 */
router.get("/follow-ups", verifyToken, getPendingFollowUps);

export default router;
