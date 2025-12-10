import axios from "axios";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:3000";

const authServiceClient = axios.create({
  baseURL: AUTH_SERVICE_URL,
  timeout: 5000, // 5 segundos de timeout
});

export const getUserById = async (userId, token) => {
  try {
    const response = await authServiceClient.get(`/api/users/${userId}`, {
      headers: {
        Authorization: token, // Pasar el token Bearer completo
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      `Error fetching user ${userId} from Auth Service:`,
      error.message
    );

    // Si es un error 404, el usuario no existe
    if (error.response?.status === 404) {
      return null;
    }

    // Si es un error 401, token inválido
    if (error.response?.status === 401) {
      throw new Error("Unauthorized: Invalid or expired token");
    }

    // Otros errores
    throw new Error("Could not fetch user from Auth Service");
  }
};

export const verifyVeterinarianRole = async (veterinarianId, token) => {
  try {
    const userData = await getUserById(veterinarianId, token);

    if (!userData || !userData.success) {
      return false;
    }

    // Verificar que el usuario tenga el rol de veterinarian
    const user = userData.data?.user || userData.data;
    return user.role?.name === "veterinarian";
  } catch (error) {
    console.error("Error verifying veterinarian role:", error.message);
    return false;
  }
};

export const getVeterinarians = async (token) => {
  try {
    const response = await authServiceClient.get("/api/users", {
      params: { role: "veterinarian" }, // Filtrar por rol veterinario
      headers: {
        Authorization: token,
      },
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    return [];
  } catch (error) {
    console.error(
      "Error fetching veterinarians from Auth Service:",
      error.message
    );
    throw new Error("Could not fetch veterinarians from Auth Service");
  }
};
