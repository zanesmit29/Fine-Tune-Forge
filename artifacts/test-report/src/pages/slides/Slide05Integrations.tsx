import { ScreenshotSlide } from "../../components/ScreenshotSlide";

export default function Slide05Integrations() {
  return (
    <ScreenshotSlide
      pageNumber="05"
      eyebrow="Module 3 — Integrations"
      title={<>Modal <span style={{ color: "#007AFF" }}>Integration</span></>}
      caption="The Integrations page reaches a verified Connected state. The token is masked (ak-•••ufTP), credentials live in memory only, and the GPU path is validated before the wizard accepts a job."
      imageSrc={`${import.meta.env.BASE_URL}screenshots/03-integrations.jpg`}
      imageAlt="Integrations page showing Modal in a verified Connected state"
    />
  );
}
