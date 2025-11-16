import { Navigation } from "@/components/ui/navigation";
import Footer from "@/components/ui/footer";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="container mx-auto px-4 py-16 max-w-4xl flex-grow">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last Updated: October 8, 2025
        </p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              At VeriedIT AI, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information when you use our website and browser extension.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">What Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Account Information</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Email address (for authentication and account recovery)</li>
                  <li>Full name and company (optional, if provided)</li>
                  <li>Referral code (if you sign up via a referral link)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Verification Data</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Content you submit for verification (text, images, URLs)</li>
                  <li>Verification results and trust scores</li>
                  <li>Sources and analysis data</li>
                  <li>Verification timestamps and history</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Usage Information</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Number of verifications performed</li>
                  <li>Feature usage (bulk operations, PDF exports, etc.)</li>
                  <li>Achievement progress</li>
                  <li>API key usage (for extension users)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Authenticate your account and provide secure access</li>
              <li>Process verification requests and deliver results</li>
              <li>Track usage for billing and license management</li>
              <li>Award achievements and referral bonuses</li>
              <li>Improve our AI models and service quality</li>
              <li>Send important service updates and security alerts</li>
              <li>Provide customer support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
            <p className="text-muted-foreground mb-4">
              We use the following third-party services to operate VeriedIT AI:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Supabase</h3>
                <p className="text-muted-foreground">
                  For secure authentication, database storage, and backend infrastructure. Supabase is GDPR compliant and uses industry-standard encryption.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">AI Providers</h3>
                <p className="text-muted-foreground">
                  We use Anthropic Claude, Perplexity AI, and Google Vision API for content verification. Content is processed securely and not used for training their models.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Payment Processors</h3>
                <p className="text-muted-foreground">
                  Flutterwave and Stripe for secure payment processing. We do not store credit card information on our servers.
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mt-4">
              <strong>We never sell your data to advertisers or third parties.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Storage & Security</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>All data transmitted over encrypted HTTPS connections</li>
              <li>Passwords hashed using industry-standard algorithms</li>
              <li>API keys stored securely with encryption</li>
              <li>Regular security audits and updates</li>
              <li>Database backups with encryption at rest</li>
              <li>Access controls and role-based permissions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your data for as long as your account is active. Verification history is stored for the lifetime of your account unless you request deletion. After account deletion, we may retain certain data for legal compliance, fraud prevention, and dispute resolution.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Export your verification history</li>
              <li><strong>Objection:</strong> Opt out of certain data processing</li>
              <li><strong>Withdraw Consent:</strong> Revoke permissions at any time</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, contact us at <a href="mailto:hello@verieditai.com" className="text-primary hover:underline">hello@verieditai.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Browser Extension Privacy</h2>
            <p className="text-muted-foreground mb-4">Our Chrome extension:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Only accesses content you explicitly choose to verify</li>
              <li>Stores API key locally in encrypted browser storage</li>
              <li>Caches verification results locally for 24 hours</li>
              <li>Does not track your browsing history</li>
              <li>Does not inject ads or tracking scripts</li>
              <li>Requests minimal permissions (activeTab, storage, contextMenus)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
            <p className="text-muted-foreground">
              We use essential cookies for authentication and session management. We do not use tracking cookies or third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
            <p className="text-muted-foreground">
              VeriedIT AI is not intended for users under 13 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">International Users</h2>
            <p className="text-muted-foreground">
              VeriedIT AI is operated from and data is stored in secure cloud infrastructure. By using our service, you consent to the transfer of your information to these locations. We comply with GDPR for European users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on our website. Continued use of VeriedIT AI after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-muted p-6 rounded-lg">
              <p className="font-medium mb-2">VeriedIT AI Support</p>
              <p className="text-muted-foreground">Email: <a href="mailto:hello@verieditai.com" className="text-primary hover:underline">hello@verieditai.com</a></p>
              <p className="text-muted-foreground">Website: <a href="https://www.verieditai.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.verieditai.com</a></p>
            </div>
          </section>

          <section className="bg-primary/5 p-6 rounded-lg border border-primary/20">
            <h2 className="text-2xl font-semibold mb-4">GDPR Compliance</h2>
            <p className="text-muted-foreground">
              VeriedIT AI is committed to GDPR compliance. We act as a data controller for your personal information. Our lawful basis for processing is your consent and our legitimate interest in providing verification services. You have the right to lodge a complaint with your local data protection authority.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
