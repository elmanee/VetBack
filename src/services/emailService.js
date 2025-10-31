// /home/agus/Documentos/VetHealth/VetBack/src/services/emailService.js

const nodemailer = require('nodemailer');
require('dotenv').config();

// Configurar el transportador de Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verificar la conexión al iniciar
transporter.verify((error, success) => {
    if (error) {
        console.error('[EMAIL SERVICE] Error al conectar con Gmail:', error);
    } else {
        console.log('[EMAIL SERVICE] Servicio de correo listo para enviar mensajes');
    }
});

/**
 * NUEVO (Paso 1) - Enviar correo de REGISTRO INMEDIATO
 * Un correo simple que solo notifica que la cita fue agendada.
 */
const enviarNotificacionRegistro = async (cita, clienteCorreo, clienteNombre) => {
    console.log(`[EMAIL SERVICE] Enviando notificación de REGISTRO de cita ID: ${cita.id_cita} a ${clienteCorreo}`);
    
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: clienteCorreo,
        subject: `Tu cita ha sido registrada - Veterinaria "El Morralito"`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #ffc107; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; color: #333;">Veterinaria "El Morralito"</h1>
                        <p style="margin: 5px 0 0 0;">Cuidamos de tu mascota</p>
                    </div>
                    <div class="content">
                        <h2>¡Hola ${clienteNombre}!</h2>
                        <p>Hemos recibido y **registrado** tu solicitud de cita en nuestro sistema.</p>
                        
                        <div class="info-box">
                            <h3 style="margin-top: 0;">Detalles de tu cita:</h3>
                            <p><strong>Fecha:</strong> ${cita.fecha_cita}</p>
                            <p><strong>Hora:</strong> ${cita.hora_cita}</p>
                            <p><strong>Motivo:</strong> ${cita.motivo}</p>
                        </div>
                        
                        <p>
                            Pronto recibirás un correo (24 horas antes de tu cita) para que puedas **confirmar tu asistencia**.
                        </p>
                        <p>¡Gracias por tu confianza!</p>
                        
                    </div>
                    <div class="footer">
                        <p>Veterinaria "El Morralito" | Sistema de Gestión Veterinaria</p>
                        <p>Este es un correo automático, por favor no responder.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SERVICE] Correo de registro enviado: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[EMAIL SERVICE] ❌ Error al enviar correo de registro:', error);
        return { success: false, error: error.message };
    }
};


/**
 * RQF01 (Paso 2) - Enviar correo de PENDIENTE DE CONFIRMACIÓN (Recordatorio 24h)
 * Se le pasa el token para que el cliente confirme la cita.
 */
const enviarConfirmacionCita = async (cita, clienteCorreo, clienteNombre) => {
    console.log(`[EMAIL SERVICE] Enviando solicitud de CONFIRMACIÓN de cita ID: ${cita.id_cita} a ${clienteCorreo}`);
    
    // URL de confirmación que apunta al nuevo endpoint del controlador
    const CONFIRMATION_URL = `http://localhost:3000/api/citas/confirmar/${cita.token_confirmacion}`;
    
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: clienteCorreo,
        subject: `¡ACCIÓN REQUERIDA! Confirma tu Cita - Veterinaria "El Morralito"`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #ffc107; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107; }
                    
                    /* ===== DISEÑO DE BOTÓN ACTUALIZADO ===== */
                    .button-confirm { 
                        display: inline-block; 
                        padding: 12px 30px; 
                        background-color: #e9ecef; /* Gris claro */
                        color: #212529; /* Texto oscuro para gris claro */
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        margin: 20px 0;
                        border: 1px solid #ced4da; /* Borde sutil */
                    }
                    .button-confirm:hover {
                        background-color: #dee2e6; /* Gris un poco más oscuro al pasar el mouse */
                    }
                    /* ======================================= */

                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                    .alert { color: #dc3545; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; color: #333;">Veterinaria "El Morralito"</h1>
                        <p style="margin: 5px 0 0 0;">Tu clínica veterinaria de confianza</p>
                    </div>
                    <div class="content">
                        <h2>¡Hola ${clienteNombre}!</h2>
                        <p>Tu cita está **POR CONFIRMAR**. Por favor, haz clic en el siguiente botón para confirmar tu asistencia.</p>
                        
                        <div class="info-box">
                            <h3 style="margin-top: 0;">Detalles de tu cita:</h3>
                            <p><strong>Fecha:</strong> ${cita.fecha_cita}</p>
                            <p><strong>Hora:</strong> ${cita.hora_cita}</p>
                            <p><strong>Motivo:</strong> ${cita.motivo}</p>
                            <p><strong>Estado:</strong> <span class="alert">PENDIENTE DE CONFIRMACIÓN</span></p>
                        </div>
                        
                        <center>
                            <a href="${CONFIRMATION_URL}" class="button-confirm">
                                CONFIRMAR MI CITA AHORA
                            </a>
                        </center>
                        
                        <p class="alert">
                            **IMPORTANTE:** Si no confirmas tu cita, el horario será liberado automáticamente.
                        </p>
                        
                    </div>
                    <div class="footer">
                        <p>Veterinaria "El Morralito" | Sistema de Gestión Veterinaria</p>
                        <p>Este es un correo automático, por favor no responder.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SERVICE] Correo de confirmación enviado: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[EMAIL SERVICE] ❌ Error al enviar correo de confirmación:', error);
        return { success: false, error: error.message };
    }
};

