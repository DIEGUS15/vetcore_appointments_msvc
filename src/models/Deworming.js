import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

const Deworming = sequelize.define(
  "Deworming",
  {
    dewormingId: {
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
    producto: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: "Nombre del producto antiparasitario",
    },
    tipoParasito: {
      type: DataTypes.ENUM("interno", "externo", "ambos"),
      allowNull: false,
      defaultValue: "interno",
      comment: "Tipo de parásito que combate",
    },
    fechaAplicacion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: "Fecha de aplicación del desparasitante",
    },
    proximaDosis: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Fecha sugerida para próxima dosis",
    },
    peso: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      comment: "Peso de la mascota al momento de la aplicación (kg)",
    },
    dosis: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Dosis aplicada",
    },
    viaAdministracion: {
      type: DataTypes.ENUM("oral", "topica", "inyectable"),
      allowNull: true,
      comment: "Vía de administración del producto",
    },
    veterinarianId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID del veterinario que aplicó el desparasitante",
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Observaciones sobre la desparasitación",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "dewormings",
    timestamps: true,
  }
);

export default Deworming;
