import { CreatePaymentLinkForm } from './components/CreatePaymentLinkForm';
import { PaymentLinksPanel } from './components/PaymentLinksPanel';
import { usePaymentLinks } from './hooks/usePaymentLinks';

export default function App() {
  const { links, loadState, reload, create } = usePaymentLinks();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="text-sm font-semibold text-slate-900">Merchant Dashboard</span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
            Demo data
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900">Payment Links</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create shareable links to collect payments and track their status.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <section aria-labelledby="create-link-heading" className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 id="create-link-heading" className="mb-4 text-base font-semibold text-slate-900">
              Create payment link
            </h2>
            <CreatePaymentLinkForm onCreate={create} />
          </section>

          <PaymentLinksPanel links={links} loadState={loadState} onRetry={reload} />
        </div>
      </main>
    </div>
  );
}
