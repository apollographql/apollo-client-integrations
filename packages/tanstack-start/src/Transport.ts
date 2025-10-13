import type {
  DataTransportContext,
  QueryEvent,
} from "@apollo/client-react-streaming";

import { createSerializationAdapter } from "@tanstack/router-core";
import type { Observable } from "rxjs";
import React from "react";

interface ValueEvent {
  type: "value";
  value: unknown;
  id: string;
}

type Transported = ReadableStream<QueryEvent | ValueEvent>;

type DataTransportAbstraction =
  typeof DataTransportContext extends React.Context<infer T>
    ? NonNullable<T>
    : never;

export const transportSerializationAdapter = createSerializationAdapter<
  ServerTransport | ClientTransport,
  Transported
>({
  key: "apollo-transport",
  test(value): value is ServerTransport {
    return value instanceof ServerTransport;
  },
  toSerializable(value) {
    // TS is a bit too strict about serializability here - some values are just `unknown`, but definitely serializable
    return (value as ServerTransport).stream satisfies Transported as any;
  },
  fromSerializable(value) {
    return new ClientTransport(value);
  },
});

export class ServerTransport implements DataTransportAbstraction {
  stream: Transported;
  private controller!: ReadableStreamDefaultController<QueryEvent | ValueEvent>;
  private ongoingStreams = new Set<Extract<QueryEvent, { type: "started" }>>();

  constructor() {
    this.stream = new ReadableStream<QueryEvent | ValueEvent>({
      start: (controller) => {
        this.controller = controller;
      },
    });
  }

  private shouldClose = false;
  closeOnceFinished() {
    this.shouldClose = true;
    this.closeIfFinished();
  }
  private closed = false;
  private closeIfFinished() {
    if (this.shouldClose && this.ongoingStreams.size === 0 && !this.closed) {
      this.controller.close();
      this.closed = true;
    }
  }

  dispatchRequestStarted = ({
    event,
    observable,
  }: {
    event: Extract<QueryEvent, { type: "started" }>;
    observable: Observable<Exclude<QueryEvent, { type: "started" }>>;
  }): void => {
    this.controller.enqueue(event);
    this.ongoingStreams.add(event);
    const finalize = () => {
      this.ongoingStreams.delete(event);
      this.closeIfFinished();
    };
    observable.subscribe({
      next: (event) => {
        if (!this.closed) this.controller.enqueue(event);
      },
      error: finalize,
      complete: finalize,
    });
  };

  streamValue(id: string, value: unknown) {
    this.controller.enqueue({ type: "value", id, value });
  }

  useStaticValueRef = <T>(value: T): React.RefObject<T> => {
    const id = React.useId();
    this.streamValue(id, value);
    return React.useRef(value);
  };
}

export class ClientTransport implements DataTransportAbstraction {
  private bufferedEvents: QueryEvent[] = [];
  private receivedValues: Record<string, unknown> = {};
  constructor(incomingStream: Transported) {
    this.consume(incomingStream);
  }

  private async consume(stream: ReadableStream<QueryEvent | ValueEvent>) {
    for await (const event of stream as any as AsyncIterable<
      QueryEvent | ValueEvent
    >) {
      if (event.type === "value") {
        this.receivedValues[event.id] = event.value;
      } else {
        this.bufferedEvents.push(event);
      }
    }
    this.rerunSimulatedQueries?.();
  }

  // this will be set from the `WrapApolloProvider` data transport
  public set onQueryEvent(callback: (event: QueryEvent) => void) {
    let event: QueryEvent | undefined;
    while ((event = this.bufferedEvents.shift())) {
      callback(event);
    }
    this.bufferedEvents.push = (...events: QueryEvent[]) => {
      for (const event of events) {
        callback(event);
      }
      return 0;
    };
  }
  // this will be set from the `WrapApolloProvider` data transport
  public rerunSimulatedQueries?: () => void;

  public getStreamedValue<T>(id: string): T | undefined {
    return this.receivedValues[id] as T | undefined;
  }
  public deleteStreamedValue(id: string) {
    delete this.receivedValues[id];
  }

  useStaticValueRef = <T>(value: T): React.RefObject<T> => {
    const id = React.useId();
    const streamedValue = this.getStreamedValue<T>(id);
    const dataValue = streamedValue !== undefined ? streamedValue : value;
    React.useEffect(() => {
      this.deleteStreamedValue(id);
    }, [id]);
    return React.useRef(dataValue);
  };
}
