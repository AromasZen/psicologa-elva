import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BASE_URL = "https://prueba123xyz.online";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record || !record.email_cliente) {
      return new Response(JSON.stringify({ message: "Sin email_cliente." }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const confirmUrl = `${BASE_URL}/confirmar-turno.html?token=${record.confirmation_token}`;

    const htmlContent = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;">
        <h2 style="color:#2C5282;">¡Hola ${record.nombre_cliente}!</h2>
        <p>Gracias por solicitar un turno. Confirmá tu asistencia:</p>
        <div style="background:#f8fafc;padding:20px;border-radius:8px;margin:20px 0;">
          <p><strong>📅 Fecha:</strong> ${record.fecha_reserva}</p>
          <p><strong>⏰ Hora:</strong> ${record.hora_reserva}</p>
          <p><strong>🧠 Servicio:</strong> ${record.servicio}</p>
          <p><strong>📍 Modalidad:</strong> ${record.modalidad}</p>
        </div>
        <div style="text-align:center;margin-top:30px;">
          <a href="${confirmUrl}" style="background:#2C5282;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">
            Confirmar mi turno
          </a>
        </div>
        <p style="margin-top:30px;font-size:12px;color:#666;text-align:center;">
          Si no solicitaste este turno, ignorá este correo.
        </p>
      </div>
    `;

    const resPaciente = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Turnos <onboarding@resend.dev>",
        to: [record.email_cliente],
        subject: "Confirmá tu turno",
        html: htmlContent,
      }),
    });

    const htmlAviso = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;">
        <h2 style="color:#2C5282;">Nuevo turno solicitado</h2>
        <p><strong>Paciente:</strong> ${record.nombre_cliente}</p>
        <p><strong>Teléfono:</strong> ${record.telefono_cliente}</p>
        <p><strong>Email:</strong> ${record.email_cliente}</p>
        <p><strong>Fecha:</strong> ${record.fecha_reserva}</p>
        <p><strong>Hora:</strong> ${record.hora_reserva}</p>
        <p><strong>Servicio:</strong> ${record.servicio}</p>
        <p><strong>Modalidad:</strong> ${record.modalidad}</p>
        <p><strong>Mensaje:</strong> ${record.mensaje || "Sin mensaje"}</p>
      </div>
    `;

    const resPsicologo = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Turnos <onboarding@resend.dev>",
        to: ["elvaschweizer@hotmail.com"],
        subject: "Nuevo turno: " + record.nombre_cliente,
        html: htmlAviso,
      }),
    });

    if (!resPaciente.ok || !resPsicologo.ok) {
      console.error("Error enviando correos");
      return new Response(JSON.stringify({ error: "Error de Resend al enviar correos" }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: "Email enviado." }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error edge function:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});