import { createOrdersEventStream } from "~/server/realtime";

export const GET = () => {
  return createOrdersEventStream();
};
