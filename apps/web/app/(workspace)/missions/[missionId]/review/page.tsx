import { PlanReview } from "../../../../../components/plan-review";
import { getRequestMessages } from "../../../../../lib/i18n-server";
import { PlanReviewPreview } from "../../../../../components/plan-review-preview";

export default async function ReviewPage({
  params
}: {
  readonly params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;
  const copy = (await getRequestMessages()).steps;
  
  return (
    <div className="w-full flex flex-col pt-12">
      <header className="max-w-4xl mx-auto w-full px-4 text-center mb-8">
        <div className="text-xs font-bold tracking-widest text-primary uppercase mb-4">{copy.reviewEye}</div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">{copy.reviewTitle}</h1>
        <p className="text-lg text-muted-foreground">{copy.reviewText}</p>
      </header>
      {missionId === "demo-review" && process.env.NODE_ENV === "development" ? <PlanReviewPreview /> : <PlanReview missionId={missionId} contactMode={process.env.COMPANY_CONTACT_MODE === "email" ? "email" : "sandbox"} />}
    </div>
  );
}
