import { ScreenshotSlide } from "../../components/ScreenshotSlide";

export default function Slide06GetStarted() {
  return (
    <ScreenshotSlide
      pageNumber="06"
      eyebrow="Module 4 — Documentation"
      title={<>In-App <span style={{ color: "#007AFF" }}>Documentation</span></>}
      caption="The Get Started page now includes an Enabling GPU Training with Modal section, walking new users from token paste through their first GPU run."
      imageSrc={`${import.meta.env.BASE_URL}screenshots/02-get-started.jpg`}
      imageAlt="Get Started documentation page with the new GPU training section"
    />
  );
}
