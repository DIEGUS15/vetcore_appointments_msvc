import { Op } from "sequelize";
import Appointment from "../models/Appointment.js";
import Vaccination from "../models/Vaccination.js";
import Deworming from "../models/Deworming.js";
import MedicalRecord from "../models/MedicalRecord.js";

/**
 * Obtiene las citas que requieren recordatorio (próximas 24 horas)
 */
export const getUpcomingAppointmentReminders = async () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await Appointment.findAll({
    where: {
      fecha: {
        [Op.gte]: now,
        [Op.lt]: tomorrow,
      },
      status: {
        [Op.in]: ["pendiente", "confirmada"],
      },
      isActive: true,
    },
    order: [["fecha", "ASC"], ["hora", "ASC"]],
  });

  return appointments;
};

/**
 * Obtiene las vacunas que vencen pronto (próximos 7 días)
 */
export const getUpcomingVaccinationReminders = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const vaccinations = await Vaccination.findAll({
    where: {
      proximaDosis: {
        [Op.gte]: today,
        [Op.lte]: sevenDaysFromNow,
      },
      isActive: true,
    },
    order: [["proximaDosis", "ASC"]],
  });

  return vaccinations;
};

/**
 * Obtiene las desparasitaciones que vencen pronto (próximos 7 días)
 */
export const getUpcomingDewormingReminders = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const dewormings = await Deworming.findAll({
    where: {
      proximaDosis: {
        [Op.gte]: today,
        [Op.lte]: sevenDaysFromNow,
      },
      isActive: true,
    },
    order: [["proximaDosis", "ASC"]],
  });

  return dewormings;
};

/**
 * Obtiene los seguimientos médicos pendientes (próxima consulta sugerida)
 */
export const getPendingFollowUpReminders = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const medicalRecords = await MedicalRecord.findAll({
    where: {
      proximaConsulta: {
        [Op.gte]: today,
        [Op.lte]: sevenDaysFromNow,
      },
      isActive: true,
    },
    order: [["proximaConsulta", "ASC"]],
  });

  return medicalRecords;
};

/**
 * Formatea los datos de recordatorio para envío
 */
export const formatReminderData = (type, data) => {
  switch (type) {
    case "appointment":
      return {
        type: "appointment",
        id: data.appointmentId,
        clientId: data.clientId,
        petId: data.petId,
        veterinarianId: data.veterinarianId,
        date: data.fecha,
        time: data.hora,
        reason: data.motivo,
        status: data.status,
      };

    case "vaccination":
      return {
        type: "vaccination",
        id: data.vaccinationId,
        petId: data.petId,
        vaccineName: data.nombreVacuna,
        nextDose: data.proximaDosis,
        batch: data.lote,
      };

    case "deworming":
      return {
        type: "deworming",
        id: data.dewormingId,
        petId: data.petId,
        product: data.producto,
        parasiteType: data.tipoParasito,
        nextDose: data.proximaDosis,
      };

    case "followup":
      return {
        type: "followup",
        id: data.recordId,
        petId: data.petId,
        appointmentId: data.appointmentId,
        nextConsultation: data.proximaConsulta,
        diagnosis: data.diagnostico,
      };

    default:
      return null;
  }
};
