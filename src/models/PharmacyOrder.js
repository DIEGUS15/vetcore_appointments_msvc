import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

const PharmacyOrder = sequelize.define(
  "PharmacyOrder",
  {
    orderId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "order_id",
    },
    prescriptionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: "prescription_id",
      comment: "ID de la receta asociada",
      validate: {
        notNull: {
          msg: "El ID de la receta es obligatorio",
        },
        isInt: {
          msg: "El ID de la receta debe ser un número entero",
        },
      },
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "client_id",
      comment: "ID del cliente que debe recoger los medicamentos",
      validate: {
        notNull: {
          msg: "El ID del cliente es obligatorio",
        },
        isInt: {
          msg: "El ID del cliente debe ser un número entero",
        },
      },
    },
    status: {
      type: DataTypes.ENUM("pendiente", "en_preparacion", "lista", "entregada", "cancelada"),
      defaultValue: "pendiente",
      allowNull: false,
      comment: "Estado de la orden en droguería",
    },
    medications: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: "Lista de medicamentos en formato JSON",
    },
    totalItems: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "total_items",
      comment: "Total de items/medicamentos en la orden",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Notas adicionales de la orden",
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "delivered_at",
      comment: "Fecha y hora de entrega",
    },
  },
  {
    tableName: "pharmacy_orders",
    timestamps: true,
    underscored: true,
  }
);

export default PharmacyOrder;
