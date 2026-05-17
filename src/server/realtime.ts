type OrdersSubscriber = {
  id: number;
  enqueue: (payload: string) => void;
};

const ordersSubscribers = new Set<OrdersSubscriber>();
let subscriberId = 1;

function formatSseEvent(event: string, data: string) {
  return `event: ${event}\ndata: ${data}\n\n`;
}

export function publishOrdersUpdated(payload?: Record<string, unknown>) {
  const message = formatSseEvent(
    "orders-updated",
    JSON.stringify({
      at: new Date().toISOString(),
      ...(payload ?? {}),
    }),
  );

  for (const subscriber of ordersSubscribers) {
    subscriber.enqueue(message);
  }
}

export function createOrdersEventStream() {
  const encoder = new TextEncoder();
  let currentSubscriber: OrdersSubscriber | null = null;
  let keepAlive: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      currentSubscriber = {
        id: subscriberId++,
        enqueue(payload) {
          controller.enqueue(encoder.encode(payload));
        },
      };

      ordersSubscribers.add(currentSubscriber);
      controller.enqueue(
        encoder.encode(
          formatSseEvent("connected", JSON.stringify({ ok: true })),
        ),
      );

      keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 20000);
    },
    cancel() {
      if (keepAlive) {
        clearInterval(keepAlive);
        keepAlive = null;
      }
      if (currentSubscriber) {
        ordersSubscribers.delete(currentSubscriber);
        currentSubscriber = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
