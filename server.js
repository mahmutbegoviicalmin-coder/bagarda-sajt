import express from 'express';
import { Resend } from 'resend';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const resend = new Resend('re_JMds8gWZ_J8DBRYSBUGY5qZ3vLxEVa9ru');

app.post('/api/order', async (req, res) => {
  const { ime, prezime, adresa, grad, telefon, velicina, proizvod, cijena, url } = req.body;

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'almin.revolux@gmail.com',
      subject: `Nova narudžba — ${proizvod} / ${velicina}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">

          <div style="background:#1a1a18;padding:20px;text-align:center;border-radius:8px;margin-bottom:24px;">
            <h1 style="color:#6B21A8;font-size:22px;margin:0;letter-spacing:4px;">BAGARDA</h1>
            <p style="color:#777;font-size:12px;margin:6px 0 0;">Nova narudžba</p>
          </div>

          <div style="border:1px solid #e8e4df;border-radius:8px;padding:20px;margin-bottom:20px;">
            <div style="font-size:11px;color:#6B21A8;font-weight:700;letter-spacing:2px;margin-bottom:12px;">PROIZVOD</div>
            <div style="font-size:17px;font-weight:700;color:#1a1a18;margin-bottom:8px;">${proizvod}</div>
            <div style="font-size:14px;color:#555;margin-bottom:4px;">Veličina: <strong>${velicina}</strong></div>
            <div style="font-size:14px;color:#555;margin-bottom:4px;">Cijena: <strong>${cijena} KM</strong> + 10,00 KM dostava</div>
            <div style="font-size:15px;font-weight:700;color:#1a1a18;margin-top:10px;padding-top:10px;border-top:1px solid #eee;">Ukupno: ${(parseFloat(cijena) + 10).toFixed(2)} KM</div>
            ${url ? `<div style="margin-top:12px;"><a href="${url}" style="font-size:13px;color:#6B21A8;font-weight:600;">→ Pogledaj stranicu proizvoda</a></div>` : ''}
          </div>

          <div style="border:1px solid #e8e4df;border-radius:8px;padding:20px;margin-bottom:20px;">
            <div style="font-size:11px;color:#6B21A8;font-weight:700;letter-spacing:2px;margin-bottom:14px;">DOSTAVA</div>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="color:#999;padding:5px 0;width:120px;">Ime i prezime</td><td style="font-weight:600;color:#1a1a18;padding:5px 0;">${ime} ${prezime}</td></tr>
              <tr><td style="color:#999;padding:5px 0;">Adresa</td><td style="font-weight:600;color:#1a1a18;padding:5px 0;">${adresa}, ${grad}</td></tr>
              <tr><td style="color:#999;padding:5px 0;">Telefon</td><td style="font-weight:600;color:#1a1a18;padding:5px 0;">${telefon}</td></tr>
            </table>
          </div>

          <div style="background:#f0f7f2;border:1px solid #c8e0d0;border-radius:8px;padding:14px;text-align:center;">
            <div style="font-size:13px;color:#4a7c59;font-weight:600;">Pozovi kupca: <a href="tel:${telefon}" style="color:#4a7c59;">${telefon}</a></div>
          </div>

        </div>
      `
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.listen(3001, () => console.log('Server pokrenut: http://localhost:3001'));
