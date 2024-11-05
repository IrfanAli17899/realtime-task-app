import React, { ReactNode } from "react";
import { Layout as AntLayout } from "antd";
import TopBar from "./components/top-bar";
import Content from "./components/content";
import { getUser } from "@/actions";
import { signOut } from "@/libs";

type LayoutProps = {
  children: ReactNode;
};

async function Layout(props: LayoutProps) {
  const { children } = props;
  const user = await getUser();
  return (
    <AntLayout className="h-full bg-white">
      {!!user && (
        <TopBar
          signOut={async () => {
            "use server";
            await signOut();
          }}
          user={user}
        />
      )}
      <Content>{children}</Content>
    </AntLayout>
  );
}

export default Layout;
