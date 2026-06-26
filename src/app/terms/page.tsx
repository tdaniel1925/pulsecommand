import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PUBLIC_PLAN, formatPrice } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Terms of Service — BundledContent",
  description: "The terms governing your use of BundledContent.",
};

// Company = Docs2Video. Product/site = BundledContent (bundledcontent.com).
// Placeholders marked [TO CONFIRM] should be filled with real legal details.
const COMPANY = "Docs2Video";
const PRODUCT = "BundledContent";
const SITE = "bundledcontent.com";
const SUPPORT_EMAIL = "support@bundledcontent.com";
const GOVERNING_LAW = "[TO CONFIRM: state/country]";
const EFFECTIVE_DATE = "[TO CONFIRM: effective date]";

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-neutral-900 mb-3">{n}. {title}</h2>
      <div className="space-y-3 text-neutral-600 leading-relaxed text-[15px]">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-600 mb-2">Legal</p>
          <h1 className="text-4xl font-bold text-neutral-900 mb-3">Terms of Service</h1>
          <p className="text-neutral-500 mb-10">Effective date: {EFFECTIVE_DATE}</p>

          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 mb-10 text-sm text-neutral-600">
            These Terms of Service (&ldquo;Terms&rdquo;) are a binding agreement between you and{" "}
            <strong>{COMPANY}</strong> (&ldquo;{COMPANY},&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;), the company that operates{" "}
            <strong>{PRODUCT}</strong>, the service available at {SITE} (the &ldquo;Service&rdquo;). By creating an account or
            using the Service, you agree to these Terms.
          </div>

          <Section n="1" title="The Service">
            <p>
              {PRODUCT} is a done-for-you social media service. After a one-time onboarding interview about your business,
              we generate social media posts and accompanying images using AI and publish them on your behalf to the social
              media accounts you connect (such as Instagram, Facebook, LinkedIn, X, and TikTok).
            </p>
            <p>
              The current plan includes {PUBLIC_PLAN.entitlements.socialPostsPerMonth} posts per month at{" "}
              {formatPrice(PUBLIC_PLAN.price)}/month. Features and limits are described on our pricing page and may change;
              material changes will be communicated to active subscribers.
            </p>
          </Section>

          <Section n="2" title="Eligibility & Accounts">
            <p>
              You must be at least 18 years old and able to enter into a binding contract. You are responsible for the
              accuracy of the information you provide, for maintaining the security of your account credentials, and for all
              activity that occurs under your account. Notify us promptly at {SUPPORT_EMAIL} of any unauthorized use.
            </p>
          </Section>

          <Section n="3" title="Connected Social Accounts">
            <p>
              To publish content for you, the Service connects to your third-party social media accounts through their
              official authorization flows (via our publishing provider). By connecting an account, you authorize us to
              create and publish posts, attach media, and retrieve basic account and post information on your behalf.
            </p>
            <p>
              You represent that you have the right to connect each account and to authorize publishing to it. You can
              disconnect your accounts at any time from your dashboard, which stops further publishing to them. Your use of
              each social platform also remains subject to that platform&apos;s own terms.
            </p>
          </Section>

          <Section n="4" title="Content & Your Responsibilities">
            <p>
              We generate content based on the information you provide. You are responsible for reviewing your connected
              accounts and for ensuring the content we publish is appropriate for your business and audience. Because posts
              are published automatically, you may turn off publishing at any time by disconnecting your accounts or
              canceling.
            </p>
            <p>You agree not to use the Service to publish content that is unlawful, infringing, deceptive, harassing, or that violates the rules of any connected platform.</p>
            <p>
              As between you and us, you own the business inputs you provide and the published content. You grant us a
              license to use those inputs and to generate, store, and publish content solely to operate the Service for you.
            </p>
          </Section>

          <Section n="5" title="Billing, Trials & Cancellation">
            <p>
              The Service is offered on a recurring subscription billed monthly at {formatPrice(PUBLIC_PLAN.price)}/month
              (plus any applicable taxes) through our payment processor, Stripe. Any free trial, if offered, converts to a
              paid subscription unless canceled before it ends.
            </p>
            <p>
              You can cancel anytime from your dashboard settings. Cancellation stops future renewals; it does not refund the
              current billing period unless required by law. We may change pricing on a going-forward basis with notice to
              active subscribers.
            </p>
          </Section>

          <Section n="6" title="Third-Party Services">
            <p>
              The Service relies on third parties including AI model providers, our social-publishing provider, and Stripe
              for payments. Their availability and policies are outside our control, and interruptions in their services may
              affect the Service. We are not responsible for the acts or omissions of third parties.
            </p>
          </Section>

          <Section n="7" title="Disclaimers">
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of any kind,
              whether express or implied, including fitness for a particular purpose and non-infringement. We do not warrant
              that the Service will be uninterrupted, error-free, or that AI-generated content will be accurate or suited to
              every context.
            </p>
          </Section>

          <Section n="8" title="Limitation of Liability">
            <p>
              To the maximum extent permitted by law, {COMPANY} will not be liable for any indirect, incidental, special,
              consequential, or punitive damages, or for lost profits or revenues. Our total liability for any claim relating
              to the Service will not exceed the amount you paid us in the three (3) months before the event giving rise to
              the claim.
            </p>
          </Section>

          <Section n="9" title="Indemnification">
            <p>
              You agree to indemnify and hold harmless {COMPANY} from claims arising out of your content, your connected
              accounts, your use of the Service, or your violation of these Terms or any third-party rights.
            </p>
          </Section>

          <Section n="10" title="Termination">
            <p>
              You may stop using the Service and cancel at any time. We may suspend or terminate your access if you violate
              these Terms or use the Service in a way that risks harm to us, other users, or third parties.
            </p>
          </Section>

          <Section n="11" title="Governing Law">
            <p>These Terms are governed by the laws of {GOVERNING_LAW}, without regard to conflict-of-laws principles.</p>
          </Section>

          <Section n="12" title="Changes to These Terms">
            <p>
              We may update these Terms from time to time. If we make material changes, we will notify you. Your continued
              use of the Service after changes take effect constitutes acceptance of the updated Terms.
            </p>
          </Section>

          <Section n="13" title="Contact">
            <p>
              Questions about these Terms? Contact us at{" "}
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
