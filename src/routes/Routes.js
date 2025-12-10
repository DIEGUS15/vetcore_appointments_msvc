import { Router } from "express";
import { createAppointment, getClientAppointments, getVeterinarianSchedule, updateAppointmentAttention } from "../controllers/appointmentController.js";
import { createPrescription, getPrescriptionByAppointment, getMyPrescriptions } from "../controllers/prescriptionController.js";
import { getAllPharmacyOrders, getPharmacyOrderById, updatePharmacyOrderStatus, getMyPharmacyOrders } from "../controllers/pharmacyController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import medicalRecordRoutes from "./medicalRecordRoutes.js";
import vaccinationRoutes from "./vaccinationRoutes.js";
import dewormingRoutes from "./dewormingRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import reminderRoutes from "./reminderRoutes.js";

const router = Router();

/**
 * @route   GET /api/appointments
 * @desc    Obtener todas las citas del cliente autenticado
 * @access  Private (cliente autenticado)
 */
router.get("/", verifyToken, getClientAppointments);

/**
 * @route   GET /api/appointments/veterinarian/schedule
 * @desc    Obtener la agenda del veterinario autenticado (citas del día)
 * @access  Private (veterinario autenticado)
 */
router.get("/veterinarian/schedule", verifyToken, getVeterinarianSchedule);

/**
 * @route   POST /api/appointments
 * @desc    Registrar una nueva cita
 * @access  Private (cliente autenticado)
 */
router.post("/", verifyToken, createAppointment);

/**
 * @route   PUT /api/appointments/:appointmentId/attention
 * @desc    Registrar la atención de una cita (procedimiento, diagnóstico, indicaciones)
 * @access  Private (veterinario autenticado)
 */
router.put("/:appointmentId/attention", verifyToken, updateAppointmentAttention);

// ==================== MEDICAL RECORDS ROUTES ====================
// Todas las rutas de registros médicos (usar el router importado)
router.use("/", medicalRecordRoutes);

// ==================== VACCINATION ROUTES ====================
// Todas las rutas de vacunas
router.use("/", vaccinationRoutes);

// ==================== DEWORMING ROUTES ====================
// Todas las rutas de desparasitaciones
router.use("/", dewormingRoutes);

// ==================== DASHBOARD ROUTES ====================
// Rutas del dashboard veterinario
router.use("/dashboard", dashboardRoutes);

// ==================== REMINDER ROUTES ====================
// Rutas de recordatorios automáticos
router.use("/reminders", reminderRoutes);

// ==================== PRESCRIPTION ROUTES ====================

/**
 * @route   POST /api/appointments/:appointmentId/prescription
 * @desc    Expedir una receta médica para una cita
 * @access  Private (veterinario autenticado)
 */
router.post("/:appointmentId/prescription", verifyToken, createPrescription);

/**
 * @route   GET /api/appointments/:appointmentId/prescription
 * @desc    Obtener la receta médica de una cita
 * @access  Private
 */
router.get("/:appointmentId/prescription", verifyToken, getPrescriptionByAppointment);

/**
 * @route   GET /api/appointments/prescriptions/my-prescriptions
 * @desc    Obtener todas las recetas del cliente autenticado
 * @access  Private (cliente autenticado)
 */
router.get("/prescriptions/my-prescriptions", verifyToken, getMyPrescriptions);

// ==================== PHARMACY ROUTES ====================

/**
 * @route   GET /api/appointments/pharmacy/orders
 * @desc    Obtener todas las órdenes de droguería
 * @access  Private (recepcionista/admin)
 */
router.get("/pharmacy/orders", verifyToken, getAllPharmacyOrders);

/**
 * @route   GET /api/appointments/pharmacy/my-orders
 * @desc    Obtener las órdenes de droguería del cliente autenticado
 * @access  Private (cliente autenticado)
 */
router.get("/pharmacy/my-orders", verifyToken, getMyPharmacyOrders);

/**
 * @route   GET /api/appointments/pharmacy/orders/:orderId
 * @desc    Obtener una orden de droguería por ID
 * @access  Private
 */
router.get("/pharmacy/orders/:orderId", verifyToken, getPharmacyOrderById);

/**
 * @route   PUT /api/appointments/pharmacy/orders/:orderId/status
 * @desc    Actualizar el estado de una orden de droguería
 * @access  Private (recepcionista/admin)
 */
router.put("/pharmacy/orders/:orderId/status", verifyToken, updatePharmacyOrderStatus);

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
