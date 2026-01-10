"use client";
import { motion } from "framer-motion";
import { Github, Twitter, Mail, Zap } from "lucide-react";

export function Footer() {
  return (
    <motion.footer
      className="border-t border-white/10 bg-gradient-to-b from-transparent to-slate-900/50 py-8 sm:py-10 lg:py-12"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid gap-8 sm:gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400">
                <Zap className="h-4 w-4 text-slate-950" />
              </div>
              <span className="text-lg font-bold text-white">Ajo</span>
            </div>
            <p className="mt-3 text-sm text-slate-400 max-w-xs">
              Trust-first group savings for every community and person on Celo.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white">Product</h4>
            <ul className="mt-3 sm:mt-4 space-y-2">
              {["Features", "How it works", "Pricing", "Security"].map((item) => (
                <li key={item}>
                  <button className="text-sm text-slate-400 transition hover:text-white">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-white">Resources</h4>
            <ul className="mt-3 sm:mt-4 space-y-2">
              {["Documentation", "Blog", "Community", "Support"].map((item) => (
                <li key={item}>
                  <button className="text-sm text-slate-400 transition hover:text-white">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-sm font-semibold text-white">Connect</h4>
            <div className="mt-3 sm:mt-4 flex gap-3">
              {[
                { icon: Twitter, label: "Twitter" },
                { icon: Github, label: "GitHub" },
                { icon: Mail, label: "Email" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-cyan-400/50 hover:text-cyan-300"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 sm:mt-10 lg:mt-12 border-t border-white/10 pt-6 sm:pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">
              © 2025 Ajo. Built on Celo with Self Protocol.
            </p>
            <div className="flex gap-4 sm:gap-6">
              <button className="text-xs sm:text-sm text-slate-400 transition hover:text-white">
                Privacy
              </button>
              <button className="text-xs sm:text-sm text-slate-400 transition hover:text-white">
                Terms
              </button>
              <button className="text-xs sm:text-sm text-slate-400 transition hover:text-white">
                Cookies
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
