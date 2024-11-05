"use client";
import { store } from "@/store";
import React, { ReactNode } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";

type ProvidersProps = {
  children: ReactNode;
};

function Providers(props: ProvidersProps) {
  const { children } = props;
  return (
    <ReduxProvider store={store}>
      <AntdRegistry>
        <ConfigProvider
          componentSize="large"
          theme={{ token: { borderRadius: 4 } }}
        >
          {children}
        </ConfigProvider>
      </AntdRegistry>
    </ReduxProvider>
  );
}

export default Providers;
