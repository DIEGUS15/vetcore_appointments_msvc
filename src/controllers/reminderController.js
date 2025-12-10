import {
  getUpcomingAppointmentReminders,
  getUpcomingVaccinationReminders,
  getUpcomingDewormingReminders,
  getPendingFollowUpReminders,
  formatReminderData,
} from "../utils/reminderUtils.js";
import { publishEvent } from "../config/rabbitmq.js";

/**
 * Obtiene todos los recordatorios pendientes
 */
export const getAllReminders = async (req, res) => {
  try {
    const [appointments, vaccinations, dewormings, followUps] =
      await Promise.all([
        getUpcomingAppointmentReminders(),
        getUpcomingVaccinationReminders(),
        getUpcomingDewormingReminders(),
        getPendingFollowUpReminders(),
      ]);

    const reminders = {
      appointments: appointments.map((apt) =>
        formatReminderData("appointment", apt)
      ),
      vaccinations: vaccinations.map((vac) =>
        formatReminderData("vaccination", vac)
      ),
      dewormings: dewormings.map((dew) =>
        formatReminderData("deworming", dew)
      ),
      followUps: followUps.map((fu) => formatReminderData("followup", fu)),
    };

    return res.status(200).json({
      success: true,
      message: "Recordatorios obtenidos exitosamente",
      data: reminders,
    });
  } catch (error) {
    console.error("Error al obtener recordatorios:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener recordatorios",
      error: error.message,
    });
  }
};

/**
 * Obtiene recordatorios de citas próximas
 */
export const getAppointmentReminders = async (req, res) => {
  try {
    const appointments = await getUpcomingAppointmentReminders();
    const reminders = appointments.map((apt) =>
      formatReminderData("appointment", apt)
    );

    return res.status(200).json({
      success: true,
      message: "Recordatorios de citas obtenidos exitosamente",
      data: reminders,
    });
  } catch (error) {
    console.error("Error al obtener recordatorios de citas:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener recordatorios de citas",
      error: error.message,
    });
  }
};

/**
 * Obtiene recordatorios de vacunas próximas a vencer
 */
export const getVaccinationReminders = async (req, res) => {
  try {
    const vaccinations = await getUpcomingVaccinationReminders();
    const reminders = vaccinations.map((vac) =>
      formatReminderData("vaccination", vac)
    );

    return res.status(200).json({
      success: true,
      message: "Recordatorios de vacunas obtenidos exitosamente",
      data: reminders,
    });
  } catch (error) {
    console.error("Error al obtener recordatorios de vacunas:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener recordatorios de vacunas",
      error: error.message,
    });
  }
};

/**
 * Obtiene recordatorios de desparasitaciones próximas a vencer
 */
export const getDewormingReminders = async (req, res) => {
  try {
    const dewormings = await getUpcomingDewormingReminders();
    const reminders = dewormings.map((dew) =>
      formatReminderData("deworming", dew)
    );

    return res.status(200).json({
      success: true,
      message: "Recordatorios de desparasitaciones obtenidos exitosamente",
      data: reminders,
    });
  } catch (error) {
    console.error("Error al obtener recordatorios de desparasitaciones:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener recordatorios de desparasitaciones",
      error: error.message,
    });
  }
};

/**
 * Obtiene recordatorios de seguimientos médicos pendientes
 */
export const getFollowUpReminders = async (req, res) => {
  try {
    const followUps = await getPendingFollowUpReminders();
    const reminders = followUps.map((fu) => formatReminderData("followup", fu));

    return res.status(200).json({
      success: true,
      message: "Recordatorios de seguimientos obtenidos exitosamente",
      data: reminders,
    });
  } catch (error) {
    console.error("Error al obtener recordatorios de seguimientos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener recordatorios de seguimientos",
      error: error.message,
    });
  }
};

/**
 * Envía recordatorios automáticos (para ser llamado por un cron job o scheduler)
 */
export const sendAutomatedReminders = async (req, res) => {
  try {
    const [appointments, vaccinations, dewormings, followUps] =
      await Promise.all([
        getUpcomingAppointmentReminders(),
        getUpcomingVaccinationReminders(),
        getUpcomingDewormingReminders(),
        getPendingFollowUpReminders(),
      ]);

    // Publicar eventos a RabbitMQ para que el servicio de notificaciones envíe los correos
    const promises = [];

    // Recordatorios de citas
    for (const appointment of appointments) {
      const reminderData = formatReminderData("appointment", appointment);
      promises.push(
        publishEvent("reminder.appointment", reminderData).catch((err) => {
          console.error("Error al publicar recordatorio de cita:", err);
        })
      );
    }

    // Recordatorios de vacunas
    for (const vaccination of vaccinations) {
      const reminderData = formatReminderData("vaccination", vaccination);
      promises.push(
        publishEvent("reminder.vaccination", reminderData).catch((err) => {
          console.error("Error al publicar recordatorio de vacuna:", err);
        })
      );
    }

    // Recordatorios de desparasitaciones
    for (const deworming of dewormings) {
      const reminderData = formatReminderData("deworming", deworming);
      promises.push(
        publishEvent("reminder.deworming", reminderData).catch((err) => {
          console.error("Error al publicar recordatorio de desparasitación:", err);
        })
      );
    }

    // Recordatorios de seguimientos
    for (const followUp of followUps) {
      const reminderData = formatReminderData("followup", followUp);
      promises.push(
        publishEvent("reminder.followup", reminderData).catch((err) => {
          console.error("Error al publicar recordatorio de seguimiento:", err);
        })
      );
    }

    await Promise.allSettled(promises);

    const totalReminders =
      appointments.length +
      vaccinations.length +
      dewormings.length +
      followUps.length;

    return res.status(200).json({
      success: true,
      message: "Recordatorios automáticos enviados exitosamente",
      data: {
        totalReminders,
        appointments: appointments.length,
        vaccinations: vaccinations.length,
        dewormings: dewormings.length,
        followUps: followUps.length,
      },
    });
  } catch (error) {
    console.error("Error al enviar recordatorios automáticos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al enviar recordatorios automáticos",
      error: error.message,
    });
  }
};
