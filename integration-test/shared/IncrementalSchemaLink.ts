import { ApolloLink, Observable } from "@apollo/client";
import type { SchemaLink } from "@apollo/client/link/schema";
import { experimentalExecuteIncrementally, validate } from "graphql";

export class IncrementalSchemaLink extends ApolloLink {
  public schema: SchemaLink.Options["schema"];
  public rootValue: SchemaLink.Options["rootValue"];
  public context: SchemaLink.Options["context"];
  public validate: boolean;

  constructor(options: SchemaLink.Options) {
    super();
    this.schema = options.schema;
    this.rootValue = options.rootValue;
    this.context = options.context;
    this.validate = !!options.validate;
  }

  public request(
    operation: ApolloLink.Operation
  ): Observable<ApolloLink.Result> {
    return new Observable<ApolloLink.Result>((observer) => {
      (async () => {
        try {
          const context = await (typeof this.context === "function"
            ? this.context(operation)
            : this.context);
          if (this.validate) {
            const validationErrors = validate(this.schema, operation.query);
            if (validationErrors.length > 0) {
              return { errors: validationErrors };
            }
          }

          if (observer.closed) return;
          const data = await experimentalExecuteIncrementally({
            schema: this.schema,
            document: operation.query,
            rootValue: this.rootValue,
            contextValue: context,
            variableValues: operation.variables,
            operationName: operation.operationName,
          });

          if ("initialResult" in data) {
            if (observer.closed) return;
            observer.next(data.initialResult);

            for await (const value of data.subsequentResults) {
              if (observer.closed) return;
              observer.next(value);
            }

            if (observer.closed) return;
            observer.complete();
          } else {
            if (observer.closed) return;

            observer.next(data);
            observer.complete();
          }
        } catch (error) {
          if (observer.closed) return;

          observer.error(error);
        }
      })();
    });
  }
}
