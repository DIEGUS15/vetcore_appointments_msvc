import { Prescription, Medication, PharmacyOrder, Appointment } from "../models/associations.js";
import { sequelize } from "../db.js";

/**
 * @desc    Expedir una receta médica para una cita
 * @route   POST /api/appointments/:appointmentId/prescription
 * @access  Private (Veterinarian)
 */
export const createPrescription = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { appointmentId } = req.params;
    const { observations, medications } = req.body;
    const veterinarianId = req.user.id;

    // Validar que se envíen medicamentos
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Debe incluir al menos un medicamento en la receta",
      });
    }

    // Verificar que la cita existe y pertenece al veterinario
    const appointment = await Appointment.findOne({
      where: {
        appointmentId,
        veterinarianId,
        isActive: true,
      },
    });

    if (!appointment) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada o no tiene permisos para expedir receta",
      });
    }

    // Verificar que la cita ya tiene diagnóstico y procedimiento
    if (!appointment.diagnostico || !appointment.procedimiento) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Debe completar el diagnóstico y procedimiento antes de expedir la receta",
      });
    }

    // Verificar si ya existe una receta para esta cita
    const existingPrescription = await Prescription.findOne({
      where: { appointmentId },
    });

    if (existingPrescription) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Esta cita ya tiene una receta médica expedida",
      });
    }

    // Crear la receta
    const prescription = await Prescription.create(
      {
        appointmentId,
        veterinarianId,
        clientId: appointment.clientId,
        petId: appointment.petId,
        observations: observations || null,
      },
      { transaction }
    );

    // Crear los medicamentos asociados
    const medicationsToCreate = medications.map((med) => ({
      prescriptionId: prescription.prescriptionId,
      name: med.name,
      dosage: med.dosage,
      quantity: med.quantity,
      unit: med.unit || "unidad",
      duration: med.duration || null,
      instructions: med.instructions || null,
    }));

    const createdMedications = await Medication.bulkCreate(medicationsToCreate, {
      transaction,
    });

    // Crear la orden de droguería automáticamente
    const pharmacyOrder = await PharmacyOrder.create(
      {
        prescriptionId: prescription.prescriptionId,
        clientId: appointment.clientId,
        status: "pendiente",
        medications: createdMedications.map((m) => ({
          name: m.name,
          quantity: m.quantity,
          unit: m.unit,
        })),
        totalItems: createdMedications.reduce((sum, m) => sum + m.quantity, 0),
        notes: `Receta expedida por cita #${appointmentId}`,
      },
      { transaction }
    );

    await transaction.commit();

    // Retornar la receta con medicamentos
    const prescriptionWithMedications = await Prescription.findByPk(prescription.prescriptionId, {
      include: [
        {
          model: Medication,
          as: "medications",
        },
        {
          model: PharmacyOrder,
          as: "pharmacyOrder",
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Receta médica expedida exitosamente",
      data: prescriptionWithMedications,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error al crear receta:", error);
    res.status(500).json({
      success: false,
      message: "Error al expedir la receta médica",
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener receta de una cita
 * @route   GET /api/appointments/:appointmentId/prescription
 * @access  Private
 */
export const getPrescriptionByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const prescription = await Prescription.findOne({
      where: { appointmentId, isActive: true },
      include: [
        {
          model: Medication,
          as: "medications",
        },
        {
          model: PharmacyOrder,
          as: "pharmacyOrder",
        },
      ],
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "No se encontró receta para esta cita",
      });
    }

    res.json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    console.error("Error al obtener receta:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la receta",
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener todas las recetas de un cliente
 * @route   GET /api/appointments/prescriptions/my-prescriptions
 * @access  Private (Client)
 */
export const getMyPrescriptions = async (req, res) => {
  try {
    const clientId = req.user.id;

    const prescriptions = await Prescription.findAll({
      where: { clientId, isActive: true },
      include: [
        {
          model: Medication,
          as: "medications",
        },
        {
          model: Appointment,
          as: "appointment",
          attributes: ["appointmentId", "fecha", "hora", "motivo"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    console.error("Error al obtener recetas del cliente:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las recetas",
      error: error.message,
    });
  }
};
