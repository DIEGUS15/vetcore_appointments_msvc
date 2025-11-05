/**
 * Middleware para verificar roles de usuario
 * Debe usarse después del middleware verifyToken
 *
 * @param {...string} allowedRoles - Roles permitidos para acceder a la ruta
 * @returns {Function} Express middleware
 *
 * @example
 * router.post("/pets", verifyToken, checkRole("admin", "veterinarian"), createPet);
 */
export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      // El rol viene en el token decodificado
      const userRole = req.user.role?.name;

      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: "User role not found in token.",
        });
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(", ")}. Your role: ${userRole}`,
        });
      }

      next();
    } catch (error) {
      console.error("Role middleware error:", error);
      res.status(500).json({
        success: false,
        message: "Error checking role permissions",
      });
    }
  };
};
