import amqp from "amqplib";
import dotenv from "dotenv";

dotenv.config();

let connection = null;
let channel = null;

export const connectRabbitMQ = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      connection = await amqp.connect(
        process.env.RABBITMQ_URL || "amqp://localhost:5672"
      );
      channel = await connection.createChannel();

      await channel.assertExchange("vetcore.events", "topic", {
        durable: true,
      });

      console.log("RabbitMQ successfully connected");

      connection.on("error", (err) => {
        console.error("RabbitMQ connection error:", err);
      });

      connection.on("close", () => {
        console.log("RabbitMQ connection closed");
      });

      return { connection, channel };
    } catch (error) {
      console.log(
        `Attempt ${i + 1}/${retries} - Waiting for RabbitMQ connection...`
      );
      if (i === retries - 1) {
        console.error("Error connecting to RabbitMQ:", error.message);
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export const getChannel = () => {
  if (!channel) {
    throw new Error("Rabbit channel not initialized");
  }
  return channel;
};

export const publishEvent = async (routingKey, data) => {
  try {
    const ch = getChannel();
    const exchange = "vetcore.events";

    ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(data)), {
      persistent: true,
    });

    console.log(`Event published: ${routingKey}`, data);
  } catch (error) {
    console.error(`Error publishing event ${routingKey}:`, error);
    throw error;
  }
};

export const closeConnection = async () => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log("RabbitMQ connection closed gracefully");
  } catch (error) {
    console.error("Error closing RabbitMQ connection:", error);
  }
};
