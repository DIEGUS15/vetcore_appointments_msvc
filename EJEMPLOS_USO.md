# Ejemplos de Uso - Sistema de Recetas Médicas

Este documento contiene ejemplos prácticos de cómo usar los endpoints del sistema de recetas médicas y droguería.

## Prerequisitos

- Tener el servicio de Appointments corriendo
- Tener un token JWT válido de un veterinario
- Tener una cita con atención completada (diagnóstico y procedimiento registrados)

## Flujo Completo: De la Consulta a la Droguería

### 1. Veterinario Registra la Atención

**Endpoint:** `PUT /api/appointments/:appointmentId/attention`

```bash
curl -X PUT http://localhost:8000/api/appointments/5/attention \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_VETERINARIO" \
  -d '{
    "procedimiento": "Examen físico completo. Auscultación cardiopulmonar normal. Revisión de piel y pelaje.",
    "diagnostico": "Infección respiratoria leve. Probable bronquitis.",
    "indicaciones": "Reposo relativo. Evitar ejercicio intenso por 7 días. Administrar medicamentos según prescripción."
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Atención registrada exitosamente",
  "data": {
    "appointmentId": 5,
    "status": "completada",
    "procedimiento": "Examen físico completo...",
    "diagnostico": "Infección respiratoria leve...",
    "indicaciones": "Reposo relativo..."
  }
}
```

### 2. Veterinario Expide Receta Médica

**Endpoint:** `POST /api/appointments/:appointmentId/prescription`

```bash
curl -X POST http://localhost:8000/api/appointments/5/prescription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_VETERINARIO" \
  -d '{
    "observations": "Continuar tratamiento completo. No suspender antibiótico antes de finalizar.",
    "medications": [
      {
        "name": "Amoxicilina 500mg",
        "dosage": "1 tableta cada 8 horas",
        "quantity": 21,
        "unit": "tabletas",
        "duration": "7 días",
        "instructions": "Administrar con alimento para mejor absorción"
      },
      {
        "name": "Antiinflamatorio Carprofeno 50mg",
        "dosage": "1 tableta cada 12 horas",
        "quantity": 14,
        "unit": "tabletas",
        "duration": "7 días",
        "instructions": "Dar con comida para evitar molestias estomacales"
      },
      {
        "name": "Jarabe expectorante",
        "dosage": "5ml cada 8 horas",
        "quantity": 1,
        "unit": "frasco 120ml",
        "duration": "7 días"
      }
    ]
  }'
```

**Response:**
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
    "observations": "Continuar tratamiento completo...",
    "isActive": true,
    "medications": [
      {
        "medicationId": 1,
        "name": "Amoxicilina 500mg",
        "dosage": "1 tableta cada 8 horas",
        "quantity": 21,
        "unit": "tabletas",
        "duration": "7 días",
        "instructions": "Administrar con alimento..."
      },
      {
        "medicationId": 2,
        "name": "Antiinflamatorio Carprofeno 50mg",
        "dosage": "1 tableta cada 12 horas",
        "quantity": 14,
        "unit": "tabletas",
        "duration": "7 días",
        "instructions": "Dar con comida..."
      },
      {
        "medicationId": 3,
        "name": "Jarabe expectorante",
        "dosage": "5ml cada 8 horas",
        "quantity": 1,
        "unit": "frasco 120ml",
        "duration": "7 días"
      }
    ],
    "pharmacyOrder": {
      "orderId": 1,
      "prescriptionId": 1,
      "clientId": 10,
      "status": "pendiente",
      "totalItems": 36,
      "medications": [
        {"name": "Amoxicilina 500mg", "quantity": 21, "unit": "tabletas"},
        {"name": "Antiinflamatorio Carprofeno 50mg", "quantity": 14, "unit": "tabletas"},
        {"name": "Jarabe expectorante", "quantity": 1, "unit": "frasco 120ml"}
      ],
      "notes": "Receta expedida por cita #5"
    }
  }
}
```

### 3. Cliente Consulta Sus Recetas

**Endpoint:** `GET /api/appointments/prescriptions/my-prescriptions`

```bash
curl http://localhost:8000/api/appointments/prescriptions/my-prescriptions \
  -H "Authorization: Bearer TU_TOKEN_CLIENTE"
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "prescriptionId": 1,
      "veterinarianId": 2,
      "observations": "Continuar tratamiento completo...",
      "createdAt": "2025-01-15T14:30:00.000Z",
      "appointment": {
        "appointmentId": 5,
        "fecha": "2025-01-15",
        "hora": "14:00:00",
        "motivo": "Control por tos persistente"
      },
      "medications": [...]
    }
  ]
}
```

### 4. Personal de Droguería Consulta Órdenes Pendientes

**Endpoint:** `GET /api/appointments/pharmacy/orders?status=pendiente`

```bash
curl "http://localhost:8000/api/appointments/pharmacy/orders?status=pendiente" \
  -H "Authorization: Bearer TU_TOKEN_RECEPCIONISTA"
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "orderId": 1,
      "prescriptionId": 1,
      "clientId": 10,
      "status": "pendiente",
      "totalItems": 36,
      "medications": [...],
      "notes": "Receta expedida por cita #5",
      "createdAt": "2025-01-15T14:30:00.000Z",
      "prescription": {
        "prescriptionId": 1,
        "observations": "Continuar tratamiento completo...",
        "medications": [...]
      }
    }
  ]
}
```

### 5. Personal Actualiza Estado a "En Preparación"

**Endpoint:** `PUT /api/appointments/pharmacy/orders/:orderId/status`

```bash
curl -X PUT http://localhost:8000/api/appointments/pharmacy/orders/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_RECEPCIONISTA" \
  -d '{
    "status": "en_preparacion",
    "notes": "Preparando medicamentos. Amoxicilina en stock, carprofeno verificado."
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Estado de orden actualizado exitosamente",
  "data": {
    "orderId": 1,
    "status": "en_preparacion",
    "notes": "Preparando medicamentos...",
    "updatedAt": "2025-01-15T14:35:00.000Z"
  }
}
```

### 6. Marcar Orden Como Lista

```bash
curl -X PUT http://localhost:8000/api/appointments/pharmacy/orders/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_RECEPCIONISTA" \
  -d '{
    "status": "lista",
    "notes": "Medicamentos listos para retirar. Total: 36 items"
  }'
