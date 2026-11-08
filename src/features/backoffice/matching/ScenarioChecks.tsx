import { CheckCircle2, XCircle } from 'lucide-react';
import type { ScenarioResult } from '@/core/matching';
import { Section } from './ui';

/** The chef's scenarios replayed with the draft settings. */
export function ScenarioChecks({
  results,
  publishedResults,
}: {
  results: ScenarioResult[];
  publishedResults: ScenarioResult[];
}) {
  const failed = results.filter((r) => !r.passed).length;
  const wasPassing = new Set(publishedResults.filter((r) => r.passed).map((r) => r.scenario.id));

  return (
    <Section
      title={`Scénarios du chef : ${results.length - failed}/${results.length} respectés`}
      hint="« Avec ce frigo, on doit voir ces plats. » Rejoués avec le brouillon avant publication."
    >
      <ul className="space-y-1.5">
        {results.map(({ scenario, passed, failures }) => (
          <li key={scenario.id} className="text-xs">
            <div className="flex items-start gap-1.5">
              {passed ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span className={passed ? 'text-ink' : 'font-semibold text-rose-600'}>
                {scenario.title}
                {!passed && wasPassing.has(scenario.id) && (
                  <span className="ml-1 font-bold">(cassé par le brouillon)</span>
                )}
              </span>
            </div>
            {!passed && (
              <ul className="ml-6 mt-0.5 list-disc text-[11px] text-ink-muted">
                {failures.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
