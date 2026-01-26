import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

interface TermsConditionsProps {
  onBack: () => void;
}

export default function TermsConditions({ onBack }: TermsConditionsProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Terms and Conditions</h1>
          <p className="text-gray-600 mt-2">Last updated: January 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using PrivateConnect ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services. These terms apply to all visitors, users, and others who access or use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Eligibility</h2>
            <p className="text-gray-700 leading-relaxed">
              You must be at least 18 years of age to use this Platform. By using our services, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms. We reserve the right to request proof of age at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
            <p className="text-gray-700 leading-relaxed mb-4">When you create an account, you agree to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. User Conduct</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Post false, misleading, or fraudulent content</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Impersonate any person or entity</li>
              <li>Share personal contact information publicly</li>
              <li>Use the Platform for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Platform's operation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Profile Verification</h2>
            <p className="text-gray-700 leading-relaxed">
              All profiles on PrivateConnect are subject to admin verification. We reserve the right to approve, reject, or remove any profile at our discretion. Verified profiles have been reviewed by our team, but verification does not guarantee the accuracy of all information provided by users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Premium Subscriptions</h2>
            <p className="text-gray-700 leading-relaxed mb-4">Premium subscriptions provide access to additional features. By subscribing:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>You authorize us to charge your payment method</li>
              <li>Subscriptions automatically renew unless cancelled</li>
              <li>Refunds are subject to our refund policy</li>
              <li>Prices may change with notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Content Ownership</h2>
            <p className="text-gray-700 leading-relaxed">
              You retain ownership of content you post. By posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content on the Platform. You represent that you have the right to post any content you submit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Prohibited Content</h2>
            <p className="text-gray-700 leading-relaxed mb-4">The following content is strictly prohibited:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Content involving minors</li>
              <li>Non-consensual or exploitative content</li>
              <li>Illegal activities or services</li>
              <li>Hate speech or discrimination</li>
              <li>Spam or commercial solicitation</li>
              <li>Malware or harmful code</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may suspend or terminate your account at any time for violations of these Terms or for any reason at our sole discretion. Upon termination, your right to use the Platform will immediately cease. You may delete your account at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Disclaimer of Warranties</h2>
            <p className="text-gray-700 leading-relaxed">
              The Platform is provided "as is" without warranties of any kind. We do not guarantee that the Platform will be error-free, secure, or uninterrupted. We are not responsible for the conduct of any user or the accuracy of any user-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              To the maximum extent permitted by law, PrivateConnect shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform. Our total liability shall not exceed the amount you paid us in the past twelve months.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless PrivateConnect, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Platform or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of Sri Lanka. Any disputes arising from these Terms shall be resolved in the courts of Sri Lanka.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will provide notice of significant changes by posting the updated Terms on the Platform. Your continued use of the Platform after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about these Terms and Conditions, please contact us at:
            </p>
            <p className="text-gray-700 mt-2">
              Email: support@privateconnect.lk<br />
              Website: www.privateconnect.lk
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
