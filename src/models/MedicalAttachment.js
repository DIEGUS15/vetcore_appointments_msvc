import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

const MedicalAttachment = sequelize.define(
  "MedicalAttachment",
  {
    attachmentId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    recordId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Referencia al registro médico",
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Nombre del archivo",
    },
    fileType: {
      type: DataTypes.ENUM(
        "radiografia",
        "analisis",
        "ecografia",
        "foto",
        "documento",
        "otro"
      ),
      allowNull: false,
      comment: "Tipo de archivo médico",
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: "Ruta o URL del archivo",
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Tamaño del archivo en bytes",
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Tipo MIME del archivo (ej: image/jpeg, application/pdf)",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción del archivo",
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID del veterinario que subió el archivo",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "medical_attachments",
    timestamps: true,
  }
);

export default MedicalAttachment;
