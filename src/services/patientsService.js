import axios from "axios";

const PATIENTS_SERVICE_URL =
  process.env.PATIENTS_SERVICE_URL || "http://localhost:3001";

const patientsServiceClient = axios.create({
  baseURL: PATIENTS_SERVICE_URL,
  timeout: 5000, // 5 segundos de timeout
});

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
