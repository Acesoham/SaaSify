import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineShieldCheck } from 'react-icons/hi';
import { usePageMeta } from '../hooks/usePageMeta';

const EFFECTIVE_DATE = 'October 19, 2026';

const Section = ({ id, title, children }) => (
  <section id={id} className="mb-10">
    <h2 className="text-xl font-bold text-[#171820] mb-3 pb-2 border-b border-[#E5E7E0]">{title}</h2>
    <div className="text-[#6B7068] text-sm leading-relaxed space-y-3">{children}</div>
  </section>
);

export default function PrivacyPolicyPage() {
  usePageMeta(
    'Privacy Policy',
    'Read SaaSify\'s Privacy Policy. Learn how we collect, use, and protect your data when you use our project management platform.',
    false
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9F5' }}>
      {/* Minimal nav */}
      <nav className="bg-white border-b border-[#E5E7E0] py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" aria-label="SaaSify home">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#171820' }}>
              <span className="font-black text-xs" style={{ color: '#C4F13B' }}>S</span>
            </div>
            <span className="font-bold text-[#171820]">SaaSify</span>
          </Link>
          <Link to="/" className="text-sm text-[#6B7068] hover:text-[#171820] transition-colors">← Back to Home</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="w-12 h-12 bg-[#EFF9D4] rounded-xl flex items-center justify-center mb-4">
            <HiOutlineShieldCheck className="w-6 h-6 text-[#171820]" />
          </div>
          <h1 className="text-3xl font-black text-[#171820] mb-2">Privacy Policy</h1>
          <p className="text-[#969A92] text-sm">
            Effective date: <strong>{EFFECTIVE_DATE}</strong> · Last updated: <strong>{EFFECTIVE_DATE}</strong>
          </p>
          <div className="mt-4 p-4 bg-[#EFF9D4] border border-[#C4F13B]/30 rounded-xl text-sm text-[#6B7068]">
            <strong className="text-[#171820]">Note for owners:</strong> This is a starting-point document based on the verified codebase. Items marked{' '}
            <span className="font-bold text-[#A96612]">[OWNER REVIEW]</span> require your input or a jurisdiction-specific legal review before publication.
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>

          <Section id="introduction" title="1. Introduction">
            <p>
              SaaSify ("we", "us", or "our") operates a multi-tenant project and task management platform accessible at this application
              (the "Service"). This Privacy Policy explains how we collect, use, store, and protect information about you when you use the Service.
            </p>
            <p>
              By registering for or using the Service, you agree to the collection and use of information in accordance with this policy.
              If you do not agree, please do not use the Service.
            </p>
            <p className="text-[#A96612] font-medium">[OWNER REVIEW] Insert the registered company name, jurisdiction, and governing law.</p>
          </Section>

          <Section id="data-collected" title="2. Information We Collect">
            <p>We collect the following categories of information, based on inspection of the verified codebase:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-[#171820]">Account information:</strong> Your name, email address, and hashed password when you register directly.
                If you sign in via Google OAuth, we receive your name and email address from Google.
              </li>
              <li>
                <strong className="text-[#171820]">Organisation / tenant data:</strong> The organisation name you provide during registration,
                and the role assigned to you within each workspace (e.g. admin, member, viewer).
              </li>
              <li>
                <strong className="text-[#171820]">Project and task content:</strong> Projects, tasks, task descriptions, priorities, statuses,
                assignees, and kanban board state that you create within the Service.
              </li>
              <li>
                <strong className="text-[#171820]">Collaboration data:</strong> Team invitations (email address of the invitee, invite tokens),
                and membership actions within workspaces.
              </li>
              <li>
                <strong className="text-[#171820]">GitHub integration data:</strong> If you connect GitHub, we store your GitHub username and an
                OAuth access token to list repositories and receive webhook events for deployments.
                We also store repository names, branch names, commit SHAs, commit messages, and deployment log lines
                (standard output and standard error from your application builds).
              </li>
              <li>
                <strong className="text-[#171820]">Session tokens:</strong> Short-lived JSON Web Tokens (JWTs) stored in your browser's
                localStorage and HTTP-only refresh token cookies to maintain your authenticated session.
              </li>
              <li>
                <strong className="text-[#171820]">Notification preferences:</strong> Your in-app notification settings, stored in your browser's
                localStorage.
              </li>
            </ul>
            <p>
              We do <strong>not</strong> knowingly collect payment card data, government-issued identification, or special-category personal data.
            </p>
          </Section>

          <Section id="how-used" title="3. How We Use Your Information">
            <p>We use collected information to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Create and manage your account and workspace memberships.</li>
              <li>Authenticate your identity and maintain secure sessions.</li>
              <li>Enable project and task creation, assignment, and tracking.</li>
              <li>Process and display team invitations.</li>
              <li>Connect to GitHub, trigger deployments, and stream build logs to you in real time.</li>
              <li>Provide real-time collaboration features via WebSocket (Socket.IO).</li>
              <li>Calculate and display analytics, team velocity, and productivity metrics.</li>
              <li>Maintain service security through rate limiting and tenant data isolation.</li>
            </ul>
            <p className="text-[#A96612] font-medium">[OWNER REVIEW] Add any email notification, marketing, or analytics use cases if applicable.</p>
          </Section>

          <Section id="storage-security" title="4. Data Storage and Security">
            <p>
              Project data is stored in a MongoDB database. GitHub OAuth tokens and environment variables you configure for deployments
              are encrypted at rest using AES-256-GCM before storage. Passwords are hashed using bcrypt and are never stored in plaintext.
            </p>
            <p>
              Authenticated API requests use short-lived JWTs (verified by the server on every request). Refresh tokens are stored
              in HTTP-only cookies to reduce exposure to cross-site scripting. The API applies rate limiting to authentication endpoints
              to reduce abuse.
            </p>
            <p>
              Tenant data is isolated at the application layer — each API request is scoped to the requesting user's authorised tenant,
              and cross-tenant access is not permitted.
            </p>
            <p className="text-[#A96612] font-medium">
              [OWNER REVIEW] Describe your hosting environment, network-layer security, backup procedures, and any relevant certifications
              (e.g. SOC 2, ISO 27001) if applicable. Do not claim certifications you do not hold.
            </p>
          </Section>

          <Section id="third-parties" title="5. Third-Party Services">
            <p>The Service integrates with the following third-party providers, based on verified codebase inspection:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-[#171820]">Google OAuth:</strong> Used for "Sign in with Google". Google may collect data per
                their own <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#3478B9] hover:underline">Privacy Policy</a>.
              </li>
              <li>
                <strong className="text-[#171820]">GitHub OAuth:</strong> Used for repository access and deployment triggers. GitHub may
                collect data per their own{' '}
                <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer" className="text-[#3478B9] hover:underline">Privacy Statement</a>.
              </li>
              <li>
                <strong className="text-[#171820]">Google Fonts:</strong> The application loads the Inter typeface from Google Fonts.
                Google's servers may log the request, including your IP address.
              </li>
            </ul>
            <p className="text-[#A96612] font-medium">[OWNER REVIEW] Disclose any additional providers (hosting, email, monitoring, analytics).</p>
          </Section>

          <Section id="cookies" title="6. Cookies and Similar Technologies">
            <p>We use the following browser storage mechanisms:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-[#171820]">HTTP-only cookies:</strong> Used to store encrypted refresh tokens. These cookies
                are not accessible to client-side JavaScript.
              </li>
              <li>
                <strong className="text-[#171820]">localStorage:</strong> Used to store your access token, user profile, and workspace
                selection for session continuity. This data is cleared on logout.
              </li>
            </ul>
            <p>We do not use advertising cookies or cross-site tracking technologies.</p>
            <p className="text-[#A96612] font-medium">[OWNER REVIEW] Review cookie consent requirements for your target jurisdictions (e.g. EU ePrivacy Directive, GDPR).</p>
          </Section>

          <Section id="retention" title="7. Data Retention">
            <p className="text-[#A96612] font-medium">
              [OWNER REVIEW] Define and document your data retention periods for account data, project data, deployment logs,
              and OAuth tokens. Specify what happens to user data following account deletion or workspace closure.
            </p>
          </Section>

          <Section id="rights" title="8. Your Rights and Choices">
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Withdraw consent where processing is based on consent.</li>
              <li>Lodge a complaint with a relevant data protection authority.</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at the address below.
            </p>
            <p className="text-[#A96612] font-medium">[OWNER REVIEW] Verify applicable rights under GDPR, CCPA, or other laws relevant to your user base and jurisdiction.</p>
          </Section>

          <Section id="children" title="9. Children's Privacy">
            <p>
              The Service is not directed to children under the age of 16. We do not knowingly collect personal data from children.
              If you believe a child has provided us with personal data, please contact us and we will take steps to remove it.
            </p>
          </Section>

          <Section id="changes" title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page.
              We encourage you to review this policy periodically.
            </p>
          </Section>

          <Section id="contact" title="11. Contact Us">
            <p className="text-[#A96612] font-medium">
              [OWNER REVIEW] Provide a contact email address and, if applicable, a postal address for privacy-related enquiries.
              If operating in the EU/UK, identify the Data Controller and Data Protection Officer (DPO) if required.
            </p>
          </Section>

          {/* Footer nav */}
          <div className="border-t border-[#E5E7E0] pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[#969A92] text-sm">© 2026 SaaSify. All rights reserved.</p>
            <div className="flex gap-5">
              <Link to="/terms" className="text-sm text-[#6B7068] hover:text-[#171820] transition-colors">Terms of Service</Link>
              <Link to="/" className="text-sm text-[#6B7068] hover:text-[#171820] transition-colors">Home</Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
