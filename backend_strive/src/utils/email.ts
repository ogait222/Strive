import nodemailer from "nodemailer";

const getSmtpConfig = () => {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = Number(process.env.SMTP_PORT || "587");
    const secure = process.env.SMTP_SECURE === "true";

    if (!host || !user || !pass) {
        throw new Error("SMTP config missing. Define SMTP_HOST, SMTP_USER, SMTP_PASS.");
    }

    return { host, user, pass, port, secure };
};

export const sendResetPasswordEmail = async (to: string, resetUrl: string) => {
    const { host, user, pass, port, secure } = getSmtpConfig();
    const appName = process.env.APP_NAME || "Strive";
    const fromAddress = process.env.SMTP_FROM || user;

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
    });

    const subject = `${appName} - Recuperar password`;
    const text = [
        "Recebemos um pedido para recuperar a password.",
        "Se nao foste tu, ignora este email.",
        "",
        `Link para recuperar: ${resetUrl}`,
        "",
        "Este link expira em 15 minutos.",
    ].join("\n");

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>${appName}</h2>
            <p>Recebemos um pedido para recuperar a password.</p>
            <p>Se nao foste tu, ignora este email.</p>
            <p>
                <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#111111;color:#ffffff;text-decoration:none;border-radius:6px;">
                    Recuperar password
                </a>
            </p>
            <p>Este link expira em 15 minutos.</p>
        </div>
    `;

    await transporter.sendMail({
        from: `${appName} <${fromAddress}>`,
        to,
        subject,
        text,
        html,
    });
};
