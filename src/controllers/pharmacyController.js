import { PharmacyOrder, Prescription, Medication } from "../models/associations.js";

/**
 * @desc    Obtener todas las órdenes de droguería pendientes
 * @route   GET /api/appointments/pharmacy/orders
 * @access  Private (Receptionist/Admin)
 */
export const getAllPharmacyOrders = async (req, res) => {
  try {
    const { status } = req.query;

    const whereCondition = {};
    if (status) {
      whereCondition.status = status;
    }

    const orders = await PharmacyOrder.findAll({
      where: whereCondition,
      include: [
        {
          model: Prescription,
          as: "prescription",
          include: [
            {
              model: Medication,
              as: "medications",
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Error al obtener órdenes de droguería:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las órdenes",
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener orden de droguería por ID
 * @route   GET /api/appointments/pharmacy/orders/:orderId
 * @access  Private
 */
export const getPharmacyOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await PharmacyOrder.findByPk(orderId, {
      include: [
        {
          model: Prescription,
          as: "prescription",
          include: [
            {
              model: Medication,
              as: "medications",
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Orden de droguería no encontrada",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error al obtener orden:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la orden",
      error: error.message,
    });
  }
};

/**
 * @desc    Actualizar estado de orden de droguería
 * @route   PUT /api/appointments/pharmacy/orders/:orderId/status
 * @access  Private (Receptionist/Admin)
 */
export const updatePharmacyOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ["pendiente", "en_preparacion", "lista", "entregada", "cancelada"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Debe ser uno de: ${validStatuses.join(", ")}`,
      });
    }

    const order = await PharmacyOrder.findByPk(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Orden de droguería no encontrada",
      });
    }

    // Actualizar estado
    order.status = status;
    if (notes) {
      order.notes = notes;
    }

    // Si se marca como entregada, registrar fecha de entrega
    if (status === "entregada" && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: "Estado de orden actualizado exitosamente",
      data: order,
    });
  } catch (error) {
    console.error("Error al actualizar estado de orden:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el estado",
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener órdenes de droguería de un cliente
 * @route   GET /api/appointments/pharmacy/my-orders
 * @access  Private (Client)
 */
export const getMyPharmacyOrders = async (req, res) => {
  try {
    const clientId = req.user.id;

    const orders = await PharmacyOrder.findAll({
      where: { clientId },
      include: [
        {
          model: Prescription,
          as: "prescription",
          include: [
            {
              model: Medication,
              as: "medications",
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Error al obtener órdenes del cliente:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las órdenes",
      error: error.message,
    });
  }
};
