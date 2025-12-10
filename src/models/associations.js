import Appointment from "./Appointment.js";
import Prescription from "./Prescription.js";
import Medication from "./Medication.js";
import PharmacyOrder from "./PharmacyOrder.js";
import MedicalRecord from "./MedicalRecord.js";
import VitalSigns from "./VitalSigns.js";
import MedicalAttachment from "./MedicalAttachment.js";
import Vaccination from "./Vaccination.js";
import Deworming from "./Deworming.js";

/**
 * Definición de asociaciones entre modelos
 */

// Appointment - Prescription (1:1)
Appointment.hasOne(Prescription, {
  foreignKey: "appointmentId",
  as: "prescription",
  onDelete: "CASCADE",
});

Prescription.belongsTo(Appointment, {
  foreignKey: "appointmentId",
  as: "appointment",
});

// Prescription - Medication (1:N)
Prescription.hasMany(Medication, {
  foreignKey: "prescriptionId",
  as: "medications",
  onDelete: "CASCADE",
});

Medication.belongsTo(Prescription, {
  foreignKey: "prescriptionId",
  as: "prescription",
});

// Prescription - PharmacyOrder (1:1)
Prescription.hasOne(PharmacyOrder, {
  foreignKey: "prescriptionId",
  as: "pharmacyOrder",
  onDelete: "CASCADE",
});

PharmacyOrder.belongsTo(Prescription, {
  foreignKey: "prescriptionId",
  as: "prescription",
});

// Appointment - MedicalRecord (1:1)
Appointment.hasOne(MedicalRecord, {
  foreignKey: "appointmentId",
  as: "medicalRecord",
  onDelete: "CASCADE",
});

MedicalRecord.belongsTo(Appointment, {
  foreignKey: "appointmentId",
  as: "appointment",
});

// MedicalRecord - VitalSigns (1:1)
MedicalRecord.hasOne(VitalSigns, {
  foreignKey: "recordId",
  as: "vitalSigns",
  onDelete: "CASCADE",
});

VitalSigns.belongsTo(MedicalRecord, {
  foreignKey: "recordId",
  as: "medicalRecord",
});

// MedicalRecord - MedicalAttachment (1:N)
MedicalRecord.hasMany(MedicalAttachment, {
  foreignKey: "recordId",
  as: "attachments",
  onDelete: "CASCADE",
});

MedicalAttachment.belongsTo(MedicalRecord, {
  foreignKey: "recordId",
  as: "medicalRecord",
});

// MedicalRecord - Medication (1:N) - vincular medicamentos al historial
MedicalRecord.hasMany(Medication, {
  foreignKey: "recordId",
  as: "medications",
  onDelete: "SET NULL",
});

Medication.belongsTo(MedicalRecord, {
  foreignKey: "recordId",
  as: "medicalRecord",
});

// MedicalRecord - Vaccination (1:N) - vincular vacunas al historial
MedicalRecord.hasMany(Vaccination, {
  foreignKey: "recordId",
  as: "vaccinations",
  onDelete: "SET NULL",
});

Vaccination.belongsTo(MedicalRecord, {
  foreignKey: "recordId",
  as: "medicalRecord",
});

// MedicalRecord - Deworming (1:N) - vincular desparasitaciones al historial
MedicalRecord.hasMany(Deworming, {
  foreignKey: "recordId",
  as: "dewormings",
  onDelete: "SET NULL",
});

Deworming.belongsTo(MedicalRecord, {
  foreignKey: "recordId",
  as: "medicalRecord",
});

export {
  Appointment,
  Prescription,
  Medication,
  PharmacyOrder,
  MedicalRecord,
  VitalSigns,
  MedicalAttachment,
  Vaccination,
  Deworming,
};
