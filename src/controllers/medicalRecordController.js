import {
  MedicalRecord,
  VitalSigns,
  MedicalAttachment,
  Appointment,
  Medication,
  Vaccination,
  Deworming,
} from "../models/associations.js";
import { getPetById } from "../services/patientsService.js";
import { getUserById } from "../services/authService.js";
import {
  generateMedicalRecordPDF,
  generateMedicalHistoryPDF,
  generateVaccinationCertificatePDF,
} from "../utils/pdfGenerator.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Crear un nuevo registro médico para una cita
 */
export const createMedicalRecord = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const veterinarianId = req.user?.id;

    // Verificar que el usuario es veterinario
    if (req.user?.role?.name !== "veterinarian") {
      return res.status(403).json({
        success: false,
        message: "Solo los veterinarios pueden crear registros médicos",
      });
    }

    // Verificar que la cita existe
    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "La cita no existe",
      });
    }

    // Verificar que no exista ya un registro médico para esta cita
    const existingRecord = await MedicalRecord.findOne({
      where: { appointmentId },
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un registro médico para esta cita",
        data: existingRecord,
      });
    }

    const {
      motivoConsulta,
      anamnesis,
      examenFisico,
      diagnostico,
      tratamiento,
      procedimientosRealizados,
      observaciones,
      proximaConsulta,
      vitalSigns,
    } = req.body;

    // Validar y formatear proximaConsulta (convertir string vacío o 'Invalid date' a null)
    let validProximaConsulta = null;
    if (proximaConsulta && proximaConsulta !== 'Invalid date' && proximaConsulta.trim() !== '') {
      const dateObj = new Date(proximaConsulta);
      if (!isNaN(dateObj.getTime())) {
        validProximaConsulta = proximaConsulta;
      }
    }

    // Crear el registro médico
    const medicalRecord = await MedicalRecord.create({
      appointmentId,
      petId: appointment.petId,
      veterinarianId,
      clientId: appointment.clientId,
      fecha: appointment.fecha,
      motivoConsulta: motivoConsulta || appointment.motivo,
      anamnesis,
      examenFisico,
      diagnostico,
      tratamiento,
      procedimientosRealizados,
      observaciones,
      proximaConsulta: validProximaConsulta,
      status: "en_curso",
    });

    // Si se proporcionan signos vitales, crearlos
    if (vitalSigns) {
      await VitalSigns.create({
        recordId: medicalRecord.recordId,
        ...vitalSigns,
      });
    }

    // Cargar el registro completo con sus relaciones
    const completeRecord = await MedicalRecord.findByPk(
      medicalRecord.recordId,
      {
        include: [
          {
            model: VitalSigns,
            as: "vitalSigns",
          },
          {
            model: MedicalAttachment,
            as: "attachments",
          },
        ],
      }
    );

    return res.status(201).json({
      success: true,
      message: "Registro médico creado exitosamente",
      data: completeRecord,
    });
  } catch (error) {
    console.error("Error al crear registro médico:", error);
    return res.status(500).json({
      success: false,
      message: "Error al crear el registro médico",
      error: error.message,
    });
  }
};

/**
 * Obtener el registro médico de una cita
 */
export const getMedicalRecordByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const medicalRecord = await MedicalRecord.findOne({
      where: { appointmentId },
      include: [
        {
          model: VitalSigns,
          as: "vitalSigns",
        },
        {
          model: MedicalAttachment,
          as: "attachments",
          where: { isActive: true },
          required: false,
        },
        {
          model: Medication,
          as: "medications",
          required: false,
        },
      ],
    });

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: "No se encontró registro médico para esta cita",
      });
    }

    return res.status(200).json({
      success: true,
      data: medicalRecord,
    });
  } catch (error) {
    console.error("Error al obtener registro médico:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener el registro médico",
      error: error.message,
    });
  }
};

/**
 * Actualizar un registro médico
 */
