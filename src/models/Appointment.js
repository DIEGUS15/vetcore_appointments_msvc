import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

const Appointment = sequelize.define(
  "Appointment",
  {
    appointmentId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "appointment_id",
    },
    fecha: {
      type: DataTypes.DATEONLY, // Solo fecha sin hora (YYYY-MM-DD)
      allowNull: false,
      validate: {
        notNull: {
          msg: "La fecha es obligatoria",
        },
        isDate: {
          msg: "Debe ser una fecha válida",
        },
      },
    },
    hora: {
      type: DataTypes.TIME, // Solo hora (HH:MM:SS)
      allowNull: false,
      validate: {
        notNull: {
          msg: "La hora es obligatoria",
        },
      },
    },
    motivo: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: {
          msg: "El motivo es obligatorio",
        },
        notEmpty: {
          msg: "El motivo no puede estar vacío",
        },
      },
    },
    petId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "pet_id",
      validate: {
        notNull: {
          msg: "El ID de la mascota es obligatorio",
        },
        isInt: {
          msg: "El ID de la mascota debe ser un número entero",
        },
      },
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "client_id",
      comment: "ID del cliente/dueño que solicita la cita",
      validate: {
        notNull: {
          msg: "El ID del cliente es obligatorio",
        },
        isInt: {
          msg: "El ID del cliente debe ser un número entero",
        },
      },
    },
    veterinarianId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "veterinarian_id",
      comment: "ID del veterinario asignado a la cita",
      validate: {
        notNull: {
          msg: "El ID del veterinario es obligatorio",
        },
        isInt: {
          msg: "El ID del veterinario debe ser un número entero",
        },
      },
    },
    status: {
      type: DataTypes.ENUM("pendiente", "confirmada", "cancelada", "completada"),
      defaultValue: "pendiente",
      allowNull: false,
      comment: "Estado de la cita",
    },
    procedimiento: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Procedimiento realizado durante la atención",
    },
    diagnostico: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Diagnóstico del veterinario",
    },
    indicaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Indicaciones y recomendaciones a seguir",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: "is_active",
      comment: "Indica si la cita está activa o eliminada (soft delete)",
    },
  },
  {
    tableName: "appointments",
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    underscored: true, // Usa snake_case para nombres de columnas automáticas
  }
);

export default Appointment;
