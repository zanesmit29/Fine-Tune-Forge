import { ScreenshotSlide } from "../../components/ScreenshotSlide";

export default function Slide04Wizard() {
  return (
    <ScreenshotSlide
      pageNumber="04"
      eyebrow="Module 2 — Wizard"
      title={<>Training <span style={{ color: "#007AFF" }}>Wizard</span></>}
      caption="Six task tiles render correctly. Instruction Tuning is flagged LM Studio Ready, reflecting the latest integration work."
      imageSrc={`${import.meta.env.BASE_URL}screenshots/04-wizard.jpg`}
      imageAlt="Wizard task selection step with six task types"
    />
  );
}
