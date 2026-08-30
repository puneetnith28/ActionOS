import { AnalysisProgress } from "../../../../components/analysis-progress";
import { AppHeader } from "../../../../components/app-header";
import { getRequestMessages } from "../../../../lib/i18n-server";

export default async function AnalyzingPage({
  params
}: {
  readonly params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;
  const copy = (await getRequestMessages()).steps;
  return <main className="shell">
    <AppHeader />
    <section className="journey-header analysis-page-header">
      <div>
        <span>{copy.analysisEye}</span>
        <h1>{copy.analysisTitle}</h1>
        <p>{copy.analysisText}</p>
      </div>
    </section>
    <AnalysisProgress
      missionId={missionId}
      {...(missionId === "demo-analysis" && process.env.NODE_ENV === "development" ? { preview: {
        status: "ANALYZING",
        stage: "GEMINI_EXTRACTION",
        attemptCount: 1,
        createdAt: new Date().toISOString()
      } as const } : {})}
    />
  </main>;
}
