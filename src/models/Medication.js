import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

const Medication = sequelize.define(
  "Medication",
  {
    medicationId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "medication_id",
    },
    prescriptionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "prescription_id",
      comment: "ID de la receta a la que pertenece",
      validate: {
        isInt: {
          msg: "El ID de la receta debe ser un número entero",
        },
      },
    },
    recordId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "record_id",
      comment: "ID del registro médico al que pertenece (opcional)",
      validate: {
        isInt: {
          msg: "El ID del registro médico debe ser un número entero",
        },
      },
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: "Nombre del medicamento",
      validate: {
        notNull: {
          msg: "El nombre del medicamento es obligatorio",
        },
        notEmpty: {
          msg: "El nombre del medicamento no puede estar vacío",
        },
      },
    },
    dosage: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Dosis recomendada (ej: 1 tableta cada 8 horas)",
      validate: {
        notNull: {
          msg: "La dosis es obligatoria",
        },
        notEmpty: {
          msg: "La dosis no puede estar vacía",
        },
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Cantidad a suministrar",
      validate: {
        notNull: {
          msg: "La cantidad es obligatoria",
        },
        isInt: {
          msg: "La cantidad debe ser un número entero",
        },
        min: {
          args: [1],
          msg: "La cantidad debe ser al menos 1",
        },
      },
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "unidad",
      comment: "Unidad de medida (ej: tabletas, ml, sobres)",
      validate: {
        notNull: {
          msg: "La unidad es obligatoria",
        },
      },
    },
    duration: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Duración del tratamiento (ej: 7 días)",
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Instrucciones adicionales de administración",
    },
  },
  {
    tableName: "medications",
    timestamps: true,
    underscored: true,
  }
);

export default Medication;
