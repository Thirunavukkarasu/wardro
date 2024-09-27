"use client";
import { useState } from "react";
import { motion } from "framer-motion";

const features = [
  {
    title: "Create Closets",
    description:
      "Create and manage your own closet, your family's closet, and shared closets.",
    img: "features/feature_1.png",
  },
  {
    title: "Plan Outfits",
    description: "Plan your outfits for the week or month with ease.",
    img: "features/feature_1.png",
  },
  {
    title: "Track Usage",
    description:
      "Track the usage of your clothes and plan your purchases accordingly.",
    img: "features/feature_1.png",
  },
  {
    title: "Share with Friends & Family",
    description: "Share your closet with friends and family.",
    img: "features/feature_1.png",
  },
  {
    title: "Get Recommendations",
    description: "Get recommendations on what to wear based on the weather.",
    img: "features/feature_1.png",
  },
  {
    title: "Manage Purchases",
    description: "Manage your purchases and track your expenses.",
    img: "features/feature_1.png",
  },
];

const FeatureSection = () => {
  const [selectedFeature, setSelectedFeature] = useState(features[0]);

  return (
    <section id="features" className="py-20 bg-white text-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-center tracking-tight">
            Create, Plan, Track, and Share
          </h2>
          <p className="text-lg mb-8 text-center">
            Simple and powerful features to help you manage your closet with
            ease.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Accordion on the Left */}
          <div className="w-96">
            {features.map((feature, index) => (
              <div key={index} className="mb-4">
                <motion.div
                  className="p-4 border border-gray-200 rounded-lg cursor-pointer"
                  onClick={() => setSelectedFeature(feature)}
                  whileHover={{ scale: 1.02 }}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </motion.div>
                {selectedFeature.title === feature.title && (
                  <motion.p
                    className="p-4 text-gray-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {feature.description}
                  </motion.p>
                )}
              </div>
            ))}
          </div>

          {/* Feature Image Preview on the Right */}
          <div className="w-96 flex justify-center items-center">
            <motion.img
              key={selectedFeature.img}
              src={selectedFeature.img}
              alt={selectedFeature.title}
              className="w-3/4 h-auto rounded-lg shadow-lg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
