import Appointment from "../models/Appointment.js";
import { verifyPetOwnership, getPetById } from "../services/patientsService.js";
import { verifyVeterinarianRole, getUserById } from "../services/authService.js";
import { publishEvent } from "../config/rabbitmq.js";

/**
 * Registra una nueva cita en el sistema
 * @route POST /api/appointments
 */
export const createAppointment = async (req, res) => {
  try {
    const { fecha, hora, motivo, petId, veterinarianId } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!fecha || !hora || !motivo || !petId || !veterinarianId) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son obligatorios: fecha, hora, motivo, petId, veterinarianId",
      });
    }

    // Obtener el ID y email del cliente del usuario autenticado
    // El middleware verifyToken debe agregar req.user con los datos del usuario
    const clientId = req.user?.id;
    const clientEmail = req.user?.email;

    if (!clientId || !clientEmail) {
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

    // Verificar que la mascota exista y pertenezca al cliente
    const token = req.headers.authorization; // Pasar el token completo

    try {
      const isPetOwner = await verifyPetOwnership(petId, clientEmail, token);

      if (!isPetOwner) {
        return res.status(403).json({
          success: false,
          message: "La mascota no existe o no pertenece a este cliente",
        });
      }
    } catch (error) {
      console.error("Error verificando propiedad de la mascota:", error);
      return res.status(500).json({
        success: false,
        message: "Error al verificar la mascota",
        error: error.message,
      });
    }

    // Verificar que el veterinario existe y tiene el rol correcto
    try {
      const isVeterinarian = await verifyVeterinarianRole(veterinarianId, token);

      if (!isVeterinarian) {
        return res.status(400).json({
          success: false,
          message: "El veterinario no existe o no tiene el rol de veterinario",
        });
      }
    } catch (error) {
      console.error("Error verificando veterinario:", error);
      return res.status(500).json({
        success: false,
        message: "Error al verificar el veterinario",
        error: error.message,
      });
    }

    // Crear la cita
    const newAppointment = await Appointment.create({
      fecha,
      hora,
      motivo,
      petId,
      clientId,
      veterinarianId,
      status: "pendiente", // Estado inicial
      isActive: true,
    });

    // Obtener información adicional para el correo
    try {
      // Obtener datos de la mascota
      const petData = await getPetById(petId, token);
      const petName = petData?.data?.petName || "Mascota desconocida";

      // Obtener datos del veterinario
      const veterinarianData = await getUserById(veterinarianId, token);
      const veterinarianName = veterinarianData?.data?.user?.fullname || "Veterinario desconocido";
      const veterinarianEmail = veterinarianData?.data?.user?.email;

      // Obtener datos del cliente (ya los tenemos en req.user, pero obtenemos el nombre completo)
      const clientData = await getUserById(clientId, token);
      const clientName = clientData?.data?.user?.fullname || req.user?.fullname || "Cliente desconocido";

      // Publicar evento para envío de correos
      if (veterinarianEmail && clientEmail) {
        await publishEvent("appointment.created", {
          appointmentId: newAppointment.appointmentId,
          fecha: newAppointment.fecha,
          hora: newAppointment.hora,
          motivo: newAppointment.motivo,
          petId: newAppointment.petId,
          petName,
          clientId: newAppointment.clientId,
          clientName,
          clientEmail,
          veterinarianId: newAppointment.veterinarianId,
          veterinarianName,
          veterinarianEmail,
        });
        console.log("Evento appointment.created publicado exitosamente");
      }
    } catch (eventError) {
      // No fallar la creación de la cita si falla el envío del evento
      console.error("Error al publicar evento de cita creada:", eventError);
    }

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
        veterinarianId: newAppointment.veterinarianId,
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
