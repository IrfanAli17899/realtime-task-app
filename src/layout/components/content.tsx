"use client";
import React, { ReactNode } from "react";
import { Layout as AntLayout } from "antd";

type ContentProps = {
  children: ReactNode;
};

function Content({ children }: ContentProps) {
  return <AntLayout.Content className="container py-5">{children}</AntLayout.Content>;
}

export default Content;
