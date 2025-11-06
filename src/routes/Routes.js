import { Router } from "express";
import { createAppointment, getClientAppointments } from "../controllers/appointmentController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

/**
 * @route   GET /api/appointments
 * @desc    Obtener todas las citas del cliente autenticado
 * @access  Private (cliente autenticado)
 */
router.get("/", verifyToken, getClientAppointments);

/**
 * @route   POST /api/appointments
 * @desc    Registrar una nueva cita
 * @access  Private (cliente autenticado)
 */
router.post("/", verifyToken, createAppointment);

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