export const updateMedicalRecord = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const veterinarianId = req.user?.id;

    // Verificar que el usuario es veterinario
    if (req.user?.role?.name !== "veterinarian") {
      return res.status(403).json({
        success: false,
        message: "Solo los veterinarios pueden actualizar registros médicos",
      });
    }

    const medicalRecord = await MedicalRecord.findOne({
      where: { appointmentId },
    });

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: "No se encontró registro médico para esta cita",
      });
    }

    const {
      motivoConsulta,
      anamnesis,
      examenFisico,
      diagnostico,
      tratamiento,
      procedimientosRealizados,
      observaciones,
      proximaConsulta,
      status,
      vitalSigns,
    } = req.body;

    // Validar y formatear proximaConsulta (convertir string vacío o 'Invalid date' a null)
    let validProximaConsulta = medicalRecord.proximaConsulta; // Mantener valor actual por defecto
    if (proximaConsulta !== undefined) {
      if (!proximaConsulta || proximaConsulta === 'Invalid date' || proximaConsulta.trim() === '') {
        validProximaConsulta = null;
      } else {
        const dateObj = new Date(proximaConsulta);
        if (!isNaN(dateObj.getTime())) {
          validProximaConsulta = proximaConsulta;
        } else {
          validProximaConsulta = null;
        }
      }
    }

    // Actualizar el registro médico
    await medicalRecord.update({
      motivoConsulta: motivoConsulta || medicalRecord.motivoConsulta,
      anamnesis: anamnesis !== undefined ? anamnesis : medicalRecord.anamnesis,
      examenFisico:
        examenFisico !== undefined ? examenFisico : medicalRecord.examenFisico,
      diagnostico:
        diagnostico !== undefined ? diagnostico : medicalRecord.diagnostico,
      tratamiento:
        tratamiento !== undefined ? tratamiento : medicalRecord.tratamiento,
      procedimientosRealizados:
        procedimientosRealizados !== undefined
          ? procedimientosRealizados
          : medicalRecord.procedimientosRealizados,
      observaciones:
        observaciones !== undefined
          ? observaciones
          : medicalRecord.observaciones,
      proximaConsulta: validProximaConsulta,
      status: status || medicalRecord.status,
    });

    // Si se proporcionan signos vitales, actualizarlos o crearlos
    if (vitalSigns) {
      const existingVitalSigns = await VitalSigns.findOne({
        where: { recordId: medicalRecord.recordId },
      });

      if (existingVitalSigns) {
        await existingVitalSigns.update(vitalSigns);
      } else {
        await VitalSigns.create({
          recordId: medicalRecord.recordId,
          ...vitalSigns,
        });
      }
    }

    // Cargar el registro actualizado con sus relaciones
    const updatedRecord = await MedicalRecord.findByPk(
      medicalRecord.recordId,
      {
        include: [
          {
            model: VitalSigns,
            as: "vitalSigns",
          },
          {
            model: MedicalAttachment,
            as: "attachments",
            where: { isActive: true },
            required: false,
          },
          {
            model: Medication,
            as: "medications",
            required: false,
          },
        ],
      }
    );

    return res.status(200).json({
      success: true,
      message: "Registro médico actualizado exitosamente",
      data: updatedRecord,
    });
  } catch (error) {
    console.error("Error al actualizar registro médico:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar el registro médico",
      error: error.message,
    });
  }
};

/**
 * Obtener historial médico completo de una mascota
 */
export const getMedicalHistoryByPet = async (req, res) => {
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

    // Obtener todos los registros médicos de la mascota
    const medicalHistory = await MedicalRecord.findAll({
      where: { petId, isActive: true },
      include: [
        {
          model: VitalSigns,
          as: "vitalSigns",
        },
        {
          model: MedicalAttachment,
          as: "attachments",
          where: { isActive: true },
          required: false,
        },
        {
          model: Medication,
          as: "medications",
          required: false,
        },
        {
          model: Appointment,
          as: "appointment",
          attributes: ["appointmentId", "fecha", "hora", "status"],
        },
      ],
      order: [["fecha", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      totalRecords: medicalHistory.length,
      data: medicalHistory,
    });
  } catch (error) {
    console.error("Error al obtener historial médico:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener el historial médico",
      error: error.message,
    });
  }
};