```

### 7. Cliente Consulta Sus Órdenes

**Endpoint:** `GET /api/appointments/pharmacy/my-orders`

```bash
curl http://localhost:8000/api/appointments/pharmacy/my-orders \
  -H "Authorization: Bearer TU_TOKEN_CLIENTE"
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "orderId": 1,
      "status": "lista",
      "totalItems": 36,
      "notes": "Medicamentos listos para retirar...",
      "medications": [
        {"name": "Amoxicilina 500mg", "quantity": 21, "unit": "tabletas"},
        {"name": "Antiinflamatorio Carprofeno 50mg", "quantity": 14, "unit": "tabletas"},
        {"name": "Jarabe expectorante", "quantity": 1, "unit": "frasco 120ml"}
      ],
      "prescription": {
        "medications": [
          {
            "name": "Amoxicilina 500mg",
            "dosage": "1 tableta cada 8 horas",
            "instructions": "Administrar con alimento..."
          }
        ]
      }
    }
  ]
}
```

### 8. Marcar Como Entregada

```bash
curl -X PUT http://localhost:8000/api/appointments/pharmacy/orders/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_RECEPCIONISTA" \
  -d '{
    "status": "entregada",
    "notes": "Medicamentos entregados al cliente. Explicadas indicaciones."
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Estado de orden actualizado exitosamente",
  "data": {
    "orderId": 1,
    "status": "entregada",
    "deliveredAt": "2025-01-15T15:00:00.000Z",
    "notes": "Medicamentos entregados al cliente..."
  }
}
```

## Consultar Receta de una Cita Específica

```bash
curl http://localhost:8000/api/appointments/5/prescription \
  -H "Authorization: Bearer TU_TOKEN"
```

## Filtrar Órdenes por Estado

```bash
# Órdenes pendientes
curl "http://localhost:8000/api/appointments/pharmacy/orders?status=pendiente" \
  -H "Authorization: Bearer TU_TOKEN_RECEPCIONISTA"

# Órdenes listas
curl "http://localhost:8000/api/appointments/pharmacy/orders?status=lista" \
  -H "Authorization: Bearer TU_TOKEN_RECEPCIONISTA"

# Órdenes entregadas
curl "http://localhost:8000/api/appointments/pharmacy/orders?status=entregada" \
  -H "Authorization: Bearer TU_TOKEN_RECEPCIONISTA"

# Todas las órdenes
curl "http://localhost:8000/api/appointments/pharmacy/orders" \
  -H "Authorization: Bearer TU_TOKEN_RECEPCIONISTA"
```

## Casos de Error

### Intentar expedir receta sin completar atención

```bash
curl -X POST http://localhost:8000/api/appointments/5/prescription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_VETERINARIO" \
  -d '{
    "medications": [...]
  }'
```

**Response (400):**
```json
{
  "success": false,
  "message": "Debe completar el diagnóstico y procedimiento antes de expedir la receta"
}
```

### Expedir receta sin medicamentos

```bash
curl -X POST http://localhost:8000/api/appointments/5/prescription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_VETERINARIO" \
  -d '{
    "observations": "Sin medicamentos",
    "medications": []
  }'
```

**Response (400):**
```json
{
  "success": false,
  "message": "Debe incluir al menos un medicamento en la receta"
}
```

### Intentar expedir receta duplicada

```bash
# Segundo intento de expedir receta para la misma cita
curl -X POST http://localhost:8000/api/appointments/5/prescription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_VETERINARIO" \
  -d '{...}'
```

**Response (400):**
```json
{
  "success": false,
  "message": "Esta cita ya tiene una receta médica expedida"
}
```

## Notas

- Todos los endpoints requieren autenticación con JWT
- Las recetas solo pueden ser expedidas por veterinarios
- La orden de droguería se crea automáticamente al expedir la receta
- El campo `deliveredAt` se actualiza automáticamente al marcar como "entregada"
- Los estados de las órdenes siguen un flujo lógico pero pueden saltar estados si es necesario
