import { Button } from "@/components/ui/button";
import { GithubIcon } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="py-20 text-center">
      <div className="max-w-3xl mx-auto">
        <h1 className="lg:text-5xl md:text-4xl text-3xl text-primary font-black max-w-3xl text-center mx-auto tracking-tight py-4 pb-2">
          Manage Your and Your Family&#39;s
          <br />
          <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mt-1 inline-flex">
            Closet with Ease
          </span>
        </h1>
        <p className="text-lg mb-8">
          Wardro is a simple and easy to use app to manage your and your
          family&#39;s closet.
        </p>
        <div className="space-x-4">
          <Button>Download Now</Button>
          <Button asChild variant={"outline"}>
            <a href="https://github.com/thirunavukkarasu/my-closet">
              {/* <GithubIcon size={12} /> */}
              Start on Github
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
