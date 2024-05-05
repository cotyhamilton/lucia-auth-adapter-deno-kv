# lucia auth adapter deno kv

compatible with `npm:lucia@3`

## usage

```sh
deno add @cotyhamilton/lucia-adapter-denokv
```

```ts
import { Lucia } from "npm:lucia@3";
import { DenoKVAdapter } from "@cotyhamilton/lucia-adapter-denokv";

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