/**
 * RQF01 - Enviar notificación de reprogramación
 */
const enviarNotificacionReprogramacion = async (cita, clienteCorreo, clienteNombre) => {
    console.log(`[EMAIL SERVICE] Enviando notificación de reprogramación a ${clienteCorreo}`);
    
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: clienteCorreo,
        subject: `Cita Reprogramada - Veterinaria "El Morralito"`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #ffc107; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; color: #333;">Veterinaria "El Morralito"</h1>
                    </div>
                    <div class="content">
                        <h2>¡Hola ${clienteNombre}!</h2>
                        <p>Tu cita ha sido <strong>reprogramada</strong>.</p>
                        
                        <div class="info-box">
                            <h3 style="margin-top: 0;">Nueva fecha y hora:</h3>
                            <p><strong>Fecha:</strong> ${cita.fecha_cita}</p>
                            <p><strong>Hora:</strong> ${cita.hora_cita}</p>
                            <p><strong>Motivo:</strong> ${cita.motivo}</p>
                        </div>
                        
                        <p>Nos vemos pronto</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SERVICE] Correo de reprogramación enviado: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[EMAIL SERVICE] Error al enviar correo:', error);
        return { success: false, error: error.message };
    }
};

/**
 * RQF01 - Enviar notificación de cancelación
 */
const enviarNotificacionCancelacion = async (cita, clienteCorreo, clienteNombre) => {
    console.log(`[EMAIL SERVICE] Enviando notificación de cancelación a ${clienteCorreo}`);
    
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: clienteCorreo,
        subject: `Cita Cancelada - Veterinaria "El Morralito"`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #dc3545; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; color: white; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc3545; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0;">Veterinaria "El Morralito"</h1>
                    </div>
                    <div class="content">
                        <h2>¡Hola ${clienteNombre}!</h2>
                        <p>Lamentamos informarte que tu cita ha sido <strong>cancelada</strong>.</p>
                        
                        <div class="info-box">
                            <h3 style="margin-top: 0;">Detalles de la cita cancelada:</h3>
                            <p><strong>Fecha:</strong> ${cita.fecha_cita}</p>
                            <p><strong>Hora:</strong> ${cita.hora_cita}</p>
                            <p><strong>Motivo:</strong> ${cita.motivo}</p>
                        </div>
                        
                        <p>Si deseas agendar una nueva cita, por favor contáctanos.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SERVICE] Correo de cancelación enviado: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[EMAIL SERVICE] Error al enviar correo:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    enviarNotificacionRegistro,
    enviarConfirmacionCita,
    enviarNotificacionReprogramacion,
    enviarNotificacionCancelacion
};