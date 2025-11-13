import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface VerificationEmailProps {
  supabase_url: string;
  email_action_type: string;
  redirect_to: string;
  token_hash: string;
  token: string;
  user_email: string;
}

export const VerificationEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  user_email,
}: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Verify your email to start using VeriEdit AI</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>🛡️ VeriEdit AI</Heading>
          <Text style={tagline}>Secure Your Digital Truth</Text>
        </Section>

        <Section style={content}>
          <Heading style={h2}>Welcome to VeriEdit!</Heading>
          <Text style={text}>
            Thank you for signing up with <strong>{user_email}</strong>. We're excited to have you join our community of truth seekers!
          </Text>
          
          <Text style={text}>
            Click the button below to verify your email and activate your account:
          </Text>

          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            target="_blank"
            style={button}
          >
            Verify Email Address
          </Link>

          <Text style={disclaimer}>
            Or copy and paste this verification code:
          </Text>
          <code style={code}>{token}</code>

          <Hr style={hr} />

          <Text style={benefits}>
            Once verified, you'll be able to:
          </Text>
          <ul style={list}>
            <li style={listItem}>✅ Verify claims with AI-powered fact-checking</li>
            <li style={listItem}>🏆 Earn achievements and NFT badges</li>
            <li style={listItem}>🌐 Join the Lighthouse community</li>
            <li style={listItem}>📊 Track your truth score and analytics</li>
          </ul>

          <Text style={footerText}>
            If you didn't create an account with VeriEdit, you can safely ignore this email.
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerLink}>
            Need help? Visit our{' '}
            <Link href="https://veriedit.com/about" style={link}>
              support center
            </Link>
          </Text>
          <Text style={copyright}>
            © 2025 VeriEdit AI. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default VerificationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px',
  textAlign: 'center' as const,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const tagline = {
  color: '#ffffff',
  fontSize: '14px',
  margin: '8px 0 0',
  fontWeight: '500',
};

const content = {
  padding: '0 40px',
};

const h2 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '32px 0 16px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const button = {
  backgroundColor: '#667eea',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 32px',
  margin: '24px 0',
};

const disclaimer = {
  color: '#666',
  fontSize: '14px',
  margin: '24px 0 8px',
  textAlign: 'center' as const,
};

const code = {
  display: 'block',
  padding: '16px',
  width: '100%',
  backgroundColor: '#f4f4f4',
  borderRadius: '8px',
  border: '1px solid #e1e1e1',
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  letterSpacing: '2px',
  fontFamily: 'monospace',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
};

const benefits = {
  color: '#333',
  fontSize: '16px',
  fontWeight: '600',
  margin: '24px 0 12px',
};

const list = {
  margin: '0',
  padding: '0 0 0 20px',
};

const listItem = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '28px',
  margin: '8px 0',
};

const footer = {
  padding: '20px 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#8898aa',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '32px 0 0',
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#8898aa',
  fontSize: '13px',
  margin: '8px 0',
};

const link = {
  color: '#667eea',
  textDecoration: 'underline',
};

const copyright = {
  color: '#8898aa',
  fontSize: '12px',
  margin: '8px 0 0',
};
