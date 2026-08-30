export const locales = ["en", "es", "pt"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export function localizePath(pathname: string, locale: Locale): string {
  const segments = pathname.split("/");
  if (isLocale(segments[1])) segments.splice(1, 1);
  const path = `/${segments.filter(Boolean).join("/")}`;
  return `/${locale}${path === "/" ? "" : path}`;
}

const en = {
  language: { label: "Language", en: "English", es: "Español", pt: "Português" },
  header: { home: "ActionOS home", navigation: "Primary navigation", cases: "My Missions", privacy: "Privacy", try: "Try ActionOS" },
  metadata: { title: "ActionOS — AI that takes action, not just instructions", description: "Give ActionOS a goal. It builds a plan, uses tools, and evaluates evidence until the mission is accomplished." },
  cases: { eyebrow: "My Missions", title: "Only intervene when necessary.", lede: "Monitor what ActionOS is executing, what needs human approval, and what is already verified complete." },
  home: {
    eyebrow: "The autonomous execution agent",
    title: "AI that takes action, not just instructions.",
    lede: "ActionOS translates your goal into a plan, invokes capabilities, and persists through background workflows until the objective is conclusively met.",
    handoff: "Assign a mission", how: "See how it works",
    trust: "No opaque black boxes · Full execution tracing · Stop anytime",
    example: "Example mission", refund: "Provision · DB", order: "Deploy 1842", outcome: "OUTCOME",
    receive: "Provision the production database", understood: "Goal understood", extracted: "Region, capacity, and target extracted",
    approved: "Execution plan approved", approvedDetail: "Four actions, restricted capabilities only", rejected: "“API timeout” rejected",
    rejectedDetail: "A timeout is not a resolution", confirmed: "Database provisioned", confirmedDetail: "Matching connection string received",
    proof: "Goal verified", complete: "Mission complete",
    contrast: "Standard LLMs generate conversational text. Copilots leave the work to you.",
    contrastTitle: "ActionOS keeps your mission active until the system state matches the goal.",
    why: "Why use ActionOS", giveTitle: "Define the objective", giveText: "Describe the goal, constraints, and target outcomes in natural language.",
    approveTitle: "Approve the plan", approveText: "Review the selected capabilities, sequence, and limits before any side-effects occur.",
    attentionTitle: "Return only for results", attentionText: "ActionOS operates asynchronously, evaluating tool outputs and retrying safely until success.",
    difference: "The difference", notChat: "Not another chatbot. An autonomous execution loop.", reminder: "COPILOT",
    reminderQuote: "“Here is a script to provision your database.”", reminderText: "You still have to copy, run, debug, verify, and deploy.",
    duebackQuote: "“I will execute this sequence within approved limits.”", duebackText: "The agent acts, verifies outcomes, retries safely, and returns when the state is achieved.",
    recipe: "Live demonstration", tired: "What are you tired of doing manually?", start: "Start with deployment, provisioning, data migration, or workflow automation.", live: "Try the execution console"
  },
  intake: {
    eyebrow: "Autonomous execution for developers", title: "State the objective. ActionOS executes.",
    lede: "Turn high-level goals into an approved plan with strict boundaries, autonomous capability execution, and verifiable outcomes.",
    trust: "You approve the execution", rules: "Verification checks the result", useCases: "ActionOS use cases", followup: "System provisioning · live", appointments: "Data migration · next", documents: "Workflow automation · next",
    after: "After you approve", contactTitle: "ActionOS invokes capabilities", contactText: "using strictly the tools and parameters you authorized.",
    openTitle: "It manages the lifecycle", openText: "when an API returns a long-running operation ID.", returnTitle: "You return only for edge cases or completion.", returnText: "The console updates automatically as state changes.",
    demoTitle: "Live execution:", demoText: "The sandbox capabilities are the safe default. Authenticated users may grant access to external integrations.",
    principles: "ActionOS principles", geminiTitle: "Gemini understands the state", geminiText: "Logs, API responses, errors, and system context.",
    boundariesTitle: "You set every boundary", boundariesText: "Review the capability selection, parameters, and verification rules first.",
    proofTitle: "Verification decides what counts", proofText: "An HTTP 200 is not completion. The actual state must match."
  },
  privacy: {
    eyebrow: "ActionOS privacy", title: "Total execution transparency.",
    lede: "ActionOS maintains complete audit logs of all agent actions. Execution history is retained for debugging and observability. Sandbox missions expire after seven days.",
    before: "Before execution", beforeText: "No side-effects occur without plan approval.", activated: "When executing", activatedText: "Only authorized capabilities can access external systems.",
    gemini: "Gemini reasoning", geminiText: "Google's Gemini service powers the planning and evaluation steps. The model itself cannot bypass capability constraints.",
    deletion: "Deletion", deletionText: "Deleting a mission removes its execution history and state from the timeline.", logs: "Audit Logs", logsText: "All tool invocations and model responses are cryptographically hashed for integrity.", limitation: "Demo limitation", limitationText: "The live capabilities act against a sandboxed environment, not real infrastructure."
  },
  steps: {
    analysisEye: "Step 1 · Goal comprehension", analysisTitle: "Your mission is safely planned.", analysisText: "Gemini decomposes the goal; deterministic rules validate capability requirements.",
    reviewEye: "Step 2 · Nothing executes without you", reviewTitle: "Review what ActionOS planned.", reviewText: "Correct any parameters and approve the execution boundaries.",
    resultEye: "Step 3 · Autonomous execution", resultTitle: "ActionOS is driving the workflow.", resultText: "This console updates as capabilities are invoked and state is verified.",
    exceptionEye: "Only when human judgment matters", exceptionTitle: "ActionOS needs an intervention."
  }
} as const;

type WidenStrings<T> = { [K in keyof T]: T[K] extends string ? string : WidenStrings<T[K]> };
export type Messages = WidenStrings<typeof en>;

const es: Messages = {
  language: { label: "Idioma", en: "English", es: "Español", pt: "Português" },
  header: { home: "Inicio de DueBack", navigation: "Navegación principal", cases: "Mis seguimientos", privacy: "Privacidad", try: "Probar DueBack" },
  metadata: { title: "DueBack — Prueba de cumplimiento para agentes cotidianos", description: "Dale a DueBack un resultado pendiente. Seguirá los límites aprobados hasta obtener evidencia real." },
  cases: { eyebrow: "Mis seguimientos", title: "Volvé sólo cuando importe.", lede: "Mirá qué está gestionando DueBack, qué necesita una decisión y qué ya tiene prueba suficiente." },
  home: {
    eyebrow: "El agente que hace el seguimiento por vos", title: "Dejá de perseguir a las empresas por lo que ya prometieron.", lede: "DueBack lee la promesa, hace el seguimiento dentro de los límites que aprobás y mantiene el caso abierto hasta que la evidencia sea suficiente.", handoff: "Delegar un seguimiento", how: "Ver cómo funciona", trust: "Sin acceso a tu correo · Nada se envía sin aprobación · Detenelo cuando quieras", example: "Caso de ejemplo", refund: "Reembolso · USD 59", order: "Pedido 1842", outcome: "RESULTADO", receive: "Recibir el reembolso prometido", understood: "Promesa comprendida", extracted: "Monto, referencia y fecha extraídos", approved: "Seguimiento aprobado", approvedDetail: "Una acción, sólo los datos aprobados", rejected: "“Solicitud recibida” rechazada", rejectedDetail: "Un acuse de recibo no es una resolución", confirmed: "Reembolso confirmado", confirmedDetail: "Se recibió evidencia firmada coincidente", proof: "Prueba aceptada", complete: "Caso completo", contrast: "Los sistemas de las empresas cierran tickets. Los recordatorios te devuelven el trabajo.", contrastTitle: "DueBack mantiene tu promesa abierta hasta que la evidencia de la empresa coincida.", why: "Por qué usar DueBack", giveTitle: "Dale lo que tengas", giveText: "Pegá un mensaje, describí la situación o subí una captura, foto o PDF.", approveTitle: "Aprobá los límites", approveText: "Revisá la acción, el destinatario, los datos, los límites y la prueba requerida antes de que ocurra algo.", attentionTitle: "Recuperá tu atención", attentionText: "DueBack sigue trabajando ante demoras y acuses hasta recibir evidencia verificable.", difference: "La diferencia", notChat: "No es otro chatbot. Es un caso que permanece abierto.", reminder: "RECORDATORIO", reminderQuote: "“Mañana escribile a la tienda.”", reminderText: "Todavía tenés que recordar, escribir, enviar, revisar y decidir.", duebackQuote: "“Haré el seguimiento dentro de estos límites.”", duebackText: "El agente actúa, rechaza evidencia débil, reintenta con seguridad y vuelve cuando te necesita.", recipe: "Flujo activo · seguimiento empresarial", tired: "¿Qué te cansaste de perseguir?", start: "Empezá con un reembolso, cancelación, reemplazo, entrega o documento prometido.", live: "Probar la experiencia"
  },
  intake: {
    eyebrow: "Prueba de cumplimiento para agentes cotidianos", title: "Decí qué tiene que pasar. DueBack lo mantiene en movimiento.", lede: "Convertí resultados pendientes en un plan aprobado con límites, seguimiento autónomo y evidencia suficiente para dar el trabajo por terminado.", trust: "Vos aprobás los límites", rules: "Las reglas verifican el resultado", useCases: "Casos de uso de DueBack", followup: "Seguimiento empresarial · activo", appointments: "Turnos · próximamente", documents: "Documentos · próximamente", after: "Después de tu aprobación", contactTitle: "DueBack contacta a la contraparte", contactText: "usando únicamente el destinatario y la acción que aprobaste.", openTitle: "Mantiene el caso abierto", openText: "cuando una respuesta sólo dice “solicitud recibida”.", returnTitle: "Volvés únicamente para una decisión o resultado.", returnText: "Esta demo actualiza automáticamente la página del caso.", demoTitle: "Demo activa:", demoText: "el adaptador HTTP controlado es la opción segura. Los usuarios identificados pueden elegir explícitamente el piloto de correo administrado con lista permitida durante la revisión.", principles: "Principios de DueBack", geminiTitle: "Gemini comprende el resultado", geminiText: "Mensajes, capturas, PDF y tu propio contexto.", boundariesTitle: "Vos definís cada límite", boundariesText: "Revisá primero la acción, destinatario, datos, canal y prueba.", proofTitle: "La prueba decide qué cuenta", proofText: "Un acuse de recibo no es cumplimiento. La evidencia debe coincidir."
  },
  privacy: {
    eyebrow: "Privacidad de DueBack", title: "Sólo la promesa que elegís compartir.", lede: "DueBack no lee tu correo. El texto y los archivos originales se eliminan después de una extracción exitosa y tienen una retención máxima de 24 horas. El caso estructurado vence siete días después del ingreso y su TTL automático se programa como máximo 30 días después. Podés eliminar antes un caso activado desde sus controles.", before: "Antes de activar", beforeText: "No se envía nada a ninguna empresa.", activated: "Al activar", activatedText: "Sólo se comparten la referencia, el monto y la moneda incluidos en el plan aprobado.", gemini: "Procesamiento con Gemini", geminiText: "El servicio Gemini de Google procesa la fuente que enviás para extraer un borrador. Gemini no tiene herramientas de contacto y no puede aprobar, enviar ni cerrar el caso.", deletion: "Eliminación", deletionText: "Eliminar borra el caso y sus registros operativos relacionados. Se conserva hasta 30 días un recibo de eliminación con hash para auditar la solicitud sin retener el contenido.", logs: "Registros", logsText: "Los registros operativos usan identificadores y hashes, no los archivos ni el texto completo de la promesa.", limitation: "Límite de la demo", limitationText: "El comercio es un entorno controlado, no una empresa real. Su confirmación no prueba una liquidación bancaria."
  },
  steps: { analysisEye: "Paso 1 · Análisis de evidencia", analysisTitle: "Tu promesa ya está en movimiento de forma segura.", analysisText: "Gemini extrae candidatos; reglas deterministas comprueban qué necesita tu revisión.", reviewEye: "Paso 2 · Nada ocurre sin vos", reviewTitle: "Revisá lo que DueBack entendió.", reviewText: "Corregí lo que esté mal y elegí exactamente qué puede hacer el agente.", resultEye: "Paso 3 · Seguimiento", resultTitle: "DueBack está ocupándose del seguimiento.", resultText: "Esta página se actualiza cuando responde la contraparte y se verifica la evidencia.", exceptionEye: "Sólo cuando tu criterio importa", exceptionTitle: "DueBack necesita una decisión." }
};

const pt: Messages = {
  language: { label: "Idioma", en: "English", es: "Español", pt: "Português" },
  header: { home: "Início do DueBack", navigation: "Navegação principal", cases: "Meus acompanhamentos", privacy: "Privacidade", try: "Testar DueBack" },
  metadata: { title: "DueBack — Prova de conclusão para agentes cotidianos", description: "Entregue ao DueBack um resultado pendente. Ele seguirá os limites aprovados até obter evidência real." },
  cases: { eyebrow: "Meus acompanhamentos", title: "Volte somente quando for importante.", lede: "Veja o que o DueBack está gerenciando, o que precisa de uma decisão e o que já tem prova suficiente." },
  home: {
    eyebrow: "O agente que acompanha por você", title: "Pare de cobrar das empresas o que elas já prometeram.", lede: "O DueBack lê a promessa, acompanha dentro dos limites que você aprova e mantém o caso aberto até que a evidência seja suficiente.", handoff: "Delegar um acompanhamento", how: "Ver como funciona", trust: "Sem acesso ao seu e-mail · Nada é enviado sem aprovação · Pare quando quiser", example: "Caso de exemplo", refund: "Reembolso · US$ 59", order: "Pedido 1842", outcome: "RESULTADO", receive: "Receber o reembolso prometido", understood: "Promessa compreendida", extracted: "Valor, referência e prazo extraídos", approved: "Acompanhamento aprovado", approvedDetail: "Uma ação, somente os dados aprovados", rejected: "“Solicitação recebida” rejeitada", rejectedDetail: "Uma confirmação de recebimento não é uma resolução", confirmed: "Reembolso confirmado", confirmedDetail: "Evidência assinada correspondente recebida", proof: "Prova aceita", complete: "Caso concluído", contrast: "Os sistemas das empresas fecham chamados. Os lembretes devolvem o trabalho para você.", contrastTitle: "O DueBack mantém sua promessa aberta até a evidência da empresa corresponder.", why: "Por que usar o DueBack", giveTitle: "Envie o que você tiver", giveText: "Cole uma mensagem, descreva a situação ou envie uma captura, foto ou PDF.", approveTitle: "Aprove os limites", approveText: "Veja a ação, o destinatário, os dados, os limites e a prova exigida antes que algo aconteça.", attentionTitle: "Recupere sua atenção", attentionText: "O DueBack continua trabalhando durante atrasos e confirmações até receber evidência verificável.", difference: "A diferença", notChat: "Não é outro chatbot. É um caso que permanece aberto.", reminder: "LEMBRETE", reminderQuote: "“Amanhã fale com a loja.”", reminderText: "Você ainda precisa lembrar, escrever, enviar, verificar e decidir.", duebackQuote: "“Vou acompanhar dentro destes limites.”", duebackText: "O agente age, rejeita evidência fraca, tenta novamente com segurança e retorna quando precisa de você.", recipe: "Fluxo ativo · acompanhamento empresarial", tired: "O que você cansou de cobrar?", start: "Comece com um reembolso, cancelamento, substituição, entrega ou documento prometido.", live: "Testar a experiência"
  },
  intake: {
    eyebrow: "Prova de conclusão para agentes cotidianos", title: "Diga o que precisa acontecer. O DueBack mantém tudo em movimento.", lede: "Transforme resultados pendentes em um plano aprovado com limites, acompanhamento autônomo e evidência suficiente para concluir o trabalho.", trust: "Você aprova os limites", rules: "As regras verificam o resultado", useCases: "Casos de uso do DueBack", followup: "Acompanhamento empresarial · ativo", appointments: "Agendamentos · em breve", documents: "Documentos · em breve", after: "Depois da sua aprovação", contactTitle: "O DueBack contata a contraparte", contactText: "usando apenas o destinatário e a ação que você aprovou.", openTitle: "Mantém o caso aberto", openText: "quando uma resposta diz apenas “solicitação recebida”.", returnTitle: "Você volta apenas para uma decisão ou resultado.", returnText: "Esta demonstração atualiza automaticamente a página do caso.", demoTitle: "Demonstração ativa:", demoText: "o adaptador HTTP controlado é a opção segura. Usuários identificados podem escolher explicitamente o piloto de e-mail gerenciado com lista permitida durante a revisão.", principles: "Princípios do DueBack", geminiTitle: "Gemini compreende o resultado", geminiText: "Mensagens, capturas, PDFs e seu próprio contexto.", boundariesTitle: "Você define cada limite", boundariesText: "Revise primeiro a ação, o destinatário, os dados, o canal e a prova.", proofTitle: "A prova decide o que conta", proofText: "Uma confirmação de recebimento não é conclusão. A evidência deve corresponder."
  },
  privacy: {
    eyebrow: "Privacidade do DueBack", title: "Somente a promessa que você escolhe compartilhar.", lede: "O DueBack não lê seu e-mail. O texto e os arquivos originais são excluídos após uma extração bem-sucedida e têm retenção máxima de 24 horas. O caso estruturado expira sete dias após o envio e seu TTL automático é programado no máximo 30 dias depois. Você pode excluir antes um caso ativado usando seus controles.", before: "Antes da ativação", beforeText: "Nada é enviado a uma empresa.", activated: "Ao ativar", activatedText: "Somente a referência, o valor e a moeda presentes no plano aprovado são compartilhados.", gemini: "Processamento com Gemini", geminiText: "O serviço Gemini do Google processa a fonte enviada para extrair um rascunho. O Gemini não possui ferramentas de contato e não pode aprovar, enviar ou encerrar o caso.", deletion: "Exclusão", deletionText: "Excluir remove o caso e seus registros operacionais relacionados. Um recibo de exclusão com hash permanece por até 30 dias para auditoria sem reter o conteúdo.", logs: "Registros", logsText: "Os registros operacionais usam identificadores e hashes, não arquivos enviados nem o texto completo da promessa.", limitation: "Limite da demonstração", limitationText: "O comerciante é um ambiente controlado, não uma empresa real. A confirmação não comprova liquidação bancária."
  },
  steps: { analysisEye: "Etapa 1 · Análise de evidência", analysisTitle: "Sua promessa está em movimento com segurança.", analysisText: "O Gemini extrai candidatos; regras determinísticas verificam o que precisa da sua revisão.", reviewEye: "Etapa 2 · Nada acontece sem você", reviewTitle: "Revise o que o DueBack entendeu.", reviewText: "Corrija o que estiver errado e escolha exatamente o que o agente pode fazer.", resultEye: "Etapa 3 · Acompanhamento", resultTitle: "O DueBack está cuidando do acompanhamento.", resultText: "Esta página é atualizada quando a contraparte responde e a evidência é verificada.", exceptionEye: "Somente quando seu julgamento importa", exceptionTitle: "O DueBack precisa de uma decisão." }
};

const messages: Record<Locale, Messages> = { en, es, pt };
export function getMessages(locale: Locale): Messages { return messages[locale]; }
