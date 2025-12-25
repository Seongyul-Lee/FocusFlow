import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Pomobox Privacy Policy - How we collect and use your data",
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground no-underline mb-8 inline-block"
        >
          &larr; Back to Pomobox
        </Link>

        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: December 25, 2024</p>

        <h2>1. Introduction</h2>
        <p>
          Welcome to Pomobox. We respect your privacy and are committed to
          protecting your personal data. This privacy policy explains how we
          collect, use, and safeguard your information when you use our service.
        </p>

        <h2>2. Information We Collect</h2>
        <h3>2.1 Automatically Collected Information</h3>
        <p>When you use Pomobox, we may automatically collect:</p>
        <ul>
          <li>Device information (browser type, operating system)</li>
          <li>Usage data (pages visited, time spent)</li>
          <li>IP address (anonymized)</li>
        </ul>

        <h3>2.2 Cookies and Similar Technologies</h3>
        <p>
          We use cookies and similar tracking technologies to improve your
          experience. You can control cookies through your browser settings.
        </p>

        <h2>3. Third-Party Services</h2>
        <h3>3.1 Google AdSense</h3>
        <p>
          We use Google AdSense to display advertisements. Google may use cookies
          to serve ads based on your prior visits to this or other websites.
          You can opt out of personalized advertising by visiting{" "}
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Ads Settings
          </a>
          .
        </p>

        <h3>3.2 Vercel Analytics</h3>
        <p>
          We use Vercel Analytics to understand how visitors interact with our
          website. This service collects anonymous usage data to help us improve
          our service.
        </p>

        <h2>4. How We Use Your Information</h2>
        <p>We use the collected information to:</p>
        <ul>
          <li>Provide and maintain our service</li>
          <li>Improve user experience</li>
          <li>Display relevant advertisements</li>
          <li>Analyze usage patterns</li>
        </ul>

        <h2>5. Data Storage</h2>
        <p>
          Pomobox is a stateless application. We do not store your timer
          settings, session data, or statistics on our servers. All data is
          stored locally in your browser and is cleared when you close the page.
        </p>

        <h2>6. Your Rights (GDPR)</h2>
        <p>If you are in the European Economic Area, you have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Rectify inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to data processing</li>
          <li>Data portability</li>
          <li>Withdraw consent at any time</li>
        </ul>

        <h2>7. Children&apos;s Privacy</h2>
        <p>
          Our service is not directed to children under 13. We do not knowingly
          collect personal information from children under 13.
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this privacy policy from time to time. We will notify
          you of any changes by posting the new policy on this page and updating
          the &quot;Last updated&quot; date.
        </p>

        <h2>9. Contact Us</h2>
        <p>
          If you have questions about this privacy policy, please contact us at:{" "}
          <a href="mailto:privacy@pomobox.app">privacy@pomobox.app</a>
        </p>

        <div className="mt-12 pt-8 border-t">
          <Link href="/" className="text-primary hover:underline">
            &larr; Back to Pomobox
          </Link>
        </div>
      </div>
    </main>
  )
}
