import { ScreenshotSlide } from "../../components/ScreenshotSlide";

export default function Slide03Landing() {
  return (
    <ScreenshotSlide
      pageNumber="03"
      eyebrow="Module 1 — Landing"
      title={<>Landing <span style={{ color: "#007AFF" }}>& Hero</span></>}
      caption="The marketing surface renders the hero, value proposition, and a live preview of the training wizard above the fold."
      imageSrc={`${import.meta.env.BASE_URL}screenshots/01-landing.jpg`}
      imageAlt="FineTuneForge landing page showing hero copy and wizard preview"
    />
  );
}
