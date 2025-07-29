---
"@apollo/client-react-streaming": patch
---

Adds a `dangerous_disableHookValueTransportation` option to `ManualDataTransport`.

If `true`, the `useStaticValueRef` hook will not transport values over to the client.
This hook is used to transport the values of hook calls during SSR to the client, to ensure that
the client will rehydrate with the exact same values as it rendered on the server.

This mechanism is in place to prevent hydration mismatches as described in
https://github.com/apollographql/apollo-client-integrations/blob/pr/RFC-2/RFC.md#challenges-of-a-client-side-cache-in-streaming-ssr
(first graph of the "Challenges of a client-side cache in streaming SSR" section).

Setting this value to `true` will save on data transported over the wire, but comes with the risk
of hydration mismatches.
Strongly discouraged with older React versions, as hydration mismatches there will likely crash
the application, setting this to `true` might be okay with React 19, which is much better at recovering
from hydration mismatches - but it still comes with a risk.
When enabling this, you should closely monitor error reporting and user feedback.
