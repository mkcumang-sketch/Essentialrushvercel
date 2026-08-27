import React from "react";
import OrderSuccessClient from "./OrderSuccessClient";

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderSuccessClient orderId={id} />;
}