"use client"
import { Cpu } from 'lucide-react';
import Link from 'next/link';

const footerSections = [
  {
    label: 'Models',
    href: '/category/models',
    items: ['GPT-4o', 'Claude 3.5', 'Gemini 1.5 Pro', 'Llama 3', 'Mistral', 'DeepSeek V2'],
  },
  {
    label: 'Agents',
    href: '/category/agents',
    items: ['AutoGPT', 'Multi-Agent Systems', 'Enterprise Agents', 'Autonomous Workflows', 'AI Assistants'],
  },
  {
    label: 'Tools',
    href: '/category/tools',
    items: ['Claude Code', 'Cursor', 'Windsurf', 'GitHub Copilot', 'AI APIs', 'Dev SDKs'],
  },
  {
    label: 'Research',
    href: '/category/research',
    items: ['LLM Papers', 'Benchmarks', 'AI Alignment', 'AI Safety', 'Lab Breakthroughs'],
  },
  {
    label: 'Business',
    href: '/category/business',
    items: ['Funding Rounds', 'Acquisitions', 'Partnerships', 'AI Valuations', 'IPOs'],
  },
  {
    label: 'Policy',
    href: '/category/policy',
    items: ['EU AI Act', 'US AI Policy', 'China AI Rules', 'AI Governance', 'Compliance'],
  },
  {
    label: 'Hardware',
    href: '/category/hardware',
    items: ['GPUs & Chips', 'Data Centers', 'Edge AI', 'NVIDIA', 'Compute Infrastructure'],
  },
  {
    label: 'Learn',
    href: '/category/learn',
    items: ['AI Tutorials', 'Explainers', 'How-to Guides', 'AI Courses', 'Prompt Engineering'],
  },
];

export default function Footer() {
  return (
    <footer className="bg-ai-space text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">

          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 ai-gradient-bg rounded-lg flex items-center justify-center">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-black uppercase font-heading">
                <span className="ai-gradient-text">AI</span> Fresh Daily
              </h2>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              Your trusted source for AI technology news, analysis, and education. Covering every model, every breakthrough, every day.
            </p>
          </div>

          {/* Category Columns — 4 per row on lg */}
          {footerSections.map((section) => (
            <div key={section.label}>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 ai-gradient-text font-heading">
                {section.label}
              </h3>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item}>
                    <Link
                      href={section.href}
                      className="text-sm text-gray-400 hover:text-ai-cyan transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-ai-space-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
              <Link href="/privacy"      className="hover:text-ai-cyan transition-colors">Privacy Policy</Link>
              <Link href="/terms"        className="hover:text-ai-cyan transition-colors">Terms of Service</Link>
              <Link href="/cookies"      className="hover:text-ai-cyan transition-colors">Cookie Policy</Link>
              <Link href="/accessibility" className="hover:text-ai-cyan transition-colors">Accessibility</Link>
              <Link href="/sitemap"      className="hover:text-ai-cyan transition-colors">Sitemap</Link>
              <Link href="/analytics"    className="hover:text-ai-cyan transition-colors">Analytics</Link>
            </div>
            <p className="text-sm text-gray-500 font-mono-ai">
              © {new Date().getFullYear()} AI Fresh Daily. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
