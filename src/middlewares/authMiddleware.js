import jwt from "jsonwebtoken";

/**
 * Middleware para verificar el token JWT
 * Este middleware decodifica el token y extrae la información del usuario
 * sin necesidad de consultar la base de datos del auth service
 */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    // Decodificar el token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // El token contiene: { id, email, role: { id, name } }
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying token.",
    });
  }
};
