import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineDocumentText } from 'react-icons/hi';
import { usePageMeta } from '../hooks/usePageMeta';

const EFFECTIVE_DATE = 'October 19, 2026';

const Section = ({ id, title, children }) => (
  <section id={id} className="mb-10">
    <h2 className="text-xl font-bold text-[#171820] mb-3 pb-2 border-b border-[#E5E7E0]">{title}</h2>
    <div className="text-[#6B7068] text-sm leading-relaxed space-y-3">{children}</div>
  </section>
);

export default function TermsPage() {
  usePageMeta(
    'Terms of Service',
    'Read SaaSify\'s Terms of Service. Understand the rules and guidelines for using our project management platform.',
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
            <HiOutlineDocumentText className="w-6 h-6 text-[#171820]" />
          </div>
          <h1 className="text-3xl font-black text-[#171820] mb-2">Terms of Service</h1>
          <p className="text-[#969A92] text-sm">
            Effective date: <strong>{EFFECTIVE_DATE}</strong> · Last updated: <strong>{EFFECTIVE_DATE}</strong>
          </p>
          <div className="mt-4 p-4 bg-[#EFF9D4] border border-[#C4F13B]/30 rounded-xl text-sm text-[#6B7068]">
            <strong className="text-[#171820]">Note for owners:</strong> This is a starting-point document based on the verified features
            of SaaSify. Items marked{' '}
            <span className="font-bold text-[#A96612]">[OWNER REVIEW]</span> require your input or a jurisdiction-specific legal review
            before publication. This document is not a substitute for professional legal advice.
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>

          <Section id="introduction" title="1. Introduction and Acceptance">
            <p>
              These Terms of Service ("Terms") govern your access to and use of the SaaSify project and task management platform
              (the "Service"). By creating an account or using the Service, you agree to be bound by these Terms.
            </p>
            <p>
              If you are using the Service on behalf of an organisation, you represent that you have the authority to bind that
              organisation to these Terms.
            </p>
            <p className="text-[#A96612] font-medium">[OWNER REVIEW] Insert legal entity name, registered address, and governing jurisdiction.</p>
          </Section>

          <Section id="accounts" title="2. Account Registration and Security">
            <p>
              To use the Service, you must register an account with a valid email address and password, or authenticate via a supported
              OAuth provider (currently Google). You are responsible for maintaining the confidentiality of your credentials and for all
              activity that occurs under your account.
            </p>
            <p>
              You must provide accurate information during registration and keep it up to date. You may not share your account with
              third parties or create accounts through automated means.
            </p>
            <p>
              If you suspect unauthorised access to your account, you should notify us immediately and change your password.
            </p>
          </Section>

          <Section id="acceptable-use" title="3. Acceptable Use">
            <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You must not:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Upload, post, or transmit content that is unlawful, harmful, threatening, defamatory, or infringing.</li>
              <li>Attempt to gain unauthorised access to another user's account, workspace, or any system or network related to the Service.</li>
              <li>Use the Service to send spam, conduct phishing attacks, or distribute malware.</li>
              <li>Circumvent, disable, or otherwise interfere with security features or access controls of the Service.</li>
              <li>Use automated scripts or bots to access the Service in a manner that exceeds reasonable personal use.</li>
              <li>Reverse-engineer, decompile, or attempt to extract the source code of the Service.</li>
              <li>Resell, sublicence, or make the Service commercially available to third parties without authorisation.</li>
            </ul>
          </Section>

          <Section id="workspaces" title="4. Workspaces, Projects, and Tasks">
            <p>
              The Service supports multi-tenant workspaces. When you register, an organisation workspace ("tenant") is created for you.
              You may invite other users to join your workspace with assigned roles (admin, member, viewer).
            </p>
            <p>
              You are responsible for all content created within your workspace, including projects, tasks, and deployment configurations.
              Workspace administrators are responsible for managing member access and permissions.
            </p>
            <p>
              Data within each workspace is logically isolated. Users can only access workspaces they have been explicitly added to.
            </p>
          </Section>

          <Section id="github-integration" title="5. GitHub Integration">
            <p>
              The Service offers optional integration with GitHub for CI/CD deployments. By connecting your GitHub account, you
              authorise the Service to access your repositories, receive webhook events, and trigger build and deployment processes
              on your behalf.
            </p>
            <p>
              You remain responsible for the content and security of all connected repositories. The Service stores an OAuth token
              on your behalf; you can revoke this access at any time from within the Service or directly from your GitHub account settings.
            </p>
            <p>
              Environment variables you configure for deployments are encrypted before storage, but you are responsible for not
              including credentials that would cause harm if inadvertently exposed.
            </p>
          </Section>

          <Section id="ip" title="6. Intellectual Property">
            <p>
              <strong className="text-[#171820]">Your content:</strong> You retain ownership of all content you create within the Service,
              including project data, task descriptions, and deployment configurations. By using the Service, you grant us a limited,
              non-exclusive licence to store and process your content solely to provide the Service to you.
            </p>
            <p>
              <strong className="text-[#171820]">Our intellectual property:</strong> The Service, including its software, design, and
              trademarks, is owned by us or our licensors. Nothing in these Terms transfers ownership of our intellectual property to you.
            </p>
          </Section>

          <Section id="availability" title="7. Service Availability">
            <p>
              We aim to provide a reliable Service but do not guarantee uninterrupted availability. We may modify, suspend, or discontinue
              the Service (or any part of it) at any time, with or without notice.
            </p>
            <p>
              Scheduled maintenance may cause temporary interruptions. Where reasonably practicable, we will endeavour to provide advance
              notice of planned maintenance.
            </p>
            <p className="text-[#A96612] font-medium">[OWNER REVIEW] Add an uptime SLA if applicable to your service tiers.</p>
          </Section>

          <Section id="termination" title="8. Suspension and Termination">
            <p>
              We reserve the right to suspend or terminate your account, with or without notice, if you violate these Terms, engage in
              fraudulent activity, or use the Service in a manner that harms other users or the platform.
            </p>
            <p>
              You may delete your account at any time. Upon termination, your access to the Service will cease. We will handle your
              data in accordance with our Privacy Policy.
            </p>
          </Section>

          <Section id="disclaimers" title="9. Disclaimers">
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
              LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <p className="text-[#A96612] font-medium">
              [OWNER REVIEW] Review applicable consumer protection laws in your jurisdiction that may limit disclaimers.
            </p>
          </Section>

          <Section id="liability" title="10. Limitation of Liability">
            <p className="text-[#A96612] font-medium">
              [OWNER REVIEW] Draft an appropriate limitation of liability clause based on your jurisdiction and legal advice.
              Limitations on consequential, indirect, or incidental damages may not be enforceable in all jurisdictions.
            </p>
          </Section>

          <Section id="changes" title="11. Changes to These Terms">
            <p>
              We may revise these Terms from time to time. When we make material changes, we will update the "Last updated" date at the
              top of this page. Your continued use of the Service after changes take effect constitutes your acceptance of the revised Terms.
            </p>
          </Section>

          <Section id="contact" title="12. Contact">
            <p className="text-[#A96612] font-medium">
              [OWNER REVIEW] Provide a contact email address for legal enquiries and, where required, a registered business address.
            </p>
            <p>
              For privacy-related enquiries, please refer to our{' '}
              <Link to="/privacy-policy" className="text-[#3478B9] hover:underline">Privacy Policy</Link>.
            </p>
          </Section>

          {/* Footer nav */}
          <div className="border-t border-[#E5E7E0] pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[#969A92] text-sm">© 2026 SaaSify. All rights reserved.</p>
            <div className="flex gap-5">
              <Link to="/privacy-policy" className="text-sm text-[#6B7068] hover:text-[#171820] transition-colors">Privacy Policy</Link>
              <Link to="/" className="text-sm text-[#6B7068] hover:text-[#171820] transition-colors">Home</Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
