import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { to, subject, htmlContent } = await request.json();

    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json(
        { success: false, message: '수신자 이메일 주소가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!subject || !htmlContent) {
      return NextResponse.json(
        { success: false, message: '제목과 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"회의록 시스템" <${process.env.EMAIL_USER}>`,
      to: to.join(', '),
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: '이메일이 성공적으로 발송되었습니다.',
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('이메일 발송 에러:', error);

    let errorMessage = '이메일 발송 중 오류가 발생했습니다.';

    if (error.code === 'EAUTH') {
      errorMessage = '이메일 인증 정보가 올바르지 않습니다. Gmail 앱 비밀번호를 확인해주세요.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = '이메일 서버 연결에 실패했습니다.';
    }

    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
