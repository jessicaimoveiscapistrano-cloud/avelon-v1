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
    const { destination, draggableId } = result;
    if (!destination) return;
    await fetch(`/api/leads/${draggableId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusKey: destination.droppableId }),
    });
    load();
  }

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Kanban</h1>
      <p style={{ fontSize: 13, color: "#9498a3", marginBottom: 20 }}>Arraste os cards para mudar o status</p>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {columns.map((col) => {
            const isWon = col.statusKey === "WON";
            const isLost = col.statusKey === "LOST";
            return (
              <Droppable droppableId={col.statusKey} key={col.statusKey}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      minWidth: 230,
                      flex: "none",
                      borderRadius: 13,
                      padding: 11,
                      borderTop: `3px solid ${isWon ? "#1f8f65" : isLost ? "#c2483f" : "#9498a3"}`,
                      background: snapshot.isDraggingOver ? "#e8eafc" : isWon ? "#e2f3ec" : isLost ? "#f8e6e3" : "#f1f0ea",
                      transition: "background .15s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 4px 9px" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#464a52" }}>
                        {LABELS[col.statusKey]}
                      </span>
                      <span style={{ fontSize: 11, background: "#fff", border: "1px solid #e5e2d9", padding: "1px 7px", borderRadius: 20, color: "#9498a3" }}>
                        {col.count}
                      </span>
                    </div>

                    {col.leads.map((lead: any, i: number) => (
                      <Draggable draggableId={lead.id} index={i} key={lead.id}>
                        {(dp, dsnap) => (
                          <div
                            ref={dp.innerRef}
                            {...dp.draggableProps}
                            {...dp.dragHandleProps}
                            style={{
                              background: "#fff",
                              border: "1px solid #e5e2d9",
                              borderRadius: 10,
                              padding: 11,
                              marginBottom: 8,
                              fontSize: 13,
                              boxShadow: dsnap.isDragging ? "0 4px 14px rgba(17,26,51,.15)" : "0 1px 2px rgba(17,26,51,.04)",
                            }}
                          >
                            <div style={{ fontWeight: 600 }}>{lead.name}</div>
                            <div style={{ fontSize: 11.5, color: "#9498a3", marginTop: 2 }}>{lead.city}</div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
