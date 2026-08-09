import { Resend } from 'resend';
import { EmailTemplate } from '@/components/resend/email-template';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log(body);
        const name = body.payload.name;
        const username = body.payload.username;
        const { data, error } = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: ['wenbinchan2004@gmail.com'],
            subject: 'Hello world',
            react: EmailTemplate({ name: name, username: username }),
        });

        if (error) {
            console.error('Resend API Error:', error);
            return Response.json({ error }, { status: 500 });
        }

        return Response.json(data);
    } catch (error) {
        return Response.json({ error }, { status: 500 });
    }
}