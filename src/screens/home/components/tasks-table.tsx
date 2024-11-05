import { Tasks } from "@/actions";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  TableColumnProps,
} from "antd";
import Link from "next/link";
import React from "react";

type TasksTableProps = {
  deleteTask: (id: string) => Promise<void>;
  editTask: (id: Tasks[0]) => void;
  tasks: Tasks;
  loading: boolean;
};

function TasksTable(props: TasksTableProps) {
  const { loading, tasks, deleteTask, editTask } = props;

  return (
    <div>
      <Table
        loading={loading}
        dataSource={tasks}
        className="border overflow-hidden rounded-md truncate"
        rowKey={(item) => item.id}
        scroll={{ x: true }}
        size="middle"
        columns={TASKS_COLUMNS({ deleteTask, editTask })}
      />
    </div>
  );
}

const TASKS_COLUMNS: (props: {
  deleteTask: TasksTableProps["deleteTask"];
  editTask: TasksTableProps["editTask"];
}) => TableColumnProps<Tasks[0]>[] = ({ deleteTask, editTask }) => [
  {
    title: "Title",
    key: "title",
    dataIndex: "title",
    render: (title, { id }) => (
      <Link href={`/task/${id}`} prefetch className="capitalize">
        {title}
      </Link>
    ),
  },
  {
    title: "Creator",
    key: "user",
    dataIndex: "user",
    render: (_, { user }) => (
      <Space>
        <Avatar src={user.image} alt="user-avatar" />
        <Typography.Text>{user.name}</Typography.Text>
      </Space>
    ),
  },
  {
    title: "Assignees",
    key: "assignments",
    dataIndex: "assignments",
    render: (_, { assignments }) => (
      <Avatar.Group max={{ count: 2 }}>
        {assignments.map((assignment) => (
          <Tooltip key={assignment.id} title={assignment.user.name}>
            <Avatar src={assignment.user.image} />
          </Tooltip>
        ))}
      </Avatar.Group>
    ),
  },
  {
    title: "Status",
    key: "status",
    dataIndex: "status",
    render: (status) => (
      <Tag
        color={
          status === "COMPLETED"
            ? "green"
            : status === "IN_PROGRESS"
            ? "blue"
            : "red"
        }
      >
        {status}
      </Tag>
    ),
  },
  {
    title: "Actions",
    key: "actions",
    render: (task) => {
      return (
        <Space>
          <Button
            onClick={() => editTask(task)}
            size="middle"
            icon={<EditOutlined />}
            shape="circle"
            type="primary"
          />
          <Popconfirm
            title="Are you sure?"
            okText="Yes"
            onConfirm={() => deleteTask(task.id)}
          >
            <Button
              size="middle"
              icon={<DeleteOutlined />}
              shape="circle"
              type="primary"
              danger
            />
          </Popconfirm>
        </Space>
      );
    },
  },
];

export default TasksTable;
