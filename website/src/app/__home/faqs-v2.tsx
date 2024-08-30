"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "What is Garment Khazana?",
    answer:
      "Garment Khazana is a simple and easy to use app to manage your and your family's closet.",
  },
  {
    question: "Can I try it for free?",
    answer: "Yes, you can try Garment Khazana for free forever.",
  },
  {
    question: "What platforms does it integrate with?",
    answer: "Garment Khazana integrates with iOS and Android platforms.",
  },
  {
    question: "What are the features?",
    answer:
      "Garment Khazana has features like managing your closet, your family's closet, shared closet from friends, and more.",
  },
];

const FAQSection = () => {
  const [expanded, setExpanded] = useState(null);

  const toggleFAQ = (index: any) => {
    setExpanded(expanded === index ? null : index);
  };

  return (
    <section id="faqs" className="py-20">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold mb-12 text-center">
          {" "}
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="border border-gray-200 rounded-lg"
            >
              <motion.div
                className="p-4 cursor-pointer"
                onClick={() => toggleFAQ(index)}
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-semibold">{faq.question}</h3>
              </motion.div>
              {expanded === index && (
                <motion.div
                  className="p-4 text-gray-700"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {faq.answer}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
