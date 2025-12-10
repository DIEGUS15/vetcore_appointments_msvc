import {
  Appointment,
  MedicalRecord,
  Vaccination,
  Deworming,
} from "../models/associations.js";
import { Op } from "sequelize";

/**
 * Obtener estadísticas del dashboard veterinario
 */
export const getVeterinarianDashboard = async (req, res) => {
  try {
    const veterinarianId = req.user?.id;

    // Verificar que el usuario es veterinario
    if (req.user?.role?.name !== "veterinarian") {
      return res.status(403).json({
        success: false,
        message: "Solo los veterinarios pueden acceder al dashboard",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Estadísticas de citas
    const [
      todayAppointments,
      pendingAppointments,
      completedThisMonth,
      totalAppointments,
    ] = await Promise.all([
      // Citas de hoy
      Appointment.count({
        where: {
          veterinarianId,
          fecha: {
            [Op.gte]: today,
            [Op.lt]: tomorrow,
          },
          isActive: true,
        },
      }),

      // Citas pendientes
      Appointment.count({
        where: {
          veterinarianId,
          status: "pendiente",
          isActive: true,
        },
      }),

      // Citas completadas este mes
      Appointment.count({
        where: {
          veterinarianId,
          status: "completada",
          fecha: {
            [Op.gte]: oneMonthAgo,
          },
          isActive: true,
        },
      }),

      // Total de citas
      Appointment.count({
        where: {
          veterinarianId,
          isActive: true,
        },
      }),
    ]);

    // Registros médicos recientes (casos activos)
    const activeCases = await MedicalRecord.count({
      where: {
        veterinarianId,
        status: "en_curso",
        isActive: true,
      },
    });

    // Registros médicos finalizados este mes
    const completedRecordsThisMonth = await MedicalRecord.count({
      where: {
        veterinarianId,
        status: "finalizado",
        fecha: {
          [Op.gte]: oneMonthAgo,
        },
        isActive: true,
      },
    });

    // Vacunas próximas a vencer (próxima dosis en los próximos 7 días)
    const upcomingVaccinations = await Vaccination.findAll({
      where: {
        proximaDosis: {
          [Op.gte]: today,
          [Op.lte]: oneWeekFromNow,
        },
        isActive: true,
      },
      limit: 10,
      order: [["proximaDosis", "ASC"]],
    });

    // Desparasitaciones próximas a vencer
    const upcomingDewormings = await Deworming.findAll({
      where: {
        proximaDosis: {
          [Op.gte]: today,
          [Op.lte]: oneWeekFromNow,
        },
        isActive: true,
      },
      limit: 10,
      order: [["proximaDosis", "ASC"]],
    });

    // Consultas recientes del veterinario
    const recentConsultations = await MedicalRecord.findAll({
      where: {
        veterinarianId,
        isActive: true,
      },
      limit: 5,
      order: [["fecha", "DESC"]],
    });

    // Próximas citas del veterinario
    const upcomingAppointments = await Appointment.findAll({
      where: {
        veterinarianId,
        fecha: {
          [Op.gte]: today,
        },
        status: {
          [Op.in]: ["pendiente", "confirmada"],
        },
        isActive: true,
      },
      limit: 10,
      order: [["fecha", "ASC"], ["hora", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: {
        statistics: {
          todayAppointments,
          pendingAppointments,
          completedThisMonth,
          totalAppointments,
          activeCases,
          completedRecordsThisMonth,
        },
        alerts: {
          upcomingVaccinations: upcomingVaccinations.length,
          upcomingDewormings: upcomingDewormings.length,
        },
        upcomingVaccinations,
        upcomingDewormings,
        recentConsultations,
        upcomingAppointments,
      },
    });
  } catch (error) {
    console.error("Error al obtener dashboard veterinario:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener las estadísticas del dashboard",
      error: error.message,
    });
  }
};

/**
 * Obtener seguimientos pendientes para el veterinario
 */
export const getPendingFollowUps = async (req, res) => {
  try {
    const veterinarianId = req.user?.id;

    if (req.user?.role?.name !== "veterinarian") {
      return res.status(403).json({
        success: false,
        message: "Solo los veterinarios pueden acceder a seguimientos",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Registros médicos con próxima consulta sugerida
    const followUps = await MedicalRecord.findAll({
      where: {
        veterinarianId,
        proximaConsulta: {
          [Op.gte]: today,
        },
        status: "finalizado",
        isActive: true,
      },
      order: [["proximaConsulta", "ASC"]],
      limit: 20,
    });

    return res.status(200).json({
      success: true,
      data: followUps,
    });
  } catch (error) {
    console.error("Error al obtener seguimientos pendientes:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener los seguimientos pendientes",
      error: error.message,
    });
  }
};
