import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — BundledContent",
  description: "How BundledContent collects, uses, and protects your information.",
};

// Company = Docs2Video. Product/site = BundledContent (bundledcontent.com).
// Placeholders marked [TO CONFIRM] should be filled with real legal details.
const COMPANY = "Docs2Video";
const PRODUCT = "BundledContent";
const SITE = "bundledcontent.com";
const SUPPORT_EMAIL = "support@bundledcontent.com";
const PRIVACY_EMAIL = "privacy@bundledcontent.com";
const EFFECTIVE_DATE = "[TO CONFIRM: effective date]";

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-neutral-900 mb-3">{n}. {title}</h2>
      <div className="space-y-3 text-neutral-600 leading-relaxed text-[15px]">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-600 mb-2">Legal</p>
          <h1 className="text-4xl font-bold text-neutral-900 mb-3">Privacy Policy</h1>
          <p className="text-neutral-500 mb-10">Effective date: {EFFECTIVE_DATE}</p>

          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 mb-10 text-sm text-neutral-600">
            This Privacy Policy explains how <strong>{COMPANY}</strong> (&ldquo;{COMPANY},&rdquo; &ldquo;we,&rdquo;
            &ldquo;us&rdquo;), the company that operates <strong>{PRODUCT}</strong> at {SITE} (the &ldquo;Service&rdquo;),
            collects, uses, and shares information about you. By using the Service, you agree to this Policy.
          </div>

          <Section n="1" title="Information We Collect">
            <p><strong>Account information.</strong> Your name, email, business name, phone (optional), and password when you create an account.</p>
            <p><strong>Business inputs.</strong> The information you give us during onboarding — about your business, voice, audience, and offers — which we use to generate your content.</p>
            <p>
              <strong>Connected social accounts.</strong> When you connect a social media account, we receive authorization
              tokens and basic account information (such as account name and identifiers) from that platform through its
              official authorization flow, so we can publish on your behalf. We do not see or store your social media
              passwords.
            </p>
            <p><strong>Payment information.</strong> Subscription billing is handled by Stripe. We do not store your full card number; Stripe processes payments and provides us limited information such as your subscription status and customer identifier.</p>
            <p><strong>Usage and device data.</strong> Standard log and analytics data (such as IP address, browser type, and pages viewed) collected when you use the Service.</p>
          </Section>

          <Section n="2" title="How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide the Service — generate posts and images and publish them to your connected accounts.</li>
              <li>To process payments and manage your subscription.</li>
              <li>To communicate with you about your account, content, and service updates.</li>
              <li>To operate, secure, debug, and improve the Service.</li>
              <li>To comply with legal obligations and enforce our Terms.</li>
            </ul>
          </Section>

          <Section n="3" title="AI Processing">
            <p>
              We use third-party AI providers to generate your posts and images from the inputs you provide. Inputs are sent
              to these providers solely to produce your content. We do not sell your business inputs, and we configure our
              integrations to use your data for generating your content rather than for training third-party models where
              that option is available. [TO CONFIRM: name specific AI providers if you wish to disclose them.]
            </p>
          </Section>

          <Section n="4" title="How We Share Information">
            <p>We share information only as needed to run the Service:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Social platforms</strong> you connect — to publish your content.</li>
              <li><strong>Service providers</strong> — our social-publishing provider, AI providers, payment processor (Stripe), hosting, and analytics, who process data on our behalf.</li>
              <li><strong>Legal</strong> — where required by law or to protect rights, safety, and the integrity of the Service.</li>
              <li><strong>Business transfers</strong> — in connection with a merger, acquisition, or sale of assets.</li>
            </ul>
            <p>We do not sell your personal information.</p>
          </Section>

          <Section n="5" title="Data Retention">
            <p>
              We retain your information for as long as your account is active and as needed to provide the Service. After
              you cancel and request deletion, we delete or anonymize your personal information within a reasonable period,
              except where we must retain it to comply with legal, tax, or accounting obligations.
            </p>
          </Section>

          <Section n="6" title="Security">
            <p>
              We use reasonable technical and organizational measures to protect your information, including encryption in
              transit and access controls. No method of transmission or storage is completely secure, so we cannot guarantee
              absolute security.
            </p>
          </Section>

          <Section n="7" title="Your Rights & Choices">
            <p>
              Depending on where you live, you may have rights to access, correct, delete, or port your personal information,
              or to object to or restrict certain processing. You can update account details in your dashboard, disconnect
              social accounts at any time, and cancel your subscription. To exercise other rights, contact us at{" "}
              <a href={`mailto:${PRIVACY_EMAIL}`} className="text-primary-600 hover:underline">{PRIVACY_EMAIL}</a>.
            </p>
          </Section>

          <Section n="8" title="Children's Privacy">
            <p>The Service is not directed to children under 18, and we do not knowingly collect personal information from children.</p>
          </Section>

          <Section n="9" title="International Users">
            <p>
              We operate from [TO CONFIRM: country]. If you use the Service from another country, your information may be
              transferred to and processed in countries with different data-protection laws than your own.
            </p>
          </Section>

          <Section n="10" title="Changes to This Policy">
            <p>We may update this Policy from time to time. If we make material changes, we will notify you. The &ldquo;effective date&rdquo; above shows when this Policy was last revised.</p>
          </Section>

          <Section n="11" title="Contact">
            <p>
              Questions about your privacy? Contact us at{" "}
              <a href={`mailto:${PRIVACY_EMAIL}`} className="text-primary-600 hover:underline">{PRIVACY_EMAIL}</a>{" "}
              or{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary-600 hover:underline">{SUPPORT_EMAIL}</a>.
              <br />
              {COMPANY} — mailing address: [TO CONFIRM: company mailing address].
            </p>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  );
}
