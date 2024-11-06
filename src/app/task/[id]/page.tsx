import { getTaskDetailAction } from "@/actions";
import TaskScreen from "@/screens/task";
import { notFound } from "next/navigation";
import React from "react";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTaskDetailAction({ id });
  
  if (!task) {
    return notFound();
  }
  return <TaskScreen task={task} />;
}
