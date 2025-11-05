import Appointment from "../models/Appointment.js";

/**
 * Registra una nueva cita en el sistema
 * @route POST /api/appointments
 */
export const createAppointment = async (req, res) => {
  try {
    const { fecha, hora, motivo, petId } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!fecha || !hora || !motivo || !petId) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son obligatorios: fecha, hora, motivo, petId",
      });
    }

    // Obtener el ID del cliente del usuario autenticado
    // El middleware verifyToken debe agregar req.user con los datos del usuario
    const clientId = req.user?.id;

    if (!clientId) {
      return res.status(401).json({
        success: false,
        message: "No se pudo identificar al usuario autenticado",
      });
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fecha)) {
      return res.status(400).json({
        success: false,
        message: "La fecha debe estar en formato YYYY-MM-DD",
      });
    }

    // Validar formato de hora (HH:MM o HH:MM:SS)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
    if (!timeRegex.test(hora)) {
      return res.status(400).json({
        success: false,
        message: "La hora debe estar en formato HH:MM o HH:MM:SS",
      });
    }

    // Validar que la fecha no sea en el pasado
    const fechaCita = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas

    if (fechaCita < hoy) {
      return res.status(400).json({
        success: false,
        message: "No se pueden agendar citas en fechas pasadas",
      });
    }

    // TODO: Aquí podrías agregar validaciones adicionales:
    // - Verificar que la mascota (petId) exista en el servicio de Patients
    // - Verificar que la mascota pertenezca al cliente
    // - Verificar que no haya conflictos de horario

    // Crear la cita
    const newAppointment = await Appointment.create({
      fecha,
      hora,
      motivo,
      petId,
      clientId,
      status: "pendiente", // Estado inicial
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Cita registrada exitosamente",
      data: {
        appointmentId: newAppointment.appointmentId,
        fecha: newAppointment.fecha,
        hora: newAppointment.hora,
        motivo: newAppointment.motivo,
        petId: newAppointment.petId,
        clientId: newAppointment.clientId,
        status: newAppointment.status,
        createdAt: newAppointment.createdAt,
      },
    });
  } catch (error) {
    console.error("Error al crear la cita:", error);

    // Manejo de errores de validación de Sequelize
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors: error.errors.map((err) => err.message),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error al registrar la cita",
      error: error.message,
    });
  }
};
