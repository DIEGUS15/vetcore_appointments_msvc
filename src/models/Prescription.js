import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

const Prescription = sequelize.define(
  "Prescription",
  {
    prescriptionId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "prescription_id",
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: "appointment_id",
      comment: "ID de la cita asociada",
      validate: {
        notNull: {
          msg: "El ID de la cita es obligatorio",
        },
        isInt: {
          msg: "El ID de la cita debe ser un número entero",
        },
      },
    },
    veterinarianId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "veterinarian_id",
      comment: "ID del veterinario que expide la receta",
      validate: {
        notNull: {
          msg: "El ID del veterinario es obligatorio",
        },
        isInt: {
          msg: "El ID del veterinario debe ser un número entero",
        },
      },
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "client_id",
      comment: "ID del cliente/dueño de la mascota",
      validate: {
        notNull: {
          msg: "El ID del cliente es obligatorio",
        },
        isInt: {
          msg: "El ID del cliente debe ser un número entero",
        },
      },
    },
    petId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "pet_id",
      comment: "ID de la mascota",
      validate: {
        notNull: {
          msg: "El ID de la mascota es obligatorio",
        },
        isInt: {
          msg: "El ID de la mascota debe ser un número entero",
        },
      },
    },
    observations: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Observaciones generales de la receta",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: "is_active",
      comment: "Indica si la receta está activa (soft delete)",
    },
  },
  {
    tableName: "prescriptions",
    timestamps: true,
    underscored: true,
  }
);

export default Prescription;
