import Testimonials from "./__home/testimonials";
import Pricing from "./__home/pricing";
import Footer from "./__home/footer";
import Cta from "./__home/cta";
import Features from "./__home/features";
import HeroSection from "./__home/hero-section";
import Navbar from "./__home/navbar";
import FeatureSection from "./__home/features-v2";
import FAQSection from "./__home/faqs-v2";

export default async function Home() {
  return (
    <main className="flex flex-col">
      <div className="max-w-5xl mx-auto">
        <Navbar />
        <HeroSection />
        <FeatureSection />
        {/* <Testimonials /> */}
        <Pricing />
        <FAQSection />
        <Cta />
        <Footer />
      </div>
    </main>
  );
}
