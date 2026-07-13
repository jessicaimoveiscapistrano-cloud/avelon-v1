"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LeadForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const isEdit = !!initialData?.id;
  const [form, setForm] = useState({
    name: initialData?.name ?? "", phone: initialData?.phone ?? "", email: initialData?.email ?? "",
    city: initialData?.city ?? "", neighborhood: initialData?.neighborhood ?? "",
    propertyPurpose: initialData?.propertyPurpose ?? "SALE", propertyType: initialData?.propertyType ?? "",
    desiredValue: initialData?.desiredValue?.toString() ?? "", observations: initialData?.observations ?? "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const url = isEdit ? `/api/leads/${initialData.id}` : "/api/leads";
    await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    router.push("/leads");
    router.refresh();
  }

  const set = (k: string) => (v: string) => setForm({ ...form, [k]: v });

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl bg-white border rounded-2xl p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <F label="Nome" value={form.name} onChange={set("name")} required />
        <F label="Telefone" value={form.phone} onChange={set("phone")} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <F label="E-mail" value={form.email} onChange={set("email")} />
        <F label="Cidade" value={form.city} onChange={set("city")} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <F label="Bairro" value={form.neighborhood} onChange={set("neighborhood")} />
        <div>
          <label className="text-sm text-slate-600">Finalidade</label>
          <select value={form.propertyPurpose} onChange={(e) => set("propertyPurpose")(e.target.value)}
            className="w-full mt-1 border rounded-lg px-3 py-2 text-sm">
            <option value="SALE">Venda</option><option value="RENT">Aluguel</option>
          </select>
        </div>
      </div>
      <F label="Valor desejado" value={form.desiredValue} onChange={set("desiredValue")} type="number" />
      <div>
        <label className="text-sm text-slate-600">Observações</label>
        <textarea value={form.observations} onChange={(e) => set("observations")(e.target.value)} rows={3}
          className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
      </div>
      <button type="submit" disabled={loading} className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm">
        {loading ? "Salvando..." : isEdit ? "Salvar" : "Cadastrar"}
      </button>
    </form>
  );
}

function F({ label, value, onChange, type = "text", required }: any) {
  return (
    <div>
      <label className="text-sm text-slate-600">{label}</label>
      <input type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
    </div>
  );
}
