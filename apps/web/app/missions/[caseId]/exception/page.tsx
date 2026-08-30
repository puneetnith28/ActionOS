import { CaseException } from "../../../../components/case-exception";
import { AppHeader } from "../../../../components/app-header";
import { getRequestMessages } from "../../../../lib/i18n-server";

export default async function ExceptionPage({
  params
}: {
  readonly params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;
  const copy = (await getRequestMessages()).steps;
  return (
    <main className="shell">
      <AppHeader />
      <section className="hero compact">
        <div className="eyebrow">{copy.exceptionEye}</div><h1>{copy.exceptionTitle}</h1>
      </section>
      <CaseException missionId={missionId} />
    </main>
  );
}
