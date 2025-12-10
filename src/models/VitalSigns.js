import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

const VitalSigns = sequelize.define(
  "VitalSigns",
  {
    vitalSignId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    recordId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      comment: "Referencia al registro médico",
    },
    temperatura: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: true,
      comment: "Temperatura en °C",
    },
    peso: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      comment: "Peso en kg",
    },
    frecuenciaCardiaca: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Frecuencia cardíaca en latidos/min",
    },
    frecuenciaRespiratoria: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Frecuencia respiratoria en respiraciones/min",
    },
    presionArterial: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Presión arterial (ej: 120/80)",
    },
    condicionCorporal: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
      comment: "Condición corporal escala 1-5",
    },
    hidratacion: {
      type: DataTypes.ENUM("normal", "leve", "moderada", "severa"),
      allowNull: true,
      defaultValue: "normal",
      comment: "Nivel de deshidratación",
    },
  },
  {
    tableName: "vital_signs",
    timestamps: true,
  }
);

export default VitalSigns;
