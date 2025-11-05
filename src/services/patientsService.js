import axios from "axios";

const PATIENTS_SERVICE_URL =
  process.env.PATIENTS_SERVICE_URL || "http://localhost:3001";

/**
 * Cliente HTTP para comunicarse con el Patients Service
 */
const patientsServiceClient = axios.create({
  baseURL: PATIENTS_SERVICE_URL,
  timeout: 5000, // 5 segundos de timeout
});

/**
 * Obtiene información de una mascota por su ID
 * @param {number} petId - ID de la mascota
 * @param {string} token - Token JWT del usuario autenticado
 * @returns {Promise<Object>} Información de la mascota
 */
export const getPetById = async (petId, token) => {
  try {
    const response = await patientsServiceClient.get(
      `/api/patients/pets/${petId}`,
      {
        headers: {
          Authorization: token, // Pasar el token Bearer completo
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      `Error fetching pet ${petId} from Patients Service:`,
      error.message
    );

    // Si es un error 404, la mascota no existe
    if (error.response?.status === 404) {
      return null;
    }

    // Si es un error 401, token inválido
    if (error.response?.status === 401) {
      throw new Error("Unauthorized: Invalid or expired token");
    }

    // Otros errores
    throw new Error("Could not fetch pet from Patients Service");
  }
};

/**
 * Verifica que una mascota pertenezca a un cliente específico
 * @param {number} petId - ID de la mascota
 * @param {string} ownerEmail - Email del dueño de la mascota
 * @param {string} token - Token JWT del usuario autenticado
 * @returns {Promise<boolean>} True si la mascota pertenece al cliente
 */
export const verifyPetOwnership = async (petId, ownerEmail, token) => {
  try {
    const petData = await getPetById(petId, token);

    if (!petData || !petData.success) {
      return false;
    }

    // Verificar que el owner de la mascota coincida con el email del cliente
    return petData.data.owner === ownerEmail;
  } catch (error) {
    console.error("Error verifying pet ownership:", error.message);
    return false;
  }
};
