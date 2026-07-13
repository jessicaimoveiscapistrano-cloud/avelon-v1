"use client";
import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

const LABELS: Record<string, string> = {
  NEW: "Novo", FIRST_CONTACT: "1º Contato", IN_PROGRESS: "Em andamento",
  SCHEDULED_VISIT: "Visita agendada", VISITED: "Visitado", PROPOSAL: "Proposta",
  NEGOTIATION: "Negociação", CONTRACT: "Contrato", WON: "Convertido", LOST: "Perdido",
};

export default function KanbanBoard() {
  const [columns, setColumns] = useState<any[]>([]);

  function load() {
    fetch("/api/leads/kanban").then((r) => r.json()).then((d) => setColumns(d.columns));
  }
  useEffect(load, []);

  async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    await fetch(`/api/leads/${draggableId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusKey: destination.droppableId }),
    });
    load();
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-6">
        {columns.map((col) => (
          <Droppable droppableId={col.statusKey} key={col.statusKey}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}
                className="min-w-[260px] bg-slate-50 rounded-2xl p-3 flex-shrink-0">
                <div className="text-xs font-semibold uppercase text-slate-600 mb-2">
                  {LABELS[col.statusKey]} ({col.count})
                </div>
                {col.leads.map((lead: any, i: number) => (
                  <Draggable draggableId={lead.id} index={i} key={lead.id}>
                    {(dp) => (
                      <div ref={dp.innerRef} {...dp.draggableProps} {...dp.dragHandleProps}
                        className="bg-white rounded-xl border p-3 mb-2 text-sm">
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-xs text-slate-500">{lead.city}</p>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
