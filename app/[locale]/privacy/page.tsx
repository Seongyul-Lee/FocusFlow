import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  Shield,
  Database,
  Cookie,
  Server,
  Lock,
  Scale,
  Trash2,
  Baby,
  Bell,
  Mail,
  ExternalLink,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Pomobox Privacy Policy - How we collect and use your data",
}

function SectionTitle({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-xl font-semibold text-foreground mt-10 mb-4 group">
      <span className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-5 w-5 text-primary" />
      </span>
      {children}
    </h2>
  )
}

function SubSection({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-medium text-foreground/90 mt-6 mb-3">{children}</h3>
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>
}

function List({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 ml-2">{children}</ul>
}

function OrderedList({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4 ml-2">{children}</ol>
}

function ExternalLinkStyled({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1 transition-colors"
    >
      {children}
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen text-foreground">
      {/* Dark mode gradient background */}
      <div className="fixed inset-0 -z-10 bg-background dark:bg-[#0a0a12]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.15),transparent),radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(59,130,246,0.1),transparent),radial-gradient(ellipse_50%_30%_at_0%_100%,rgba(168,85,247,0.1),transparent)]" />
      </div>

      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        {/* Back Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Pomobox
        </Link>

        {/* Main Content Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-border/50">
          {/* Header */}
          <div className="text-center mb-10 pb-8 border-b border-border/50">
            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: December 26, 2024</p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            {/* Introduction */}
            <SectionTitle icon={Shield}>1. Introduction</SectionTitle>
            <Paragraph>
              Welcome to Pomobox. We respect your privacy and are committed to
              protecting your personal data. This privacy policy explains how we
              collect, use, and safeguard your information when you use our service.
            </Paragraph>

            {/* Information We Collect */}
            <SectionTitle icon={Database}>2. Information We Collect</SectionTitle>

            <SubSection>2.1 Account Information (Registered Users)</SubSection>
            <Paragraph>When you create an account, we collect:</Paragraph>
            <List>
              <li>Email address</li>
              <li>Encrypted password (hashed, not stored in plain text)</li>
              <li>Account creation date</li>
            </List>

            <SubSection>2.2 User Activity Data (Registered Users)</SubSection>
            <Paragraph>When you use Pomobox while logged in, we collect:</Paragraph>
            <List>
              <li>Focus session records (duration, completion time)</li>
              <li>Daily statistics (date, session count, total focus minutes)</li>
              <li>Attendance check-in records</li>
              <li>Streak statistics (consecutive days)</li>
            </List>

            <SubSection>2.3 Local Storage (All Users)</SubSection>
            <Paragraph>
              For users who are not logged in, we store data locally in your browser
              using localStorage. This data includes:
            </Paragraph>
            <List>
              <li>Timer settings and preferences</li>
              <li>Session history</li>
              <li>Daily statistics</li>
              <li>Attendance records</li>
            </List>
            <Paragraph>
              This data never leaves your device and is not accessible to us. You can
              clear this data at any time through your browser settings.
            </Paragraph>

            <SubSection>2.4 Automatically Collected Information</SubSection>
            <Paragraph>When you use Pomobox, we may automatically collect:</Paragraph>
            <List>
              <li>Device information (browser type, operating system)</li>
              <li>Usage data (pages visited, time spent)</li>
              <li>IP address (anonymized)</li>
            </List>

            {/* Cookies */}
            <SectionTitle icon={Cookie}>2.5 Cookies and Similar Technologies</SectionTitle>
            <Paragraph>
              We use cookies and similar tracking technologies for authentication
              and to improve your experience. Essential cookies are required for
              the service to function properly.
            </Paragraph>

            {/* Third-Party Services */}
            <SectionTitle icon={Server}>3. Third-Party Services</SectionTitle>

            <SubSection>3.1 Supabase</SubSection>
            <Paragraph>
              We use Supabase as our database and authentication provider. Supabase
              stores your account information and activity data on secure servers.
              For more information, see{" "}
              <ExternalLinkStyled href="https://supabase.com/privacy">
                Supabase Privacy Policy
              </ExternalLinkStyled>
              .
            </Paragraph>

            <SubSection>3.2 Vercel</SubSection>
            <Paragraph>
              Our website is hosted on Vercel. Vercel may collect anonymous usage
              data and logs. For more information, see{" "}
              <ExternalLinkStyled href="https://vercel.com/legal/privacy-policy">
                Vercel Privacy Policy
              </ExternalLinkStyled>
              .
            </Paragraph>

            <SubSection>3.3 Google AdSense</SubSection>
            <Paragraph>
              We use Google AdSense to display advertisements. Google may use cookies
              to serve ads based on your prior visits to this or other websites.
              You can opt out of personalized advertising by visiting{" "}
              <ExternalLinkStyled href="https://www.google.com/settings/ads">
                Google Ads Settings
              </ExternalLinkStyled>
              .
            </Paragraph>

            {/* How We Use */}
            <SectionTitle icon={Database}>4. How We Use Your Information</SectionTitle>
            <Paragraph>We use the collected information to:</Paragraph>
            <List>
              <li>Provide and maintain our service</li>
              <li>Authenticate your account and keep you signed in</li>
              <li>Sync your focus data across devices (registered users)</li>
              <li>Display your productivity statistics</li>
              <li>Improve user experience</li>
              <li>Display relevant advertisements</li>
              <li>Analyze usage patterns</li>
            </List>

            {/* Data Storage */}
            <SectionTitle icon={Server}>5. Data Storage and Retention</SectionTitle>

            <SubSection>5.1 Registered Users</SubSection>
            <Paragraph>
              Your account and activity data is stored on Supabase servers. We retain
              your data for as long as your account is active. If you delete your
              account, your data will be permanently deleted within 30 days.
            </Paragraph>

            <SubSection>5.2 Non-Registered Users</SubSection>
            <Paragraph>
              If you use Pomobox without an account, all your data is stored locally
              in your browser (localStorage). This data is not transmitted to our
              servers and remains on your device until you clear your browser data.
            </Paragraph>

            {/* Data Security */}
            <SectionTitle icon={Lock}>6. Data Security</SectionTitle>
            <Paragraph>We implement appropriate security measures to protect your data:</Paragraph>
            <List>
              <li>All data is transmitted over HTTPS (encrypted connection)</li>
              <li>Passwords are hashed using industry-standard algorithms</li>
              <li>Database access is protected by Row Level Security (RLS) policies</li>
              <li>We regularly review and update our security practices</li>
            </List>

            {/* GDPR */}
            <SectionTitle icon={Scale}>7. Your Rights (GDPR)</SectionTitle>
            <Paragraph>If you are in the European Economic Area, you have the right to:</Paragraph>
            <List>
              <li>Access your personal data</li>
              <li>Rectify inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to data processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </List>

            {/* CCPA */}
            <SectionTitle icon={Scale}>8. Your Rights (CCPA)</SectionTitle>
            <Paragraph>If you are a California resident, you have the right to:</Paragraph>
            <List>
              <li>Know what personal information is collected</li>
              <li>Know whether your personal information is sold or disclosed</li>
              <li>Say no to the sale of personal information (we do not sell your data)</li>
              <li>Request deletion of your personal information</li>
              <li>Not be discriminated against for exercising your privacy rights</li>
            </List>

            {/* Delete Data */}
            <SectionTitle icon={Trash2}>9. How to Delete Your Data</SectionTitle>

            <SubSection>9.1 Registered Users</SubSection>
            <Paragraph>
              To delete your account and all associated data, please contact us at{" "}
              <a href="mailto:pomoboxapp@gmail.com" className="text-primary hover:underline">
                pomoboxapp@gmail.com
              </a>{" "}
              with your account email address. We will process your request within 30 days.
            </Paragraph>

            <SubSection>9.2 Non-Registered Users</SubSection>
            <Paragraph>To delete your local data:</Paragraph>
            <OrderedList>
              <li>Open your browser settings</li>
              <li>Navigate to Privacy or Site Settings</li>
              <li>Find and clear site data for pomobox.app</li>
            </OrderedList>
            <Paragraph>
              Alternatively, you can clear all browsing data or use your browser&apos;s
              developer tools to clear localStorage.
            </Paragraph>

            {/* Children */}
            <SectionTitle icon={Baby}>10. Children&apos;s Privacy</SectionTitle>
            <Paragraph>
              Our service is not directed to children under 13. We do not knowingly
              collect personal information from children under 13. If you are a parent
              or guardian and believe your child has provided us with personal
              information, please contact us.
            </Paragraph>

            {/* Changes */}
            <SectionTitle icon={Bell}>11. Changes to This Policy</SectionTitle>
            <Paragraph>
              We may update this privacy policy from time to time. We will notify
              you of any changes by posting the new policy on this page and updating
              the &quot;Last updated&quot; date.
            </Paragraph>

            {/* Contact */}
            <SectionTitle icon={Mail}>12. Contact Us</SectionTitle>
            <Paragraph>
              If you have questions about this privacy policy or want to exercise
              your data rights, please contact us at:{" "}
              <a href="mailto:pomoboxapp@gmail.com" className="text-primary hover:underline">
                pomoboxapp@gmail.com
              </a>
            </Paragraph>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border/50">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Pomobox
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
