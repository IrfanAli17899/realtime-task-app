import { signIn } from "@/libs";
import { Button, Card } from "antd";
import Title from "antd/lib/typography/Title";
import Image from "next/image";
import React from "react";

function LoginPage() {
  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-96 shadow-xl">
        <div className="flex flex-col items-center gap-2 mb-5">
          <Image
            src="/images/logo.png"
            alt="google-icon"
            height={70}
            width={70}
          />
          <Title level={3}>Login To Taskify</Title>
        </div>
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <Button
            block
            icon={
              <Image
                src="/images/google-icon.svg"
                alt="google-icon"
                height={25}
                width={25}
              />
            }
            htmlType="submit"
          >
            Signin with Google
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default LoginPage;
