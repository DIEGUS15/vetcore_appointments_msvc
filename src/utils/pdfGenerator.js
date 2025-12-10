import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Genera un PDF de un registro médico individual
 */
export const generateMedicalRecordPDF = (recordData, petData, stream) => {
  const doc = new PDFDocument({ margin: 50 });

  doc.pipe(stream);

  // Header
  doc.fontSize(20).text('VetCore - Registro Médico Veterinario', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}`, { align: 'right' });
  doc.moveDown(2);

  // Información de la mascota
  doc.fontSize(14).fillColor('#2563eb').text('Información del Paciente', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#000000');
  doc.text(`Nombre: ${petData.petName}`);
  doc.text(`Especie: ${petData.species}`);
  doc.text(`Raza: ${petData.breed || 'No especificada'}`);
  doc.text(`Edad: ${petData.age} años`);
  doc.text(`Peso actual: ${petData.weight} kg`);
  doc.text(`Género: ${petData.gender}`);
  doc.moveDown(2);

  // Información de la consulta
  doc.fontSize(14).fillColor('#2563eb').text('Información de la Consulta', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#000000');
  doc.text(`Fecha de consulta: ${new Date(recordData.fecha).toLocaleDateString('es-ES')}`);
  doc.text(`Motivo: ${recordData.motivoConsulta}`);
  doc.text(`Estado: ${recordData.status === 'finalizado' ? 'Finalizada' : 'En curso'}`);
  doc.moveDown(2);

  // Signos vitales
  if (recordData.vitalSigns) {
    doc.fontSize(14).fillColor('#2563eb').text('Signos Vitales', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#000000');

    if (recordData.vitalSigns.temperatura) {
      doc.text(`Temperatura: ${recordData.vitalSigns.temperatura}°C`);
    }
    if (recordData.vitalSigns.peso) {
      doc.text(`Peso: ${recordData.vitalSigns.peso} kg`);
    }
    if (recordData.vitalSigns.frecuenciaCardiaca) {
      doc.text(`Frecuencia Cardíaca: ${recordData.vitalSigns.frecuenciaCardiaca} lpm`);
    }
    if (recordData.vitalSigns.frecuenciaRespiratoria) {
      doc.text(`Frecuencia Respiratoria: ${recordData.vitalSigns.frecuenciaRespiratoria} rpm`);
    }
    if (recordData.vitalSigns.presionArterial) {
      doc.text(`Presión Arterial: ${recordData.vitalSigns.presionArterial} mmHg`);
    }
    if (recordData.vitalSigns.condicionCorporal) {
      doc.text(`Condición Corporal: ${recordData.vitalSigns.condicionCorporal}/5`);
    }
    if (recordData.vitalSigns.hidratacion) {
      doc.text(`Hidratación: ${recordData.vitalSigns.hidratacion}`);
    }
    doc.moveDown(2);
  }

  // Anamnesis
  if (recordData.anamnesis) {
    doc.fontSize(14).fillColor('#2563eb').text('Anamnesis', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#000000');
    doc.text(recordData.anamnesis, { align: 'justify' });
    doc.moveDown(2);
  }

  // Examen Físico
  if (recordData.examenFisico) {
    doc.fontSize(14).fillColor('#2563eb').text('Examen Físico', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#000000');
    doc.text(recordData.examenFisico, { align: 'justify' });
    doc.moveDown(2);
  }

  // Diagnóstico
  if (recordData.diagnostico) {
    doc.fontSize(14).fillColor('#2563eb').text('Diagnóstico', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#000000');
    doc.text(recordData.diagnostico, { align: 'justify' });
    doc.moveDown(2);
  }

  // Tratamiento
  if (recordData.tratamiento) {
    doc.fontSize(14).fillColor('#2563eb').text('Tratamiento', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#000000');
    doc.text(recordData.tratamiento, { align: 'justify' });
    doc.moveDown(2);
  }

  // Procedimientos realizados
  if (recordData.procedimientosRealizados) {
    doc.fontSize(14).fillColor('#2563eb').text('Procedimientos Realizados', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#000000');
    doc.text(recordData.procedimientosRealizados, { align: 'justify' });
    doc.moveDown(2);
  }

  // Observaciones
  if (recordData.observaciones) {
    doc.fontSize(14).fillColor('#2563eb').text('Observaciones y Recomendaciones', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#000000');
    doc.text(recordData.observaciones, { align: 'justify' });
    doc.moveDown(2);
  }

  // Próxima consulta
  if (recordData.proximaConsulta) {
    doc.fontSize(14).fillColor('#2563eb').text('Próxima Consulta Sugerida', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#000000');
    doc.text(new Date(recordData.proximaConsulta).toLocaleDateString('es-ES'));
    doc.moveDown(2);
  }

  // Footer
  doc.fontSize(8).fillColor('#666666');
  const bottomY = doc.page.height - 50;
  doc.text('VetCore - Sistema de Gestión Veterinaria', 50, bottomY, { align: 'center' });
  doc.text(`Documento generado el ${new Date().toLocaleString('es-ES')}`, { align: 'center' });

  doc.end();
};

/**
 * Genera un PDF del historial médico completo de una mascota
 */
export const generateMedicalHistoryPDF = (petData, recordsData, vaccinationsData, dewormingsData, stream) => {
  const doc = new PDFDocument({ margin: 50 });

  doc.pipe(stream);

  // Header
  doc.fontSize(20).text('VetCore - Historial Médico Completo', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}`, { align: 'right' });
  doc.moveDown(2);

  // Información de la mascota
  doc.fontSize(16).fillColor('#2563eb').text('Información del Paciente', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#000000');
  doc.text(`Nombre: ${petData.petName}`);
  doc.text(`Especie: ${petData.species}`);
  doc.text(`Raza: ${petData.breed || 'No especificada'}`);
  doc.text(`Edad: ${petData.age} años`);
  doc.text(`Peso actual: ${petData.weight} kg`);
  doc.text(`Género: ${petData.gender}`);
  doc.moveDown(2);

  // Historial de consultas
  if (recordsData && recordsData.length > 0) {
    doc.fontSize(16).fillColor('#2563eb').text('Historial de Consultas', { underline: true });
    doc.moveDown(1);

    recordsData.forEach((record, index) => {
      doc.fontSize(12).fillColor('#000000').text(`Consulta ${index + 1} - ${new Date(record.fecha).toLocaleDateString('es-ES')}`, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Motivo: ${record.motivoConsulta}`);
      if (record.diagnostico) {
        doc.text(`Diagnóstico: ${record.diagnostico}`);
      }
      if (record.tratamiento) {
        doc.text(`Tratamiento: ${record.tratamiento}`);
      }
      doc.moveDown(1.5);

      // Add page break if needed
      if (doc.y > 650) {
        doc.addPage();
      }
    });
  }

  // Historial de vacunas
  if (vaccinationsData && vaccinationsData.length > 0) {
    if (doc.y > 600) {
      doc.addPage();
    }

    doc.fontSize(16).fillColor('#2563eb').text('Historial de Vacunación', { underline: true });
    doc.moveDown(1);

    vaccinationsData.forEach((vaccination, index) => {
      doc.fontSize(10).fillColor('#000000');
      doc.text(`${index + 1}. ${vaccination.nombreVacuna} - ${new Date(vaccination.fechaAplicacion).toLocaleDateString('es-ES')}`);
      if (vaccination.proximaDosis) {
        doc.text(`   Próxima dosis: ${new Date(vaccination.proximaDosis).toLocaleDateString('es-ES')}`);
      }
      doc.moveDown(0.5);
    });
    doc.moveDown(1);
  }

  // Historial de desparasitaciones
  if (dewormingsData && dewormingsData.length > 0) {
    if (doc.y > 600) {
      doc.addPage();
    }

    doc.fontSize(16).fillColor('#2563eb').text('Historial de Desparasitación', { underline: true });
    doc.moveDown(1);

    dewormingsData.forEach((deworming, index) => {
      doc.fontSize(10).fillColor('#000000');
      doc.text(`${index + 1}. ${deworming.producto} (${deworming.tipoParasito}) - ${new Date(deworming.fechaAplicacion).toLocaleDateString('es-ES')}`);
      if (deworming.proximaDosis) {
        doc.text(`   Próxima dosis: ${new Date(deworming.proximaDosis).toLocaleDateString('es-ES')}`);
      }
      doc.moveDown(0.5);
    });
  }

  // Footer
  doc.fontSize(8).fillColor('#666666');
  const bottomY = doc.page.height - 50;
  doc.text('VetCore - Sistema de Gestión Veterinaria', 50, bottomY, { align: 'center' });
  doc.text(`Documento generado el ${new Date().toLocaleString('es-ES')}`, { align: 'center' });

  doc.end();
};

/**
 * Genera un certificado de vacunación en PDF
 */
export const generateVaccinationCertificatePDF = (petData, vaccinationsData, stream) => {
  const doc = new PDFDocument({ margin: 50 });

  doc.pipe(stream);

  // Header
  doc.fontSize(24).fillColor('#2563eb').text('CERTIFICADO DE VACUNACIÓN', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).fillColor('#000000').text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}`, { align: 'right' });
  doc.moveDown(3);

  // Información de la mascota
  doc.fontSize(14).text('INFORMACIÓN DEL PACIENTE', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11);
  doc.text(`Nombre: ${petData.petName}`);
  doc.text(`Especie: ${petData.species}`);
  doc.text(`Raza: ${petData.breed || 'No especificada'}`);
  doc.text(`Edad: ${petData.age} años`);
  doc.text(`Propietario: ${petData.owner || 'N/A'}`);
  doc.moveDown(2);

  // Tabla de vacunas
  doc.fontSize(14).text('REGISTRO DE VACUNACIÓN', { underline: true });
  doc.moveDown(1);

  if (vaccinationsData && vaccinationsData.length > 0) {
    // Table headers
    const tableTop = doc.y;
    const col1X = 50;
    const col2X = 200;
    const col3X = 320;
    const col4X = 450;

    doc.fontSize(10).fillColor('#2563eb');
    doc.text('Vacuna', col1X, tableTop);
    doc.text('Fecha Aplicación', col2X, tableTop);
    doc.text('Lote', col3X, tableTop);
    doc.text('Próxima Dosis', col4X, tableTop);

    // Draw line under headers
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    doc.moveDown();

    // Table rows
    doc.fontSize(9).fillColor('#000000');
    vaccinationsData.forEach((vaccination, index) => {
      const y = tableTop + 25 + (index * 25);

      doc.text(vaccination.nombreVacuna, col1X, y, { width: 140 });
      doc.text(new Date(vaccination.fechaAplicacion).toLocaleDateString('es-ES'), col2X, y);
      doc.text(vaccination.lote || 'N/A', col3X, y);
      doc.text(
        vaccination.proximaDosis
          ? new Date(vaccination.proximaDosis).toLocaleDateString('es-ES')
          : 'N/A',
        col4X,
        y
      );

      // Add page break if needed
      if (y > 700) {
        doc.addPage();
      }
    });
  } else {
    doc.fontSize(10).fillColor('#666666').text('No hay vacunas registradas', { align: 'center' });
  }

  // Firma y sello
  doc.moveDown(4);
  doc.fontSize(10).fillColor('#000000');
  doc.text('_____________________________', { align: 'center' });
  doc.text('Firma y Sello del Veterinario', { align: 'center' });

  // Footer
  doc.fontSize(8).fillColor('#666666');
  const bottomY = doc.page.height - 50;
  doc.text('VetCore - Sistema de Gestión Veterinaria', 50, bottomY, { align: 'center' });
  doc.text('Este certificado es válido para efectos de comprobación de vacunación', { align: 'center' });
  doc.text(`Documento generado el ${new Date().toLocaleString('es-ES')}`, { align: 'center' });

  doc.end();
};
