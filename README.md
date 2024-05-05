# lucia auth adapter deno kv

compatible with `npm:lucia@3`

example implementation: https://github.com/cotyhamilton/deno-auth-lucia

## usage

```sh
deno add @cotyhamilton/lucia-adapter-denokv
deno add npm:lucia@3
```

```ts
import { Lucia } from "lucia";
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

declare module "lucia" {
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
