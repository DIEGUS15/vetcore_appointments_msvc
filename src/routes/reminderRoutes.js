import express from "express";
import {
  getAllReminders,
  getAppointmentReminders,
  getVaccinationReminders,
  getDewormingReminders,
  getFollowUpReminders,
  sendAutomatedReminders,
} from "../controllers/reminderController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/reminders
 * @desc    Obtener todos los recordatorios pendientes
 * @access  Private (veterinario)
 */
router.get("/", verifyToken, getAllReminders);

/**
 * @route   GET /api/reminders/appointments
 * @desc    Obtener recordatorios de citas próximas
 * @access  Private (veterinario)
 */
router.get("/appointments", verifyToken, getAppointmentReminders);

/**
 * @route   GET /api/reminders/vaccinations
 * @desc    Obtener recordatorios de vacunas próximas a vencer
 * @access  Private (veterinario)
 */
router.get("/vaccinations", verifyToken, getVaccinationReminders);

/**
 * @route   GET /api/reminders/dewormings
 * @desc    Obtener recordatorios de desparasitaciones próximas a vencer
 * @access  Private (veterinario)
 */
router.get("/dewormings", verifyToken, getDewormingReminders);

/**
 * @route   GET /api/reminders/followups
 * @desc    Obtener recordatorios de seguimientos médicos pendientes
 * @access  Private (veterinario)
 */
router.get("/followups", verifyToken, getFollowUpReminders);

/**
 * @route   POST /api/reminders/send
 * @desc    Enviar recordatorios automáticos (para cron job)
 * @access  Private (admin o sistema)
 */
router.post("/send", verifyToken, sendAutomatedReminders);

export default router;
