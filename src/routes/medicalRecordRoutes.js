import express from "express";
import {
  createMedicalRecord,
  getMedicalRecordByAppointment,
  updateMedicalRecord,
  getMedicalHistoryByPet,
  uploadMedicalFiles,
  getMedicalAttachments,
  deleteMedicalAttachment,
  downloadMedicalAttachment,
  generateMedicalRecordPDFEndpoint,
  generateMedicalHistoryPDFEndpoint,
  generateVaccinationCertificatePDFEndpoint,
} from "../controllers/medicalRecordController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { upload, handleMulterError } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/appointments/:appointmentId/medical-record
 * @desc    Crear un nuevo registro médico para una cita
 * @access  Private (veterinario)
 */
router.post("/:appointmentId/medical-record", verifyToken, createMedicalRecord);

/**
 * @route   GET /api/appointments/:appointmentId/medical-record
 * @desc    Obtener el registro médico de una cita
 * @access  Private (veterinario o cliente dueño de la mascota)
 */
router.get(
  "/:appointmentId/medical-record",
  verifyToken,
  getMedicalRecordByAppointment
);

/**
 * @route   PUT /api/appointments/:appointmentId/medical-record
 * @desc    Actualizar el registro médico de una cita
 * @access  Private (veterinario)
 */
router.put("/:appointmentId/medical-record", verifyToken, updateMedicalRecord);

/**
 * @route   GET /api/patients/:petId/medical-history
 * @desc    Obtener el historial médico completo de una mascota
 * @access  Private (veterinario o cliente dueño de la mascota)
 */
router.get("/patients/:petId/medical-history", verifyToken, getMedicalHistoryByPet);

/**
 * @route   POST /api/medical-records/:recordId/attachments
 * @desc    Subir archivos médicos a un registro
 * @access  Private (veterinario)
 */
router.post(
  "/medical-records/:recordId/attachments",
  verifyToken,
  upload.array("files", 10),
  handleMulterError,
  uploadMedicalFiles
);

/**
 * @route   GET /api/medical-records/:recordId/attachments
 * @desc    Obtener todos los archivos de un registro médico
 * @access  Private
 */
router.get(
  "/medical-records/:recordId/attachments",
  verifyToken,
  getMedicalAttachments
);

/**
 * @route   DELETE /api/medical-records/attachments/:attachmentId
 * @desc    Eliminar un archivo médico
 * @access  Private (veterinario)
 */
router.delete(
  "/medical-records/attachments/:attachmentId",
  verifyToken,
  deleteMedicalAttachment
);

/**
 * @route   GET /api/medical-records/attachments/:attachmentId/download
 * @desc    Descargar un archivo médico
 * @access  Private
 */
router.get(
  "/medical-records/attachments/:attachmentId/download",
  verifyToken,
  downloadMedicalAttachment
);

/**
 * @route   GET /api/medical-records/:recordId/pdf
 * @desc    Generar PDF de un registro médico individual
 * @access  Private
 */
router.get(
  "/medical-records/:recordId/pdf",
  verifyToken,
  generateMedicalRecordPDFEndpoint
);

/**
 * @route   GET /api/patients/:petId/medical-history-pdf
 * @desc    Generar PDF del historial médico completo de una mascota
 * @access  Private
 */
router.get(
  "/patients/:petId/medical-history-pdf",
  verifyToken,
  generateMedicalHistoryPDFEndpoint
);

/**
 * @route   GET /api/patients/:petId/vaccination-certificate-pdf
 * @desc    Generar certificado de vacunación en PDF
 * @access  Private
 */
router.get(
  "/patients/:petId/vaccination-certificate-pdf",
  verifyToken,
  generateVaccinationCertificatePDFEndpoint
);

export default router;
