<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@apollo/client-react-streaming](./client-react-streaming.md) &gt; [readFromReadableStream](./client-react-streaming.readfromreadablestream.md)

## readFromReadableStream() function

Apply to a context that will be passed to a link chain containing `ReadFromReadableStreamLink`<!-- -->.

**Signature:**

```typescript
declare function readFromReadableStream<T extends Record<string, any>>(readableStream: ReadableStream<ReadableStreamLinkEvent>, context: T): T & InternalContext$1;
```

## Parameters

<table><thead><tr><th>

Parameter


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

readableStream


</td><td>

ReadableStream&lt;ReadableStreamLinkEvent&gt;


</td><td>


</td></tr>
<tr><td>

context


</td><td>

T


</td><td>


</td></tr>
</tbody></table>
**Returns:**

T &amp; InternalContext$1

