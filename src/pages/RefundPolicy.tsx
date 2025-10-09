import { Navigation } from "@/components/ui/navigation";
import Footer from "@/components/ui/footer";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Refund Policy</h1>
        
        <div className="space-y-8 text-muted-foreground">
          <section>
            <p className="text-sm mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            <p>
              At VeriEdit AI Technologies Ltd, we strive to provide excellent service. This Refund Policy 
              outlines our policies regarding refunds for our verification services and subscriptions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Refund Eligibility</h2>
            <p className="mb-2">
              Refunds may be granted in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Failures:</strong> If our verification service experiences technical issues that prevent you from using paid features for an extended period</li>
              <li><strong>Billing Errors:</strong> If you were charged incorrectly or duplicately</li>
              <li><strong>Subscription Cancellations:</strong> Within 7 days of initial subscription purchase (first-time subscribers only)</li>
              <li><strong>Unauthorized Charges:</strong> If you can demonstrate that charges were made without your authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Non-Refundable Items</h2>
            <p className="mb-2">
              The following are generally not eligible for refunds:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscription fees after the 7-day initial period</li>
              <li>One-time verification credits that have already been used</li>
              <li>API usage fees for completed verification requests</li>
              <li>Custom enterprise solutions after implementation has begun</li>
              <li>Renewal charges if you did not cancel before the renewal date</li>
              <li>Dissatisfaction with verification results (our service provides analysis, not guarantees)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Refund Request Process</h2>
            <p className="mb-2">
              To request a refund, please follow these steps:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Contact our support team within 30 days of the charge</li>
              <li>Provide your account email, transaction ID, and reason for the refund request</li>
              <li>Include any relevant documentation or screenshots supporting your claim</li>
              <li>Our team will review your request within 5-7 business days</li>
              <li>If approved, refunds will be processed to your original payment method within 10-14 business days</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Partial Refunds</h2>
            <p>
              In certain situations, partial refunds may be granted at our discretion. This typically 
              applies to pro-rated refunds for annual subscriptions cancelled mid-term due to service 
              issues on our end.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Subscription Cancellations</h2>
            <p className="mb-2">
              You may cancel your subscription at any time:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cancellations take effect at the end of the current billing period</li>
              <li>You will retain access to paid features until the end of your billing period</li>
              <li>No refunds are provided for the remaining time in your current billing period (except within the 7-day initial period)</li>
              <li>To avoid future charges, cancel at least 24 hours before your renewal date</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Free Trial Terms</h2>
            <p>
              If we offer a free trial, you will not be charged until the trial period ends. If you 
              cancel before the trial ends, you will not be charged. Once the trial converts to a 
              paid subscription, standard refund policies apply.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Promotional Credits and Discounts</h2>
            <p>
              Promotional credits, discount codes, and special offers are non-refundable and have 
              no cash value. They cannot be combined with refund requests.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Chargebacks</h2>
            <p>
              If you file a chargeback or payment dispute with your bank or payment provider without 
              first attempting to resolve the issue with us, we reserve the right to dispute the 
              chargeback and permanently suspend your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Changes to This Policy</h2>
            <p>
              We reserve the right to modify this Refund Policy at any time. Changes will be posted 
              on this page with an updated revision date. Continued use of our services after changes 
              constitutes acceptance of the modified policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Contact Us</h2>
            <p className="mb-2">
              For refund requests or questions about this policy, please contact us:
            </p>
            <div className="space-y-1">
              <p><strong>VeriEdit AI Technologies Ltd</strong></p>
              <p>Email: <a href="mailto:hello@verieditai.com" className="text-primary hover:underline">hello@verieditai.com</a></p>
              <p>Phone: <a href="tel:+2348080189816" className="text-primary hover:underline">+234 808 018 9816</a></p>
              <p>Website: <a href="https://www.verieditai.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.verieditai.com</a></p>
            </div>
          </section>

          <section className="bg-muted/30 p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Need Help?</h3>
            <p>
              Our customer support team is here to assist you. Before requesting a refund, please 
              contact us at <a href="mailto:hello@verieditai.com" className="text-primary hover:underline">hello@verieditai.com</a> or 
              call <a href="tel:+2348080189816" className="text-primary hover:underline">+234 808 018 9816</a>. 
              We're committed to resolving any issues you may experience with our service.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RefundPolicy;
