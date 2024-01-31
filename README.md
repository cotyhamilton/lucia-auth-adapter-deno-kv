# lucia auth adapter deno kv

compatible with `npm:lucia@3`

## usage

```ts
import { Lucia } from "npm:lucia";
import { DenoKVAdapter } from "https://raw.githubusercontent.com/cotyhamilton/lucia-auth-adapter-deno-kv/main/mod.ts";

const kv = await Deno.openKv();

export const lucia = new Lucia(new DenoKVAdapter(kv), {
  getUserAttributes: (attributes) => {
    return {
      // attributes has the type of DatabaseUserAttributes
      name: attributes.name,
    };
  },
});

declare module "npm:lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  name: string;
}
```

## reference

- https://lucia-auth.com
- https://docs.deno.com/deploy/kv/manual/
