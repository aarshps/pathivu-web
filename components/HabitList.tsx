"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { type Habit } from "@/lib/habit";
import { HabitRow } from "./HabitRow";
import { haptics } from "@/lib/haptics";

/** Reorderable list of habit cards. Persists new order via `onReorder`. */
export function HabitList({
  habits,
  onToggle,
  onTap,
  onReorder,
}: {
  habits: Habit[];
  onToggle: (h: Habit) => void;
  onTap: (h: Habit) => void;
  onReorder: (orderedIds: string[]) => void;
}) {
  // Local order for snappy drag; resynced when the upstream list changes.
  const [order, setOrder] = useState(habits);
  useEffect(() => setOrder(habits), [habits]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((h) => h.id === active.id);
    const newIndex = order.findIndex((h) => h.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    haptics.click();
    onReorder(next.map((h) => h.id!));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order.map((h) => h.id!)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2.5">
          {order.map((h) => (
            <HabitRow key={h.id} habit={h} onToggle={() => onToggle(h)} onTap={() => onTap(h)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
