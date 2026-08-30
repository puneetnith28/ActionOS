import { PlanReview } from "../../../../components/plan-review";
import { AppHeader } from "../../../../components/app-header";
import { getRequestMessages } from "../../../../lib/i18n-server";
import { PlanReviewPreview } from "../../../../components/plan-review-preview";

export default async function ReviewPage({
  params
}: {
  readonly params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const copy = (await getRequestMessages()).steps;
  return (
    <main className="shell">
      <AppHeader />
      <section className="journey-header">
        <div>
          <span>{copy.reviewEye}</span>
          <h1>{copy.reviewTitle}</h1>
          <p>{copy.reviewText}</p>
        </div>
      </section>
      {caseId === "demo-review" && process.env.NODE_ENV === "development" ? <PlanReviewPreview /> : <PlanReview caseId={caseId} contactMode={process.env.COMPANY_CONTACT_MODE === "email" ? "email" : "sandbox"} />}
    </main>
  );
}
