import express from "express";
import {
  getVaccinationsByPet,
  createVaccination,
  updateVaccination,
  deleteVaccination,
  getUpcomingVaccinations,
} from "../controllers/vaccinationController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/patients/:petId/vaccinations
 * @desc    Obtener todas las vacunas de una mascota
 * @access  Private
 */
router.get("/patients/:petId/vaccinations", verifyToken, getVaccinationsByPet);

/**
 * @route   POST /api/patients/:petId/vaccinations
 * @desc    Registrar una nueva vacuna para una mascota
 * @access  Private (veterinario)
 */
router.post("/patients/:petId/vaccinations", verifyToken, createVaccination);

/**
 * @route   PUT /api/vaccinations/:vaccinationId
 * @desc    Actualizar una vacuna
 * @access  Private (veterinario)
 */
router.put("/vaccinations/:vaccinationId", verifyToken, updateVaccination);

/**
 * @route   DELETE /api/vaccinations/:vaccinationId
 * @desc    Eliminar (soft delete) una vacuna
 * @access  Private (veterinario)
 */
router.delete("/vaccinations/:vaccinationId", verifyToken, deleteVaccination);

/**
 * @route   GET /api/vaccinations/upcoming
 * @desc    Obtener vacunas próximas a vencer (para alertas)
 * @access  Private
 */
router.get("/vaccinations/upcoming", verifyToken, getUpcomingVaccinations);

export default router;
