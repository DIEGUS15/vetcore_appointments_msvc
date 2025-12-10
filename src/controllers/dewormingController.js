import { Deworming, MedicalRecord } from "../models/associations.js";
import { getPetById } from "../services/patientsService.js";

/**
 * Obtener todas las desparasitaciones de una mascota
 */
export const getDewormingsByPet = async (req, res) => {
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

    // Obtener todas las desparasitaciones de la mascota
    const dewormings = await Deworming.findAll({
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
      totalDewormings: dewormings.length,
      data: dewormings,
    });
  } catch (error) {
    console.error("Error al obtener desparasitaciones:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener las desparasitaciones",
      error: error.message,
    });
  }
};

/**
 * Registrar una nueva desparasitación
 */
export const createDeworming = async (req, res) => {
  try {
    const { petId } = req.params;
    const veterinarianId = req.user?.id;
    const token = req.headers.authorization;

    // Verificar que el usuario es veterinario
    if (req.user?.role?.name !== "veterinarian") {
      return res.status(403).json({
        success: false,
        message: "Solo los veterinarios pueden registrar desparasitaciones",
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
      producto,
      tipoParasito,
      fechaAplicacion,
      proximaDosis,
      peso,
      dosis,
      viaAdministracion,
      observaciones,
    } = req.body;

    // Validar campos requeridos
    if (!producto || !fechaAplicacion || !tipoParasito) {
      return res.status(400).json({
        success: false,
        message: "El producto, tipo de parásito y fecha de aplicación son obligatorios",
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

    // Crear la desparasitación
    const deworming = await Deworming.create({
      petId,
      recordId: recordId || null,
      producto,
      tipoParasito,
      fechaAplicacion,
      proximaDosis: proximaDosis || null,
      peso: peso || null,
      dosis: dosis || null,
      viaAdministracion: viaAdministracion || null,
      veterinarianId,
      observaciones: observaciones || null,
    });

    return res.status(201).json({
      success: true,
      message: "Desparasitación registrada exitosamente",
      data: deworming,
    });
  } catch (error) {
    console.error("Error al registrar desparasitación:", error);
    return res.status(500).json({
      success: false,
      message: "Error al registrar la desparasitación",
      error: error.message,
    });
  }
};

/**
 * Actualizar una desparasitación
 */
export const updateDeworming = async (req, res) => {
  try {
    const { dewormingId } = req.params;

    // Verificar que el usuario es veterinario
    if (req.user?.role?.name !== "veterinarian") {
      return res.status(403).json({
        success: false,
        message: "Solo los veterinarios pueden actualizar desparasitaciones",
      });
    }

    const deworming = await Deworming.findByPk(dewormingId);
    if (!deworming) {
      return res.status(404).json({
        success: false,
        message: "La desparasitación no existe",
      });
    }

    const {
      producto,
      tipoParasito,
      fechaAplicacion,
      proximaDosis,
      peso,
      dosis,
      viaAdministracion,
      observaciones,
    } = req.body;

    // Actualizar la desparasitación
    await deworming.update({
      producto: producto || deworming.producto,
      tipoParasito: tipoParasito || deworming.tipoParasito,
      fechaAplicacion: fechaAplicacion || deworming.fechaAplicacion,
      proximaDosis: proximaDosis !== undefined ? proximaDosis : deworming.proximaDosis,
      peso: peso !== undefined ? peso : deworming.peso,
      dosis: dosis !== undefined ? dosis : deworming.dosis,
      viaAdministracion: viaAdministracion !== undefined ? viaAdministracion : deworming.viaAdministracion,
      observaciones: observaciones !== undefined ? observaciones : deworming.observaciones,
    });

    return res.status(200).json({
      success: true,
      message: "Desparasitación actualizada exitosamente",
      data: deworming,
    });
  } catch (error) {
    console.error("Error al actualizar desparasitación:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar la desparasitación",
      error: error.message,
    });
  }
};

/**
 * Eliminar (soft delete) una desparasitación
 */
export const deleteDeworming = async (req, res) => {
  try {
    const { dewormingId } = req.params;

    // Verificar que el usuario es veterinario
    if (req.user?.role?.name !== "veterinarian") {
      return res.status(403).json({
        success: false,
        message: "Solo los veterinarios pueden eliminar desparasitaciones",
      });
    }

    const deworming = await Deworming.findByPk(dewormingId);
    if (!deworming) {
      return res.status(404).json({
        success: false,
        message: "La desparasitación no existe",
      });
    }

    // Soft delete
    await deworming.update({ isActive: false });

    return res.status(200).json({
      success: true,
      message: "Desparasitación eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar desparasitación:", error);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar la desparasitación",
      error: error.message,
    });
  }
};

/**
 * Obtener desparasitaciones próximas a vencer (para alertas)
 */
export const getUpcomingDewormings = async (req, res) => {
  try {
    const { days = 30 } = req.query; // Por defecto, desparasitaciones en los próximos 30 días

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(days));

    const { Op } = await import("sequelize");

    const upcomingDewormings = await Deworming.findAll({
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
      totalUpcoming: upcomingDewormings.length,
      data: upcomingDewormings,
    });
  } catch (error) {
    console.error("Error al obtener desparasitaciones próximas:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener las desparasitaciones próximas",
      error: error.message,
    });
  }
};
