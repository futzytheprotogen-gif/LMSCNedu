This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Master Admin

Provision the first Master Admin from server-side environment variables. Never
commit the password:

```env
MASTER_ADMIN_EMAIL=owner@example.com
MASTER_ADMIN_NAME=CN Edu Master Admin
MASTER_ADMIN_PASSWORD=use-a-unique-password-at-least-12-characters
```

Apply the database migration, then provision the account using the dedicated
command:

```bash
npx prisma migrate deploy
npm run provision:master-admin
```

This command creates a Master Admin or rotates the password of an existing
Master Admin with the same email. It refuses to take over an email already
assigned to another admin, teacher, or student. It does not run the school demo
seed or reset existing school accounts. The Master Admin can access the Admin
portal, manage administrator accounts, review security events, and temporarily
put the site into maintenance mode. Maintenance mode blocks other roles without
deleting accounts or learning data and can be reversed from the Master Admin
dashboard.

## Password recovery email

Teacher and student recovery requests send a one-time code to the email address
stored on the account after the submitted NIK/NIS, email, and date of birth
match. Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in the server
environment. The sender address must belong to a domain verified in Resend;
Resend's `onboarding@resend.dev` sender is limited to testing and cannot deliver
to arbitrary school email addresses. Keep these values private and out of source
control.

If the email provider is unavailable or rejects delivery, the verified request
stays in Admin > Laporan. An admin can retry email delivery or create a manual
six-digit OTP and relay it privately to the account owner. OTP codes expire
after 10 minutes.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
