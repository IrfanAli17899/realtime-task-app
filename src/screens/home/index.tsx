"use client";
import React, { useEffect, useRef, useState } from "react";
import TasksTable from "./components/tasks-table";
import { Button, Input, Select, Space } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import CreateTaskDrawer, {
  CreateTaskDrawerRef,
} from "./components/create-task-drawer";
import { fetchUsers, getTasks, removeTask } from "@/store";
import { deleteTaskAction, Tasks } from "@/actions";
import { useAppDispatch, useAppSelector, useDebounce } from "@/hooks";
import { TaskStatus } from "@prisma/client";

function HomeScreen() {
  const createTaskDrawer = useRef<CreateTaskDrawerRef>(null);

  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus>();
  const [createdBy, setCreatedBy] = useState<string>();
  const tasks = useAppSelector((state) => state.tasks.data);
  const loading = useAppSelector((state) => state.tasks.loading);
  const users = useAppSelector((state) => state.users.data);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    dispatch(fetchUsers());
  }, []);

  useEffect(() => {
    dispatch(getTasks({ search: debouncedSearch, status, createdBy }));
  }, [debouncedSearch, status, createdBy]);

  const handleEdit = async (task: Tasks[0]) => {
    createTaskDrawer.current?.edit(task);
  };

  const handleDelete = async (id: string) => {
    await deleteTaskAction({ id }).then(() => {
      dispatch(removeTask(id));
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="w-96"
          placeholder="Search..."
          prefix={<SearchOutlined />}
        />
        <Space>
          <Select
            className="w-40"
            value={createdBy}
            onChange={(value) => setCreatedBy(value)}
            allowClear
            placeholder="Select Creator"
            options={users.map((user) => ({
              label: user.name,
              value: user.id,
            }))}
          />
          <Select
            className="w-40"
            value={status}
            onChange={(value) => setStatus(value)}
            allowClear
            placeholder="Select Status"
            options={Object.entries(TaskStatus).map(([label, value]) => ({
              value,
              label,
            }))}
          />
          <Button
            onClick={() => createTaskDrawer.current?.open()}
            icon={<PlusOutlined />}
            type="primary"
          >
            Create
          </Button>
        </Space>
      </div>
      <TasksTable
        tasks={tasks}
        loading={loading}
        deleteTask={handleDelete}
        editTask={handleEdit}
      />
      <CreateTaskDrawer drawerRef={createTaskDrawer} />
    </div>
  );
}

export default HomeScreen;
