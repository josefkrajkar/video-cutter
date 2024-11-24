// Components
import Layout from "~/components/Layout/Layout";
import Cutter from "~/components/Cutter/Cutter";

// Types
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Cutting room" },
    { name: "description", content: "An app for cutting videos" },
  ];
};

export default function Index() {
  return (
    <Layout>
      <Cutter />
    </Layout>
  );
}
