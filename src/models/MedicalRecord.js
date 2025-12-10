import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

const MedicalRecord = sequelize.define(
  "MedicalRecord",
  {
    recordId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      comment: "Referencia a la cita (Appointment)",
    },
    petId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID de la mascota (desde Patients Service)",
    },
    veterinarianId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID del veterinario (desde Auth Service)",
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID del cliente dueño de la mascota",
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: "Fecha de la consulta",
    },
    motivoConsulta: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "Motivo de la visita",
    },
    anamnesis: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Historia clínica relatada por el dueño",
    },
    examenFisico: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción del examen físico realizado",
    },
    diagnostico: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Diagnóstico veterinario",
    },
    tratamiento: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Tratamiento prescrito",
    },
    procedimientosRealizados: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Procedimientos realizados durante la consulta",
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Observaciones generales",
    },
    proximaConsulta: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Fecha sugerida para próxima consulta",
    },
    status: {
      type: DataTypes.ENUM("en_curso", "finalizado"),
      allowNull: false,
      defaultValue: "en_curso",
      comment: "Estado del registro médico",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "medical_records",
    timestamps: true,
  }
);

export default MedicalRecord;
