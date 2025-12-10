import { Vaccination, MedicalRecord } from "../models/associations.js";
import { getPetById } from "../services/patientsService.js";

/**
 * Obtener todas las vacunas de una mascota
 */
export const getVaccinationsByPet = async (req, res) => {
  try {
    const { petId } = req.params;
    const token = req.headers.authorization;

    // Verificar que la mascota existe
    try {
      await getPetById(petId, token);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "La mascota no existe",
      });
    }

    // Obtener todas las vacunas de la mascota
    const vaccinations = await Vaccination.findAll({
      where: { petId, isActive: true },
      include: [
        {
          model: MedicalRecord,
          as: "medicalRecord",
          attributes: ["recordId", "fecha", "motivoConsulta"],
          required: false,
        },
      ],
      order: [["fechaAplicacion", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      totalVaccinations: vaccinations.length,
      data: vaccinations,
    });
  } catch (error) {
    console.error("Error al obtener vacunas:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener las vacunas",
      error: error.message,
    });
  }
};

/**
 * Registrar una nueva vacuna
 */
export const createVaccination = async (req, res) => {
  try {
    const { petId } = req.params;
    const veterinarianId = req.user?.id;
    const token = req.headers.authorization;

    // Verificar que el usuario es veterinario
    if (req.user?.role?.name !== "veterinarian") {
      return res.status(403).json({
        success: false,
        message: "Solo los veterinarios pueden registrar vacunas",
      });
    }

    // Verificar que la mascota existe
    try {
      await getPetById(petId, token);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "La mascota no existe",
      });
    }

    const {
      recordId,
      nombreVacuna,
      fechaAplicacion,
      proximaDosis,
      lote,
      fabricante,
      observaciones,
    } = req.body;

    // Validar campos requeridos
    if (!nombreVacuna || !fechaAplicacion) {
      return res.status(400).json({
        success: false,
        message: "El nombre de la vacuna y la fecha de aplicación son obligatorios",
      });
    }

    // Si se proporciona recordId, verificar que existe
    if (recordId) {
      const medicalRecord = await MedicalRecord.findByPk(recordId);
      if (!medicalRecord) {
        return res.status(404).json({
          success: false,
          message: "El registro médico no existe",
        });
      }
    }

    // Crear la vacuna
    const vaccination = await Vaccination.create({
      petId,
      recordId: recordId || null,
      nombreVacuna,
      fechaAplicacion,
      proximaDosis: proximaDosis || null,
      lote: lote || null,
      fabricante: fabricante || null,
      veterinarianId,
      observaciones: observaciones || null,
    });

    return res.status(201).json({
      success: true,
      message: "Vacuna registrada exitosamente",
      data: vaccination,
    });
  } catch (error) {
    console.error("Error al registrar vacuna:", error);
    return res.status(500).json({
      success: false,
      message: "Error al registrar la vacuna",
      error: error.message,
    });
  }
};

/**
 * Actualizar una vacuna
 */
export const updateVaccination = async (req, res) => {
  try {
    const { vaccinationId } = req.params;

    // Verificar que el usuario es veterinario
    if (req.user?.role?.name !== "veterinarian") {
      return res.status(403).json({
        success: false,
        message: "Solo los veterinarios pueden actualizar vacunas",
      });
    }

    const vaccination = await Vaccination.findByPk(vaccinationId);
    if (!vaccination) {
      return res.status(404).json({
        success: false,
        message: "La vacuna no existe",
      });
    }

    const {
      nombreVacuna,
      fechaAplicacion,
      proximaDosis,
      lote,
      fabricante,
      observaciones,
    } = req.body;

    // Actualizar la vacuna
    await vaccination.update({
      nombreVacuna: nombreVacuna || vaccination.nombreVacuna,
      fechaAplicacion: fechaAplicacion || vaccination.fechaAplicacion,
      proximaDosis: proximaDosis !== undefined ? proximaDosis : vaccination.proximaDosis,
      lote: lote !== undefined ? lote : vaccination.lote,
      fabricante: fabricante !== undefined ? fabricante : vaccination.fabricante,
      observaciones: observaciones !== undefined ? observaciones : vaccination.observaciones,
    });

    return res.status(200).json({
      success: true,
      message: "Vacuna actualizada exitosamente",
      data: vaccination,
    });
  } catch (error) {
    console.error("Error al actualizar vacuna:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar la vacuna",
      error: error.message,
    });
  }
};

/**
 * Eliminar (soft delete) una vacuna
 */
export const deleteVaccination = async (req, res) => {
  try {
    const { vaccinationId } = req.params;

    // Verificar que el usuario es veterinario
    if (req.user?.role?.name !== "veterinarian") {
      return res.status(403).json({
        success: false,
        message: "Solo los veterinarios pueden eliminar vacunas",
      });
    }

    const vaccination = await Vaccination.findByPk(vaccinationId);
    if (!vaccination) {
      return res.status(404).json({
        success: false,
        message: "La vacuna no existe",
      });
    }

    // Soft delete
    await vaccination.update({ isActive: false });

    return res.status(200).json({
      success: true,
      message: "Vacuna eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar vacuna:", error);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar la vacuna",
      error: error.message,
    });
  }
};

/**
 * Obtener vacunas próximas a vencer (para alertas)
 */
export const getUpcomingVaccinations = async (req, res) => {
  try {
    const { days = 30 } = req.query; // Por defecto, vacunas en los próximos 30 días

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(days));

    const { Op } = await import("sequelize");

    const upcomingVaccinations = await Vaccination.findAll({
      where: {
        proximaDosis: {
          [Op.between]: [today.toISOString().split("T")[0], futureDate.toISOString().split("T")[0]],
        },
        isActive: true,
      },
      order: [["proximaDosis", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      totalUpcoming: upcomingVaccinations.length,
      data: upcomingVaccinations,
    });
  } catch (error) {
    console.error("Error al obtener vacunas próximas:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener las vacunas próximas",
      error: error.message,
    });
  }
};
