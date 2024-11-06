import {
  createTaskAction,
  CreateTaskInput,
  Tasks,
  updateTaskAction,
} from "@/actions";
import { useAppDispatch, useAppSelector, useSocket } from "@/hooks";
import { addTask, fetchUsers, updateTask } from "@/store";
import {TaskStatus } from "@prisma/client";
import { Button, Drawer, Form, Input, Select } from "antd";
import React, {
  RefObject,
  useEffect,
  useImperativeHandle,
  useState,
  useTransition,
} from "react";

export type CreateTaskDrawerRef = {
  open: () => void;
  edit: (id: Tasks[0]) => void;
};

type CreateTaskDrawerProps = {
  drawerRef: RefObject<CreateTaskDrawerRef>;
};

function CreateTaskDrawer({ drawerRef }: CreateTaskDrawerProps) {
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.users.data);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const [loading, startLoading] = useTransition();

  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (socket && isConnected) {
      const handleCreateTask = (task: Tasks[0]) => dispatch(addTask(task));
      const handleUpdateTask = (task: Tasks[0]) => dispatch(updateTask(task));

      socket.on("task:created", handleCreateTask);
      socket.on("task:updated", handleUpdateTask);
      return () => {
        socket.off("task:created", handleCreateTask);
        socket.off("task:updated", handleUpdateTask);
      };
    }
  }, [socket, isConnected]);

  useEffect(() => {
    dispatch(fetchUsers());
  }, []);

  useImperativeHandle(
    drawerRef,
    () => ({
      open: () => setOpen(true),
      edit: (task) => {
        setEditId(task.id);
        form.setFieldsValue(task);
        setOpen(true);
      },
    }),
    []
  );

  const onClose = () => {
    setEditId(null);
    form.resetFields();
    setOpen(false);
  };

  const onFinish = (v: CreateTaskInput) => {
    startLoading(async () => {
      if (editId) {
        const task = await updateTaskAction({ id: editId, ...v });
        socket?.emit("task:updated", task);
      } else {
        const task = await createTaskAction(v);
        socket?.emit("task:created", task);
      }
      onClose();
    });
  };

  return (
    <Drawer open={open} onClose={onClose} title="Create Task">
      <Form className="flex flex-col h-full" form={form} onFinish={onFinish}>
        <Form.Item name="title" rules={[{ required: true }]}>
          <Input placeholder="Title" />
        </Form.Item>
        {/* <Form.Item name="description">
          <Input.TextArea placeholder="Description" />
        </Form.Item> */}
        <Form.Item name="status">
          <Select
            placeholder="Select Status"
            options={Object.entries(TaskStatus).map(([label, value]) => ({
              value,
              label,
            }))}
          />
        </Form.Item>
        {!editId && (
          <Form.Item name="assignments">
            <Select
              mode="multiple"
              placeholder="Select Assignment"
              options={users.map((user) => ({
                label: user.name,
                value: user.id,
              }))}
            />
          </Form.Item>
        )}
        <div className="flex-1" />
        <Form.Item>
          <Button loading={loading} block htmlType="submit" type="primary">
            {editId ? "Update" : "Create"}
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  );
}

export default CreateTaskDrawer;
