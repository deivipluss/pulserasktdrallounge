export default function Page() {
  return (
    <main className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">KTD Lounge</h1>
      <p className="text-xs text-gray-400">build f50d44a</p>
      <p className="text-gray-600 dark:text-gray-300">Selecciona una sección:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li><a className="text-fiesta-purple underline" href="/imprimir-pulseras">Imprimir pulseras</a></li>
        <li><a className="text-fiesta-purple underline" href="/jugar">Jugar (requiere token)</a></li>
        <li><a className="text-fiesta-purple underline" href="/status?token=admin-token-2025">Status (admin)</a></li>
        <li><a className="text-fiesta-purple underline" href="/demo">Demo</a></li>
        <li><a className="text-fiesta-purple underline" href="/dev/test-tokens">Dev / Test Tokens</a></li>
      </ul>
    </main>
  );
}
