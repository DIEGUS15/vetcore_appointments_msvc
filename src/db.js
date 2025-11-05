import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export const testConnection = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log("Database successfully connected");
      return true;
    } catch (error) {
      console.log(
        `Attemp ${i + 1}/${retries} - Waiting for database connection...`
      );
      if (i === retries - 1) {
        console.error("Error connecting to the database:", error.message);
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};
