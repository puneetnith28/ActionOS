import { AnalysisProgress } from "../../../../../components/analysis-progress";
import { getRequestMessages } from "../../../../../lib/i18n-server";

export default async function AnalyzingPage({
  params
}: {
  readonly params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;
  const copy = (await getRequestMessages()).steps;
  
  return (
    <div className="w-full flex flex-col pt-12">
      <header className="max-w-4xl mx-auto w-full px-4 text-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">{copy.analysisTitle}</h1>
        <p className="text-lg text-muted-foreground">{copy.analysisText}</p>
      </header>
      
      <AnalysisProgress
        missionId={missionId}
        {...(missionId === "demo-analysis" && process.env.NODE_ENV === "development" ? { preview: {
          status: "ANALYZING",
          stage: "GEMINI_EXTRACTION",
          attemptCount: 1,
          createdAt: new Date().toISOString()
        } as const } : {})}
      />
    </div>
  );
}
