import React, { useState } from 'react';
import { FullScreenModal } from './ui/FullScreenModal';
import { Button } from './ui/Button';
import { Shield, FileText, Lock, Info } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PRIVACY_POLICY = `
# Privacy Policy

**Effective Date:** March 20, 2026

At LanTrack, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our application.

## 1. Information We Collect
We collect information that you provide directly to us when you register for an account, update your profile, or use our services. This may include:
- **Personal Data:** Email address, display name, and profile picture.
- **Usage Data:** Time logs, tasks, calendar events, and application preferences.

## 2. How We Use Your Information
We use the information we collect to:
- Provide, operate, and maintain our application.
- Improve, personalize, and expand our services.
- Understand and analyze how you use our application.
- Develop new products, services, features, and functionality.

## 3. Data Security
We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.

## 4. Contact Us
If you have questions or comments about this Privacy Policy, please contact us at support@lantrack.example.com.
`;

const TERMS_OF_USE = `
# Terms of Use

**Effective Date:** March 20, 2026

Please read these Terms of Use carefully before using the LanTrack application.

## 1. Acceptance of Terms
By accessing or using LanTrack, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.

## 2. User Accounts
When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.

## 3. Intellectual Property
The Service and its original content, features, and functionality are and will remain the exclusive property of LanTrack and its licensors.

## 4. Termination
We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
`;

const SECURITY_POLICY = `
# Security Policy

**Effective Date:** March 20, 2026

LanTrack is committed to ensuring the security of your data.

## 1. Infrastructure Security
LanTrack is hosted on secure cloud infrastructure provided by Google Cloud Platform (Firebase). We utilize industry-standard encryption for data at rest and in transit.

## 2. Authentication
We use Firebase Authentication to securely manage user identities. Passwords are not stored by LanTrack; instead, we rely on secure token-based authentication.

## 3. Vulnerability Management
We regularly scan our application for vulnerabilities and apply patches promptly. If you discover a security vulnerability, please report it to security@lantrack.example.com.
`;

export const docs = [
  { id: 'privacy', title: 'Privacy Policy', icon: Shield, content: PRIVACY_POLICY },
  { id: 'terms', title: 'Terms of Use', icon: FileText, content: TERMS_OF_USE },
  { id: 'security', title: 'Security Policy', icon: Lock, content: SECURITY_POLICY },
];

export function LegalLinks({ className = "", mode = "links" }: { className?: string, mode?: "links" | "footer" }) {
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const activeContent = docs.find(d => d.id === activeDoc);

  return (
    <>
      {mode === "links" ? (
        <div className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400 ${className}`}>
          {docs.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => setActiveDoc(doc.id)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors"
            >
              {doc.title}
            </button>
          ))}
        </div>
      ) : (
        <div className={`text-center text-xs text-zinc-500 dark:text-zinc-400 ${className}`}>
          By continuing, you agree to our{" "}
          <button
            type="button"
            onClick={() => setActiveDoc('terms')}
            className="text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
          >
            Terms of Use
          </button>
          {" "}and{" "}
          <button
            type="button"
            onClick={() => setActiveDoc('privacy')}
            className="text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
          >
            Privacy Policy
          </button>
          .
        </div>
      )}

      <FullScreenModal
        isOpen={!!activeDoc}
        onClose={() => setActiveDoc(null)}
        title={activeContent?.title || 'Legal Document'}
      >
        <div className="pb-8 text-zinc-700 dark:text-zinc-300 space-y-4">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-6 mb-4" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-5 mb-3" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mt-4 mb-2" {...props} />,
              p: ({ node, ...props }) => <p className="leading-relaxed mb-4" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
              li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
              a: ({ node, ...props }) => <a className="text-indigo-600 dark:text-indigo-400 hover:underline" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-semibold text-zinc-900 dark:text-zinc-100" {...props} />,
            }}
          >
            {activeContent?.content || ''}
          </Markdown>
        </div>
      </FullScreenModal>
    </>
  );
}

export function LegalDocuments() {
  const [activeDoc, setActiveDoc] = useState<string | null>(null);

  const activeContent = docs.find(d => d.id === activeDoc);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Legal & Privacy</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {docs.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setActiveDoc(doc.id)}
            className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
          >
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <doc.icon className="w-5 h-5" />
            </div>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{doc.title}</span>
          </button>
        ))}
      </div>

      <FullScreenModal
        isOpen={!!activeDoc}
        onClose={() => setActiveDoc(null)}
        title={activeContent?.title || 'Legal Document'}
      >
        <div className="pb-8 text-zinc-700 dark:text-zinc-300 space-y-4">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-6 mb-4" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-5 mb-3" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mt-4 mb-2" {...props} />,
              p: ({ node, ...props }) => <p className="leading-relaxed mb-4" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
              li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
              a: ({ node, ...props }) => <a className="text-indigo-600 dark:text-indigo-400 hover:underline" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-semibold text-zinc-900 dark:text-zinc-100" {...props} />,
            }}
          >
            {activeContent?.content || ''}
          </Markdown>
        </div>
      </FullScreenModal>
    </div>
  );
}
