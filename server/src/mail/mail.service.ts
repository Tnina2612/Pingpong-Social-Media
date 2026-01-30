import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: this.config.get<string>("MAIL_USER"),
        pass: this.config.get<string>("MAIL_PASS"),
      },
    });
  }

  async sendOtpMail(email: string, otp: string) {
    await this.transporter.sendMail({
      to: email,
      subject: "Verify your email",
      html: `
        <div style="max-width:420px;margin:auto;padding:24px;
        font-family:Arial;border-radius:12px;background:#fff">
          <h2 style="text-align:center">Email Verification</h2>
          <p style="text-align:center">Your OTP code</p>
          <div style="
            font-size:32px;
            letter-spacing:6px;
            text-align:center;
            font-weight:bold;
            margin:20px 0;
          ">
            ${otp}
          </div>
          <p style="text-align:center;color:#777">
            Expires in 5 minutes
          </p>
        </div>
      `,
    });
  }
}
