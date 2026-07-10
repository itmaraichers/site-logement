export default function PageEnConstruction({
  titre,
  description,
  elements,
}: {
  titre: string;
  description: string;
  elements: string[];
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">{titre}</h1>
      <p className="text-slate-500 mb-6">{description}</p>

      <div className="bg-white border border-dashed border-primary-300 rounded-xl p-6">
        <p className="text-sm font-medium text-primary-700 mb-3">
          À connecter à Supabase (étape suivante) :
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
          {elements.map((el) => (
            <li key={el}>{el}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
