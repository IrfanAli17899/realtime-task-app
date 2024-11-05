"use client";
import React from "react";
import { Layout as AntLayout, Avatar, Dropdown, Space, Typography } from "antd";
import { User } from "@prisma/client";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import Image from "next/image";

type TopBarProps = {
  user: User | null;
  signOut: () => Promise<void>;
};

function TopBar(props: TopBarProps) {
  const { user, signOut } = props;
  return (
    <AntLayout.Header className="bg-transparent border-b flex justify-between items-center">
      <Space>
        <Image src="/images/logo.png" alt="logo" width={40} height={40} />
        <Typography.Title level={3}>Taskify</Typography.Title>
      </Space>
      <Dropdown
        trigger={["click"]}
        arrow
        menu={{
          className: "w-40",
          items: [
            {
              key: "sign-out",
              label: "Sign Out",
              icon: <LogoutOutlined className="text-base" />,
              onClick: signOut,
            },
          ],
        }}
      >
        <Avatar src={user?.image} alt="user-avatar" icon={<UserOutlined />} />
      </Dropdown>
    </AntLayout.Header>
  );
}

export default TopBar;
