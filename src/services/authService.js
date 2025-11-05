import axios from "axios";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:3000";

/**
 * Cliente HTTP para comunicarse con el Auth Service
 */
const authServiceClient = axios.create({
  baseURL: AUTH_SERVICE_URL,
  timeout: 5000, // 5 segundos de timeout
});

/**
 * Obtiene información de un usuario por su ID
 * @param {number} userId - ID del usuario
 * @param {string} token - Token JWT del usuario autenticado
 * @returns {Promise<Object|null>} Información del usuario o null si no existe
 */
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

/**
 * Verifica que un usuario tenga el rol de veterinario
 * @param {number} veterinarianId - ID del veterinario
 * @param {string} token - Token JWT del usuario autenticado
 * @returns {Promise<boolean>} True si el usuario es veterinario
 */
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

/**
 * Obtiene la lista de veterinarios disponibles
 * @param {string} token - Token JWT del usuario autenticado
 * @returns {Promise<Array>} Lista de veterinarios
 */
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
    console.error("Error fetching veterinarians from Auth Service:", error.message);
    throw new Error("Could not fetch veterinarians from Auth Service");
  }
};
