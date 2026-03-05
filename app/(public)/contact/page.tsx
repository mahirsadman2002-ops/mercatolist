import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Clock, Building2 } from "lucide-react";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact MercatoList",
  description:
    "Get in touch with the MercatoList team. We're here to help with any questions about buying or selling businesses in NYC.",
};

const faqs = [
  {
    question: "How do I list my business?",
    answer:
      "Creating a listing is free. Sign up for an account, click 'List Your Business' in the navigation, and follow the step-by-step form.",
    link: { href: "/my-listings/new", label: "Create a listing" },
  },
  {
    question: "Is it free to browse listings?",
    answer:
      "Yes! Browsing and searching listings on MercatoList is completely free. You only need an account to save listings, send inquiries, or create your own listing.",
  },
  {
    question: "How do I contact a seller?",
    answer:
      "Visit any listing page and use the contact form or message button to reach the seller or their broker directly. Anonymous inquiries are also supported.",
    link: { href: "/listings", label: "Browse listings" },
  },
  {
    question: "I'm a broker — how do I register?",
    answer:
      "Brokers can register through our dedicated broker registration page. You'll get access to additional tools like collections, client management, and review requests.",
    link: { href: "/register/broker", label: "Register as a broker" },
  },
];

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Heading */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Contact Us
        </h1>
        <p className="text-xl text-muted-foreground">
          Have a question? We&apos;d love to hear from you.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-10 mb-16">
        {/* Contact Form */}
        <div className="flex-1">
          <ContactForm />
        </div>

        {/* Contact Info */}
        <div className="md:w-80 shrink-0 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Email</p>
                  <a
                    href="mailto:support@mercatolist.com"
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    support@mercatolist.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Response Time</p>
                  <p className="text-sm text-muted-foreground">
                    We typically respond within 24 hours
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Office Hours</p>
                  <p className="text-sm text-muted-foreground">
                    Monday &ndash; Friday, 9am &ndash; 6pm ET
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.question}>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {faq.answer}
                  {faq.link && (
                    <>
                      {" "}
                      <Link
                        href={faq.link.href}
                        className="text-foreground underline underline-offset-2 hover:no-underline"
                      >
                        {faq.link.label} &rarr;
                      </Link>
                    </>
                  )}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
