import { MissionResult } from "../../../../../components/mission-result";
import { MissionResultPreview } from "../../../../../components/mission-result-preview";

export default async function ResultPage({
  params
}: {
  readonly params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;
  return (
    <main>
      {missionId === "demo-verified" && process.env.NODE_ENV === "development" ? (
        <MissionResultPreview />
      ) : (
        <MissionResult missionId={missionId} />
      )}
    </main>
  );
}
