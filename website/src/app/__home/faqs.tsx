import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    title: "What is Wardro?",
    content:
      "Wardro is a simple and easy to use app to manage your and your family's closet.",
  },
  {
    title: "Can I try it for free?",
    content: "Yes, you can try Wardro for free forever.",
  },
  {
    title: "What platforms does it integrate with?",
    content: "Wardro integrates with iOS and Android platforms.",
  },
  {
    title: "What are the features?",
    content:
      "Wardro has features like managing your closet, your family's closet, shared closet from friends, and more.",
  },
];

export default function Faqs() {
  return (
    <section id="faq" className="py-20">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-12">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="max-w-3xl">
          {faqs.map((faq, index) => (
            <AccordionItem value={faq.title} key={index}>
              <AccordionTrigger>{faq.title}</AccordionTrigger>
              <AccordionContent className="text-left">
                <p>{faq.content}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
