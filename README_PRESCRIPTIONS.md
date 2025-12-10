# Sistema de Recetas Médicas y Droguería

Este documento describe la funcionalidad de recetas médicas y órdenes de droguería implementada en el Appointments Service.

## Descripción General

El sistema permite a los veterinarios expedir recetas médicas después de atender a una mascota. Cuando se expide una receta, automáticamente se crea una orden en la droguería para que el personal pueda preparar los medicamentos que el cliente debe adquirir.

## Modelos de Datos

### Prescription (Receta Médica)
```javascript
{
  prescriptionId: INTEGER (PK),
  appointmentId: INTEGER (FK única),
  veterinarianId: INTEGER,
  clientId: INTEGER,
  petId: INTEGER,
  observations: TEXT (opcional),
  isActive: BOOLEAN,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}
```

### Medication (Medicamento)
```javascript
{
  medicationId: INTEGER (PK),
  prescriptionId: INTEGER (FK),
  name: STRING,
  dosage: STRING,
  quantity: INTEGER,
  unit: STRING (default: 'unidad'),
  duration: STRING (opcional),
  instructions: TEXT (opcional),
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}
```

### PharmacyOrder (Orden de Droguería)
```javascript
{
  orderId: INTEGER (PK),
  prescriptionId: INTEGER (FK única),
  clientId: INTEGER,
  status: ENUM('pendiente', 'en_preparacion', 'lista', 'entregada', 'cancelada'),
  medications: JSON,
  totalItems: INTEGER,
  notes: TEXT (opcional),
  deliveredAt: TIMESTAMP (nullable),
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}
```

## Relaciones

- **Appointment** ↔ **Prescription**: Relación 1:1 (una cita puede tener una receta)
- **Prescription** ↔ **Medication**: Relación 1:N (una receta tiene múltiples medicamentos)
- **Prescription** ↔ **PharmacyOrder**: Relación 1:1 (una receta genera una orden de droguería)

## Endpoints API

### 1. Expedir Receta Médica

**POST** `/api/appointments/:appointmentId/prescription`

**Acceso:** Veterinario autenticado

**Body:**
```json
{
  "observations": "Continuar tratamiento por 7 días",
  "medications": [
    {
      "name": "Amoxicilina 500mg",
      "dosage": "1 tableta cada 8 horas",
      "quantity": 21,
      "unit": "tabletas",
      "duration": "7 días",
      "instructions": "Administrar con alimento"
    },
    {
      "name": "Antiinflamatorio",
      "dosage": "1 tableta cada 12 horas",
      "quantity": 14,
      "unit": "tabletas",
      "duration": "7 días"
    }
  ]
}
```

**Validaciones:**
- La cita debe existir y pertenecer al veterinario
- La cita debe tener diagnóstico y procedimiento registrados
- Debe incluir al menos un medicamento
- No puede haber una receta previa para la misma cita

**Response (201):**
```json
{
  "success": true,
  "message": "Receta médica expedida exitosamente",
  "data": {
    "prescriptionId": 1,
    "appointmentId": 5,
    "veterinarianId": 2,
    "clientId": 10,
    "petId": 3,
    "observations": "Continuar tratamiento por 7 días",
    "medications": [...],
    "pharmacyOrder": {
      "orderId": 1,
      "status": "pendiente",
      "totalItems": 35
    }
  }
}
```

### 2. Consultar Receta de una Cita

**GET** `/api/appointments/:appointmentId/prescription`

**Acceso:** Usuario autenticado

**Response (200):**
```json
{
  "success": true,
  "data": {
    "prescriptionId": 1,
    "medications": [...],
    "pharmacyOrder": {...}
  }
}
```

### 3. Consultar Mis Recetas (Cliente)

**GET** `/api/appointments/prescriptions/my-prescriptions`

**Acceso:** Cliente autenticado

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "prescriptionId": 1,
      "appointment": {
        "appointmentId": 5,
        "fecha": "2025-01-15",
        "hora": "10:00:00",
        "motivo": "Control veterinario"
      },
      "medications": [...]
    }
  ]
}
```

### 4. Consultar Órdenes de Droguería

**GET** `/api/appointments/pharmacy/orders?status=pendiente`

**Acceso:** Recepcionista/Admin

**Query params:**
- `status` (opcional): filtrar por estado

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "orderId": 1,
      "clientId": 10,
      "status": "pendiente",
      "medications": [...],
      "totalItems": 35,
      "prescription": {...}
    }
  ]
}
```

### 5. Consultar Mis Órdenes (Cliente)

**GET** `/api/appointments/pharmacy/my-orders`

**Acceso:** Cliente autenticado

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [...]
}
```

### 6. Actualizar Estado de Orden

**PUT** `/api/appointments/pharmacy/orders/:orderId/status`

**Acceso:** Recepcionista/Admin

**Body:**
```json
{
  "status": "en_preparacion",
  "notes": "Preparando medicamentos"
}
```

**Estados válidos:**
- `pendiente`: Orden recién creada
- `en_preparacion`: Droguería está preparando los medicamentos
- `lista`: Medicamentos listos para retirar
- `entregada`: Cliente retiró los medicamentos
- `cancelada`: Orden cancelada

**Response (200):**
```json
{
  "success": true,
  "message": "Estado de orden actualizado exitosamente",
  "data": {
    "orderId": 1,
    "status": "en_preparacion"
  }
}
```

## Flujo de Trabajo

1. **Veterinario atiende a la mascota:**
   - Registra procedimiento, diagnóstico e indicaciones en la cita
   - Endpoint: `PUT /api/appointments/:appointmentId/attention`

2. **Veterinario expide receta:**
   - Crea la receta con los medicamentos necesarios
   - Endpoint: `POST /api/appointments/:appointmentId/prescription`
   - El sistema automáticamente crea una orden en droguería con estado "pendiente"

3. **Personal de droguería:**
   - Consulta órdenes pendientes
   - Endpoint: `GET /api/appointments/pharmacy/orders?status=pendiente`
   - Actualiza estado a "en_preparacion" mientras prepara
   - Actualiza estado a "lista" cuando está listo

4. **Cliente:**
   - Puede consultar sus recetas: `GET /api/appointments/prescriptions/my-prescriptions`
   - Puede consultar sus órdenes: `GET /api/appointments/pharmacy/my-orders`
   - Retira medicamentos en droguería

5. **Personal entrega medicamentos:**
   - Actualiza estado a "entregada"
   - El sistema registra automáticamente `deliveredAt`

## Consideraciones Técnicas

- **Transacciones:** La creación de receta, medicamentos y orden de droguería se hace en una transacción para garantizar consistencia
- **Validaciones:** Se verifica que la cita tenga diagnóstico antes de permitir expedir receta
- **Soft Delete:** Las recetas usan `isActive` para soft delete
- **Timestamps:** Todos los modelos registran `createdAt` y `updatedAt`
- **Cascade Delete:** Al eliminar una receta se eliminan los medicamentos y la orden asociados

## Base de Datos

Las tablas creadas son:
- `prescriptions`
- `medications`
- `pharmacy_orders`

Para sincronizar los modelos con la base de datos, el servidor usa:
```javascript
await sequelize.sync({ alter: true });
```

Esto modifica las tablas automáticamente sin perder datos.
