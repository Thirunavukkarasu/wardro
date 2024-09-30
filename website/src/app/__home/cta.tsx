import { Button } from "@/components/ui/button";
import React from "react";

export default function CTA() {
  return (
    <section id="cta" className="py-20 text-center">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold mb-6">
          Built for{" "}
          <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mt-1 inline-flex">
            the Community
          </span>
        </h2>
        <p className="text-lg mb-8">
          Wardro is an open-source project. Contribute to the project
        </p>
        <Button asChild variant={"outline"}>
          <a href="https://github.com/thirunavukkarasu/my-closet">
            Start on Github
          </a>
        </Button>
      </div>
    </section>
  );
}