/**
 * Subir archivos médicos a un registro
 */
export const uploadMedicalFiles = async (req, res) => {
  try {
    const { recordId } = req.params;
    const veterinarianId = req.user?.id;

    // Verificar que el usuario es veterinario
    if (req.user?.role?.name !== "veterinarian") {
      return res.status(403).json({
        success: false,
        message: "Solo los veterinarios pueden subir archivos médicos",
      });
    }

    // Verificar que el registro médico existe
    const medicalRecord = await MedicalRecord.findByPk(recordId);
    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: "El registro médico no existe",
      });
    }

    // Verificar que se subieron archivos
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se subieron archivos",
      });
    }

    // Obtener descripciones y tipos de archivos del body
    const { fileTypes, descriptions } = req.body;

    // Crear registros de archivos en la base de datos
    const attachments = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const attachment = await MedicalAttachment.create({
        recordId,
        fileName: file.filename,
        fileType: fileTypes?.[i] || "otro",
        fileUrl: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        description: descriptions?.[i] || null,
        uploadedBy: veterinarianId,
      });
      attachments.push(attachment);
    }

    return res.status(201).json({
      success: true,
      message: `${attachments.length} archivo(s) subido(s) exitosamente`,
      data: attachments,
    });
  } catch (error) {
    console.error("Error al subir archivos médicos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al subir los archivos médicos",
      error: error.message,
    });
  }
};

/**
 * Obtener todos los archivos de un registro médico
 */
export const getMedicalAttachments = async (req, res) => {
  try {
    const { recordId } = req.params;

    const attachments = await MedicalAttachment.findAll({
      where: { recordId, isActive: true },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      totalFiles: attachments.length,
      data: attachments,
    });
  } catch (error) {
    console.error("Error al obtener archivos médicos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener los archivos médicos",
      error: error.message,
    });
  }
};

/**
 * Eliminar (soft delete) un archivo médico
 */
export const deleteMedicalAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const veterinarianId = req.user?.id;

    // Verificar que el usuario es veterinario
    if (req.user?.role?.name !== "veterinarian") {
      return res.status(403).json({
        success: false,
        message: "Solo los veterinarios pueden eliminar archivos médicos",
      });
    }

    const attachment = await MedicalAttachment.findByPk(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: "El archivo no existe",
      });
    }

    // Soft delete
    await attachment.update({ isActive: false });

    return res.status(200).json({
      success: true,
      message: "Archivo eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar archivo médico:", error);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar el archivo médico",
      error: error.message,
    });
  }
};

/**
 * Descargar un archivo médico
 */
export const downloadMedicalAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;

    const attachment = await MedicalAttachment.findByPk(attachmentId);
    if (!attachment || !attachment.isActive) {
      return res.status(404).json({
        success: false,
        message: "El archivo no existe o fue eliminado",
      });
    }

    // Verificar que el archivo existe en el sistema de archivos
    if (!fs.existsSync(attachment.fileUrl)) {
      return res.status(404).json({
        success: false,
        message: "El archivo físico no fue encontrado",
      });
    }

    // Enviar el archivo
    res.download(attachment.fileUrl, attachment.fileName);
  } catch (error) {
    console.error("Error al descargar archivo médico:", error);
    return res.status(500).json({
      success: false,
      message: "Error al descargar el archivo médico",
      error: error.message,
    });
  }
};

/**
 * Generar PDF de un registro médico individual
 */
