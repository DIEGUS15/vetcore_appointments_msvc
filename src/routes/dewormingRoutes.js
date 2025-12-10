import express from "express";
import {
  getDewormingsByPet,
  createDeworming,
  updateDeworming,
  deleteDeworming,
  getUpcomingDewormings,
} from "../controllers/dewormingController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/patients/:petId/dewormings
 * @desc    Obtener todas las desparasitaciones de una mascota
 * @access  Private
 */
router.get("/patients/:petId/dewormings", verifyToken, getDewormingsByPet);

/**
 * @route   POST /api/patients/:petId/dewormings
 * @desc    Registrar una nueva desparasitación para una mascota
 * @access  Private (veterinario)
 */
router.post("/patients/:petId/dewormings", verifyToken, createDeworming);

/**
 * @route   PUT /api/dewormings/:dewormingId
 * @desc    Actualizar una desparasitación
 * @access  Private (veterinario)
 */
router.put("/dewormings/:dewormingId", verifyToken, updateDeworming);

/**
 * @route   DELETE /api/dewormings/:dewormingId
 * @desc    Eliminar (soft delete) una desparasitación
 * @access  Private (veterinario)
 */
router.delete("/dewormings/:dewormingId", verifyToken, deleteDeworming);

/**
 * @route   GET /api/dewormings/upcoming
 * @desc    Obtener desparasitaciones próximas a vencer (para alertas)
 * @access  Private
 */
router.get("/dewormings/upcoming", verifyToken, getUpcomingDewormings);

export default router;
