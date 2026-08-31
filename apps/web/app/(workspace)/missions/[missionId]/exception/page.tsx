import { MissionException } from "../../../../../components/mission-exception";
import { getRequestMessages } from "../../../../../lib/i18n-server";

export default async function ExceptionPage({
  params
}: {
  readonly params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;
  const copy = (await getRequestMessages()).steps;
  
  return (
    <div className="w-full flex flex-col pt-12">
      <header className="max-w-4xl mx-auto w-full px-4 text-center mb-8">
        <div className="text-xs font-bold tracking-widest text-amber-500 uppercase mb-4">{copy.exceptionEye}</div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{copy.exceptionTitle}</h1>
      </header>
      <MissionException missionId={missionId} />
    </div>
  );
}