export const generateMedicalRecordPDFEndpoint = async (req, res) => {
  try {
    const { recordId } = req.params;

    // Obtener el registro médico
    const medicalRecord = await MedicalRecord.findOne({
      where: { recordId, isActive: true },
      include: [
        {
          model: VitalSigns,
          as: "vitalSigns",
        },
      ],
    });

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: "Registro médico no encontrado",
      });
    }

    // Obtener información de la mascota
    const token = req.headers.authorization;
    const petResponse = await getPetById(medicalRecord.petId, token);
    if (!petResponse || !petResponse.data) {
      return res.status(404).json({
        success: false,
        message: "Información de la mascota no encontrada",
      });
    }

    const petData = petResponse.data;

    // Configurar headers para descarga de PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=registro-medico-${petData.petName}-${new Date(medicalRecord.fecha).toISOString().split('T')[0]}.pdf`
    );

    // Generar el PDF y enviarlo al cliente
    try {
      generateMedicalRecordPDF(medicalRecord.toJSON(), petData, res);
    } catch (pdfError) {
      console.error("Error generando el PDF:", pdfError);
      // Si ya se enviaron los headers, no podemos enviar JSON
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: "Error al generar el PDF",
          error: pdfError.message,
        });
      }
    }
  } catch (error) {
    console.error("Error al generar PDF de registro médico:", error);
    // Solo enviar JSON si no se han enviado headers
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Error al generar el PDF del registro médico",
        error: error.message,
      });
    }
  }
};

/**
 * Generar PDF del historial médico completo de una mascota
 */
export const generateMedicalHistoryPDFEndpoint = async (req, res) => {
  try {
    const { petId } = req.params;

    // Obtener información de la mascota
    const token = req.headers.authorization;
    const petResponse = await getPetById(petId, token);
    if (!petResponse || !petResponse.data) {
      return res.status(404).json({
        success: false,
        message: "Mascota no encontrada",
      });
    }

    const petData = petResponse.data;

    // Obtener todos los registros médicos
    const medicalRecords = await MedicalRecord.findAll({
      where: { petId, isActive: true },
      include: [
        {
          model: VitalSigns,
          as: "vitalSigns",
        },
      ],
      order: [["fecha", "DESC"]],
    });

    // Obtener vacunas
    const vaccinations = await Vaccination.findAll({
      where: { petId, isActive: true },
      order: [["fechaAplicacion", "DESC"]],
    });

    // Obtener desparasitaciones
    const dewormings = await Deworming.findAll({
      where: { petId, isActive: true },
      order: [["fechaAplicacion", "DESC"]],
    });

    // Configurar headers para descarga de PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=historial-medico-${petData.petName}.pdf`
    );

    // Generar el PDF y enviarlo al cliente
    generateMedicalHistoryPDF(
      petData,
      medicalRecords.map(r => r.toJSON()),
      vaccinations.map(v => v.toJSON()),
      dewormings.map(d => d.toJSON()),
      res
    );
  } catch (error) {
    console.error("Error al generar PDF de historial médico:", error);
    return res.status(500).json({
      success: false,
      message: "Error al generar el PDF del historial médico",
      error: error.message,
    });
  }
};

/**
 * Generar certificado de vacunación en PDF
 */
export const generateVaccinationCertificatePDFEndpoint = async (req, res) => {
  try {
    const { petId } = req.params;

    // Obtener información de la mascota
    const token = req.headers.authorization;
    const petResponse = await getPetById(petId, token);
    if (!petResponse || !petResponse.data) {
      return res.status(404).json({
        success: false,
        message: "Mascota no encontrada",
      });
    }

    const petData = petResponse.data;

    // Obtener todas las vacunas activas
    const vaccinations = await Vaccination.findAll({
      where: { petId, isActive: true },
      order: [["fechaAplicacion", "DESC"]],
    });

    // Configurar headers para descarga de PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=certificado-vacunacion-${petData.petName}.pdf`
    );

    // Generar el PDF y enviarlo al cliente
    generateVaccinationCertificatePDF(
      petData,
      vaccinations.map(v => v.toJSON()),
      res
    );
  } catch (error) {
    console.error("Error al generar certificado de vacunación:", error);
    return res.status(500).json({
      success: false,
      message: "Error al generar el certificado de vacunación",
      error: error.message,
    });
  }
};
