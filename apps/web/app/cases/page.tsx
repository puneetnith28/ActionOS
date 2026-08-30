import { AppHeader } from "../../components/app-header";
import { CaseInbox } from "../../components/mission-inbox";
import { getRequestMessages } from "../../lib/i18n-server";

export default async function CasesPage() {
  const copy = (await getRequestMessages()).cases;
  return <main className="shell"><AppHeader />
    <section className="hero compact"><div className="eyebrow">{copy.eyebrow}</div><h1>{copy.title}</h1><p className="lede">{copy.lede}</p></section>
    <CaseInbox />
  </main>;
}
