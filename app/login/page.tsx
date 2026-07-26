import AccessLoginForm from "../../components/AccessLoginForm";

type Props = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const nextPath = resolvedSearchParams?.next?.startsWith("/")
    ? resolvedSearchParams.next
    : "/appointments";

  return (
    <div className="bg-slate-50 px-5 py-8 text-slate-900">
      <main className="mx-auto max-w-md">
        <section className="rounded-[28px] bg-white p-6 shadow-sm shadow-slate-200">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Prywatny dostęp
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-900">
            Podaj hasło
          </h1>

          <div className="mt-6">
            <AccessLoginForm nextPath={nextPath} />
          </div>
        </section>
      </main>
    </div>
  );
}
