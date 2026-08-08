import { Resend } from 'resend';
import { EmailTemplate } from '@/components/resend/email-template';

const resend = new Resend(process.env.RESEND_API_KEY);

function formatPassword(password: string): string {
    // Format the password to *** blind all characters except the first and last character
    const firstChar = password.charAt(0);
    const lastChar = password.charAt(password.length - 1);
    const maskedChars = '*'.repeat(password.length - 2);
    return `${firstChar}${maskedChars}${lastChar}`;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log(body);
        const name = body.payload.name;
        const username = body.payload.username;
        const password = body.payload.password;
        const formattedPassword = formatPassword(password);
        const { data, error } = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: ['wenbinchan2004@gmail.com'],
            subject: 'Hello world',
            react: EmailTemplate({ name: name, username: username, password: formattedPassword }),
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