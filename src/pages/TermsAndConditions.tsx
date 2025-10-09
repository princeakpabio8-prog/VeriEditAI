import { Navigation } from "@/components/ui/navigation";
import Footer from "@/components/ui/footer";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Terms and Conditions</h1>
        
        <div className="space-y-8 text-muted-foreground">
          <section>
            <p className="text-sm mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            <p>
              Welcome to VeriEdit AI Technologies Ltd. By accessing or using our services, 
              you agree to be bound by these Terms and Conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Acceptance of Terms</h2>
            <p>
              By creating an account and using VeriEdit AI's verification services, you acknowledge 
              that you have read, understood, and agree to be bound by these Terms and Conditions. 
              If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. User Accounts and Registration</h2>
            <p className="mb-2">
              To access certain features of our platform, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Be responsible for all activities that occur under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. License to Use the Service</h2>
            <p>
              Subject to your compliance with these Terms, VeriEdit AI Technologies Ltd grants you a 
              limited, non-exclusive, non-transferable, revocable license to access and use our 
              verification services for your personal or internal business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. User Responsibilities</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the service for any illegal or unauthorized purpose</li>
              <li>Violate any laws in your jurisdiction</li>
              <li>Infringe on the intellectual property rights of others</li>
              <li>Submit false, misleading, or malicious content for verification</li>
              <li>Attempt to interfere with, compromise, or reverse engineer the service</li>
              <li>Use the service to harass, abuse, or harm others</li>
              <li>Resell or redistribute our verification services without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Verification Service Terms</h2>
            <p className="mb-2">
              Our AI-powered verification service provides analysis and trust scores based on available 
              data and algorithms. You acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Verification results are algorithmic assessments, not absolute truth</li>
              <li>Results should be used as one factor in your decision-making process</li>
              <li>VeriEdit AI does not guarantee 100% accuracy in all verifications</li>
              <li>You are responsible for your own judgment and decisions based on our results</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Billing and Payments</h2>
            <p className="mb-2">
              For paid subscription tiers and services:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fees are charged in advance on a recurring basis</li>
              <li>All fees are non-refundable except as required by law or stated in our Refund Policy</li>
              <li>You authorize us to charge your payment method for all fees</li>
              <li>Price changes will be communicated 30 days in advance</li>
              <li>Failure to pay may result in service suspension or termination</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Intellectual Property</h2>
            <p>
              All content, features, and functionality of VeriEdit AI's services, including but not 
              limited to text, graphics, logos, algorithms, and software, are the exclusive property 
              of VeriEdit AI Technologies Ltd and are protected by international copyright, trademark, 
              and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Limitation of Liability</h2>
            <p className="mb-2">
              To the maximum extent permitted by law, VeriEdit AI Technologies Ltd shall not be liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, data, use, goodwill, or other intangible losses</li>
              <li>Damages resulting from your use or inability to use the service</li>
              <li>Unauthorized access to or alteration of your transmissions or data</li>
              <li>Any third-party content or conduct on the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account and access to our services 
              at our sole discretion, without notice, for conduct that we believe violates these 
              Terms or is harmful to other users, us, or third parties, or for any other reason.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of any 
              material changes via email or through our service. Your continued use of the service 
              after such modifications constitutes your acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Nigeria, 
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">12. Contact Information</h2>
            <p className="mb-2">
              For questions about these Terms and Conditions, please contact us:
            </p>
            <div className="space-y-1">
              <p><strong>VeriEdit AI Technologies Ltd</strong></p>
              <p>Email: <a href="mailto:hello@verieditai.com" className="text-primary hover:underline">hello@verieditai.com</a></p>
              <p>Phone: <a href="tel:+2348080189816" className="text-primary hover:underline">+234 808 018 9816</a></p>
              <p>Website: <a href="https://www.verieditai.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.verieditai.com</a></p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsAndConditions;
