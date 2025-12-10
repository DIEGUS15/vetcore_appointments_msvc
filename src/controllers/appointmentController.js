import Appointment from "../models/Appointment.js";
import { verifyPetOwnership, getPetById } from "../services/patientsService.js";
import {
  verifyVeterinarianRole,
  getUserById,
} from "../services/authService.js";
import { publishEvent } from "../config/rabbitmq.js";
import { Op } from "sequelize";

export const createAppointment = async (req, res) => {
  try {
    const { fecha, hora, motivo, petId, veterinarianId } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!fecha || !hora || !motivo || !petId || !veterinarianId) {
      return res.status(400).json({
        success: false,
        message:
          "Todos los campos son obligatorios: fecha, hora, motivo, petId, veterinarianId",
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
      const isVeterinarian = await verifyVeterinarianRole(
        veterinarianId,
        token
      );

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

    // Validar que no exista una cita en el mismo horario con el mismo veterinario
    const existingAppointment = await Appointment.findOne({
      where: {
        fecha,
        hora,
        veterinarianId,
        isActive: true,
        status: {
          [Op.ne]: 'cancelada', // Excluir citas canceladas
        },
      },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: `El veterinario ya tiene una cita agendada para el ${fecha} a las ${hora}. Por favor, selecciona otro horario.`,
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
      const veterinarianName =
        veterinarianData?.data?.user?.fullname || "Veterinario desconocido";
      const veterinarianEmail = veterinarianData?.data?.user?.email;

      // Obtener datos del cliente (ya los tenemos en req.user, pero obtenemos el nombre completo)
      const clientData = await getUserById(clientId, token);
      const clientName =
        clientData?.data?.user?.fullname ||
        req.user?.fullname ||
        "Cliente desconocido";

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

export const getVeterinarianSchedule = async (req, res) => {
  try {
    // Obtener el ID del veterinario del usuario autenticado
    const veterinarianId = req.user?.id;

    if (!veterinarianId) {
      return res.status(401).json({
        success: false,
        message: "No se pudo identificar al usuario autenticado",
      });
    }

    // Verificar que el usuario es veterinario
    if (req.user?.role?.name !== "veterinarian") {
      return res.status(403).json({
        success: false,
        message: "Solo los veterinarios pueden consultar su agenda",
      });
    }

    // Obtener parámetros de consulta opcionales
    const { fecha } = req.query;

    // Si no se proporciona fecha, usar el día de hoy
    const targetDate = fecha || new Date().toISOString().split("T")[0];

    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(targetDate)) {
      return res.status(400).json({
        success: false,
        message: "La fecha debe estar en formato YYYY-MM-DD",
      });
    }

    // Obtener las citas del veterinario para esa fecha
    const appointments = await Appointment.findAll({
      where: {
        veterinarianId: veterinarianId,
        fecha: targetDate,
        isActive: true,
      },
      order: [["hora", "ASC"]], // Ordenar por hora ascendente
    });

    // Obtener información adicional de cada cita (mascota y cliente)
    const token = req.headers.authorization;
    const appointmentsWithDetails = await Promise.all(
      appointments.map(async (appointment) => {
        try {
          // Obtener datos de la mascota
          const petData = await getPetById(appointment.petId, token);
          const petName = petData?.data?.petName || "Mascota no encontrada";

          // Obtener datos del cliente
          const clientData = await getUserById(appointment.clientId, token);
          const clientName =
            clientData?.data?.user?.fullname || "Cliente no encontrado";

          return {
            appointmentId: appointment.appointmentId,
            hora: appointment.hora,
            motivo: appointment.motivo,
            status: appointment.status,
            petId: appointment.petId,
            petName,
            clientId: appointment.clientId,
            clientName,
            createdAt: appointment.createdAt,
          };
        } catch (error) {
          console.error(
            `Error obteniendo detalles de la cita ${appointment.appointmentId}:`,
            error
          );
          // Si falla la obtención de detalles, devolver la cita sin detalles adicionales
          return {
            appointmentId: appointment.appointmentId,
            hora: appointment.hora,
            motivo: appointment.motivo,
            status: appointment.status,
            petId: appointment.petId,
            petName: "Error al cargar",
            clientId: appointment.clientId,
            clientName: "Error al cargar",
            createdAt: appointment.createdAt,
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      message: "Agenda obtenida exitosamente",
      fecha: targetDate,
      count: appointmentsWithDetails.length,
      data: appointmentsWithDetails,
    });
  } catch (error) {
    console.error("Error al obtener la agenda del veterinario:", error);

    return res.status(500).json({
      success: false,
      message: "Error al obtener la agenda",
      error: error.message,
    });
  }
};

export const updateAppointmentAttention = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { procedimiento, diagnostico, indicaciones } = req.body;

    // Obtener el ID del veterinario del usuario autenticado
    const veterinarianId = req.user?.id;

    if (!veterinarianId) {
      return res.status(401).json({
        success: false,
        message: "No se pudo identificar al usuario autenticado",
      });
    }

    // Verificar que el usuario es veterinario
    if (req.user?.role?.name !== "veterinarian") {
      return res.status(403).json({
        success: false,
        message: "Solo los veterinarios pueden registrar la atención",
      });
    }

    // Validar que al menos un campo esté presente
    if (!procedimiento && !diagnostico && !indicaciones) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar al menos un campo: procedimiento, diagnóstico o indicaciones",
      });
    }

    // Buscar la cita
    const appointment = await Appointment.findOne({
      where: {
        appointmentId: appointmentId,
        isActive: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada",
      });
    }

    // Verificar que la cita pertenece al veterinario autenticado
    if (appointment.veterinarianId !== veterinarianId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para atender esta cita",
      });
    }

    // Verificar que la cita no esté cancelada
    if (appointment.status === "cancelada") {
      return res.status(400).json({
        success: false,
        message: "No se puede registrar atención para una cita cancelada",
      });
    }

    // Actualizar la cita con los datos de atención
    await appointment.update({
      procedimiento: procedimiento || appointment.procedimiento,
      diagnostico: diagnostico || appointment.diagnostico,
      indicaciones: indicaciones || appointment.indicaciones,
      status: "completada", // Cambiar estado a completada al registrar atención
    });

    return res.status(200).json({
      success: true,
      message: "Atención registrada exitosamente",
      data: {
        appointmentId: appointment.appointmentId,
        fecha: appointment.fecha,
        hora: appointment.hora,
        motivo: appointment.motivo,
        procedimiento: appointment.procedimiento,
        diagnostico: appointment.diagnostico,
        indicaciones: appointment.indicaciones,
        status: appointment.status,
        updatedAt: appointment.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error al registrar la atención:", error);

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
      message: "Error al registrar la atención",
      error: error.message,
    });
  }
};

export const getClientAppointments = async (req, res) => {
  try {
    // Obtener el ID del cliente del usuario autenticado
    const clientId = req.user?.id;

    if (!clientId) {
      return res.status(401).json({
        success: false,
        message: "No se pudo identificar al usuario autenticado",
      });
    }

    // Obtener parámetros de consulta opcionales
    const { status, includeInactive } = req.query;

    // Construir el objeto de filtros
    const whereClause = {
      clientId: clientId,
    };

    // Filtrar por estado si se proporciona
    if (status) {
      whereClause.status = status;
    }

    // Por defecto, solo mostrar citas activas
    if (includeInactive !== "true") {
      whereClause.isActive = true;
    }

    // Obtener las citas del cliente
    const appointments = await Appointment.findAll({
      where: whereClause,
      order: [
        ["fecha", "DESC"],
        ["hora", "DESC"],
      ],
    });

    // Obtener información adicional de cada cita (mascota y veterinario)
    const token = req.headers.authorization;
    const appointmentsWithDetails = await Promise.all(
      appointments.map(async (appointment) => {
        try {
          // Obtener datos de la mascota
          const petData = await getPetById(appointment.petId, token);
          const petName = petData?.data?.petName || "Mascota no encontrada";

          // Obtener datos del veterinario
          const veterinarianData = await getUserById(
            appointment.veterinarianId,
            token
          );
          const veterinarianName =
            veterinarianData?.data?.user?.fullname ||
            "Veterinario no encontrado";

          return {
            appointmentId: appointment.appointmentId,
            fecha: appointment.fecha,
            hora: appointment.hora,
            motivo: appointment.motivo,
            status: appointment.status,
            isActive: appointment.isActive,
            petId: appointment.petId,
            petName,
            veterinarianId: appointment.veterinarianId,
            veterinarianName,
            createdAt: appointment.createdAt,
            updatedAt: appointment.updatedAt,
          };
        } catch (error) {
          console.error(
            `Error obteniendo detalles de la cita ${appointment.appointmentId}:`,
            error
          );
          // Si falla la obtención de detalles, devolver la cita sin detalles adicionales
          return {
            appointmentId: appointment.appointmentId,
            fecha: appointment.fecha,
            hora: appointment.hora,
            motivo: appointment.motivo,
            status: appointment.status,
            isActive: appointment.isActive,
            petId: appointment.petId,
            petName: "Error al cargar",
            veterinarianId: appointment.veterinarianId,
            veterinarianName: "Error al cargar",
            createdAt: appointment.createdAt,
            updatedAt: appointment.updatedAt,
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      message: "Citas obtenidas exitosamente",
      count: appointmentsWithDetails.length,
      data: appointmentsWithDetails,
    });
  } catch (error) {
    console.error("Error al obtener las citas del cliente:", error);

    return res.status(500).json({
      success: false,
      message: "Error al obtener las citas",
      error: error.message,
    });
  }
};
