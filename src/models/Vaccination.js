import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

const Vaccination = sequelize.define(
  "Vaccination",
  {
    vaccinationId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    petId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID de la mascota (desde Patients Service)",
    },
    recordId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del registro médico (opcional, si se aplicó en consulta)",
    },
    nombreVacuna: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: "Nombre de la vacuna",
    },
    fechaAplicacion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: "Fecha de aplicación de la vacuna",
    },
    proximaDosis: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Fecha sugerida para próxima dosis",
    },
    lote: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Número de lote de la vacuna",
    },
    fabricante: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "Fabricante de la vacuna",
    },
    veterinarianId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID del veterinario que aplicó la vacuna",
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Observaciones sobre la vacunación",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "vaccinations",
    timestamps: true,
  }
);

export default Vaccination;
