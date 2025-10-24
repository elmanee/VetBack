// /home/agus/Documentos/VetHealth/VetBack/src/controllers/cliente.controller.js
const ClienteModel = require('../models/cliente.model');
const responseHandler = require('../utils/responseHandler');

const ClienteController = {
    // GET /api/clientes/validar/:correo
    validarCliente: async (req, res) => {
        const { correo } = req.params;

        try {
            const cliente = await ClienteModel.findByEmail(correo);

            if (cliente) {
                // Si el cliente existe, buscamos sus mascotas (Paso 2 del Flujo)
                const mascotas = await ClienteModel.findMascotasByClienteId(cliente.id);
                
                // RQF01 - SALIDA ESPERADA: Retorna los datos y mascotas del cliente.
                return responseHandler.success(res, {
                    existe: true,
                    cliente_id: cliente.id,
                    nombre: `${cliente.nombre} ${cliente.apellido}`,
                    telefono: cliente.telefono,
                    mascotas: mascotas
                }, 'Cliente encontrado.');
            } else {
                // RQF01 - SALIDA ESPERADA: Indica que es un cliente nuevo.
                return responseHandler.success(res, {
                    existe: false
                }, 'Cliente nuevo.');
            }
        } catch (error) {
            console.error(error);
            return responseHandler.error(res, 'Error al validar cliente.', 500);
        }
    }
};

module.exports = ClienteController;