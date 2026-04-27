/**
 * EmailService.gs — envío del email final de onboarding al terminar setupAll().
 *
 * ESTADO 2026-04-22 — ADDON FUTURO OPCIONAL (NO WIREADO)
 *
 * Este archivo se escribió durante el arranque de Fase 3b asumiendo que el email
 * era entregable principal del onboarding (según plan v9). Research técnico +
 * cazada de Fito (`emergentes.md` entrada "scope creep PDF + email cortado
 * radicalmente" del 2026-04-22) cortaron el scope:
 *   - Los 2 URLs del panel se entregan en una pestaña "Tu Panel" del Sheet
 *     (sub-módulo 3b.1, reemplaza el email).
 *   - El PDF de 2 páginas se descartó entero (scope creep KITCHEN SINK).
 *   - El deploy programático NO EXISTE API, la directora hace deploy manual
 *     una vez (sub-módulo 3b.2 reemplazado por landing /ayuda módulo 0).
 *
 * Este archivo queda vivo en disco sin invocarse desde ningún lado — decisión
 * explícita de Fito: *"queda ahi por si el futuro queremos implementarlo como
 * un addon"*. Posible wiring futuro: botón "Reenviarme los links por email"
 * en Panel Directora que llama `EmailService.sendFinalOnboardingEmail` on-demand.
 *
 * El skeleton es funcional y autocontenido: si se enchufa, envía con los 2
 * URLs + opcional PDF (que tampoco existe hoy, pero el parámetro pdfBlob
 * acepta null).
 *
 * Fuera de scope original (mantiene válido si se retoma):
 *
 * API:
 *   EmailService.sendFinalOnboardingEmail({
 *     to:        'directora@gmail.com',
 *     cfg:       { schoolName, year, location, directorName },
 *     urls:      { adminUrl, teacherUrl },
 *     pdfBlob:   Blob | null     // opcional
 *   })
 *   → { sent: boolean, skipped?: string, error?: string }
 */

const EmailService = {

  sendFinalOnboardingEmail(payload) {
    payload = payload || {};
    const to = payload.to;
    const cfg = payload.cfg || {};
    const urls = payload.urls || {};
    const pdfBlob = payload.pdfBlob || null;

    if (!to) {
      if (typeof SetupLog !== 'undefined' && SetupLog.warn) {
        SetupLog.warn('EmailService.sendFinalOnboardingEmail: sin destino, email no enviado', { cfg: cfg });
      }
      return { sent: false, skipped: 'no destination email' };
    }

    const subject = '[DAI] Tu escuela está lista — ' + (cfg.schoolName || 'Escuela');
    const htmlBody = _buildHtmlBody(cfg, urls);
    const plainBody = _buildPlainBody(cfg, urls);

    const options = {
      htmlBody: htmlBody,
      name: 'Sistema DAI'
    };
    if (pdfBlob) {
      options.attachments = [pdfBlob];
    }

    try {
      MailApp.sendEmail(to, subject, plainBody, options);
      if (typeof SetupLog !== 'undefined' && SetupLog.info) {
        SetupLog.info('EmailService: email enviado', {
          to: to,
          subject: subject,
          hasPdf: !!pdfBlob
        });
      }
      return { sent: true };
    } catch (err) {
      if (typeof SetupLog !== 'undefined' && SetupLog.error) {
        SetupLog.error('EmailService: fallo envío', { to: to, err: err && err.message });
      }
      return { sent: false, error: (err && err.message) || String(err) };
    }
  }
};

function _buildHtmlBody(cfg, urls) {
  const schoolName = _escapeHtml(cfg.schoolName || 'tu escuela');
  const directorName = _escapeHtml(cfg.directorName || 'Directora');
  const adminUrl = urls.adminUrl || '#';
  const teacherUrl = urls.teacherUrl || '#';

  return (
    '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:16px;line-height:1.5;color:#1a1a1a;max-width:600px;">' +
      '<h2 style="color:#2b4a6f;margin:0 0 16px;">Tu escuela está lista</h2>' +
      '<p>Hola <strong>' + directorName + '</strong>,</p>' +
      '<p>El sistema DAI de <strong>' + schoolName + '</strong> se configuró correctamente. Abajo tenés los 2 links que vas a usar.</p>' +

      '<div style="background:#f5f5f7;border-radius:10px;padding:16px;margin:20px 0;">' +
        '<p style="margin:0 0 8px;"><strong>1. Tu Panel Directora</strong> (solo vos)</p>' +
        '<p style="margin:0 0 8px;"><a href="' + adminUrl + '" style="color:#2b4a6f;">' + adminUrl + '</a></p>' +
        '<p style="margin:0;font-size:14px;color:#666;">Guardá este link. Desde acá ves el estado del sistema, cambiás configuración y regenerás si hace falta.</p>' +
      '</div>' +

      '<div style="background:#f5f5f7;border-radius:10px;padding:16px;margin:20px 0;">' +
        '<p style="margin:0 0 8px;"><strong>2. Panel para las maestras</strong> (compartí por WhatsApp)</p>' +
        '<p style="margin:0 0 8px;"><a href="' + teacherUrl + '" style="color:#2b4a6f;">' + teacherUrl + '</a></p>' +
        '<p style="margin:0;font-size:14px;color:#666;">Copiá este link al grupo de docentes. Desde el celular acceden a los 11 formularios.</p>' +
      '</div>' +

      '<p style="margin-top:24px;">Si el sistema te adjuntó un <strong>PDF de 2 páginas</strong>, imprimí la página 2 y pegala en la sala de maestras — tiene el QR del Panel Docentes listo para escanear.</p>' +

      '<hr style="border:none;border-top:1px solid #e0e0e4;margin:24px 0;">' +
      '<p style="font-size:14px;color:#888;">¿Algo no anda? Visitá <a href="https://proyectodai.com/ayuda" style="color:#2b4a6f;">proyectodai.com/ayuda</a></p>' +
      '<p style="font-size:13px;color:#aaa;margin-top:16px;">Sistema DAI · proyectodai.com</p>' +
    '</div>'
  );
}

function _buildPlainBody(cfg, urls) {
  const schoolName = cfg.schoolName || 'tu escuela';
  const directorName = cfg.directorName || 'Directora';
  const adminUrl = urls.adminUrl || '(pendiente)';
  const teacherUrl = urls.teacherUrl || '(pendiente)';

  return [
    'Hola ' + directorName + ',',
    '',
    'El sistema DAI de ' + schoolName + ' se configuró correctamente.',
    '',
    '1. Tu Panel Directora (solo vos):',
    adminUrl,
    'Guardá este link. Desde acá ves el estado del sistema y regenerás si hace falta.',
    '',
    '2. Panel para las maestras (compartí por WhatsApp):',
    teacherUrl,
    'Copiá este link al grupo de docentes.',
    '',
    'Si el sistema te adjuntó un PDF de 2 páginas, imprimí la página 2 y pegala en la sala de maestras.',
    '',
    '¿Algo no anda? Visitá https://proyectodai.com/ayuda',
    '',
    'Sistema DAI'
  ].join('\n');
}

function _escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
