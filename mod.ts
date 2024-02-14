import type { Adapter, DatabaseSession, DatabaseUser } from "npm:lucia@3";

type Session = { id: string; userId: string; expiresAt: number };
type User = { id: string };

export class DenoKVAdapter implements Adapter {
  private kv: Deno.Kv;

  constructor(
    kv: Deno.Kv,
  ) {
    this.kv = kv;
  }

  public async getSessionAndUser(
    sessionId: string,
  ): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
    const [databaseSession, databaseUser] = await Promise.all([
      this.getSession(sessionId),
      this.getUserFromSessionId(sessionId),
    ]);
    return [databaseSession, databaseUser];
  }

  public async getUserSessions(userId: string): Promise<DatabaseSession[]> {
    const iter = this.kv.list<Session>({
      prefix: ["sessions_by_user", userId],
    });
    const sessions: Session[] = [];
    for await (const { value } of iter) {
      sessions.push(value);
    }
    return sessions.map(transformIntoDatabaseSession);
  }

  public async setSession(session: DatabaseSession): Promise<void> {
    const primaryKey = ["sessions", session.id];
    const byUserKey = ["sessions_by_user", session.userId, session.id];
    const expireIn = session.expiresAt.getTime() - Date.now();
    await this.kv.atomic()
      .check({ key: primaryKey, versionstamp: null })
      .check({ key: byUserKey, versionstamp: null })
      .set(primaryKey, { ...session, expiresAt: session.expiresAt.getTime() }, {
        expireIn,
      })
      .set(byUserKey, { ...session, expiresAt: session.expiresAt.getTime() }, {
        expireIn,
      })
      .commit();
  }

  public async updateSessionExpiration(
    sessionId: string,
    expiresAt: Date,
  ): Promise<void> {
    const res = await this.kv.get<Session>(["sessions", sessionId]);
    if (res.value) {
      const session = { ...res.value, expiresAt: expiresAt.getTime() };
      const expireIn = expiresAt.getTime() - Date.now();
      await this.kv.atomic()
        .set(["sessions", sessionId], session, { expireIn })
        .set(["sessions_by_user", session.userId, sessionId], session, {
          expireIn,
        })
        .commit();
    }
  }

  public async deleteSession(sessionId: string): Promise<void> {
    const res = await this.kv.get<Session>(["sessions", sessionId]);
    if (res.value) {
      await this.kv.atomic()
        .delete(["sessions", sessionId])
        .delete(["sessions_by_user", res.value.userId, sessionId])
        .commit();
    }
  }

  public async deleteUserSessions(userId: string): Promise<void> {
    const iter = this.kv.list<Session>({
      prefix: ["sessions_by_user", userId],
    });
    for await (const res of iter) {
      await this.kv.atomic()
        .delete(["sessions", res.value.id])
        .delete(["sessions_by_user", res.value.userId, res.value.id])
        .commit();
    }
  }

  // handled by key expiration
  public async deleteExpiredSessions(): Promise<void> {
  }

  private async getSession(sessionId: string): Promise<DatabaseSession | null> {
    const result = (await this.kv.get<Session>(["sessions", sessionId])).value;
    if (!result) return null;
    return transformIntoDatabaseSession(result);
  }

  private async getUserFromSessionId(
    sessionId: string,
  ): Promise<DatabaseUser | null> {
    const session =
      (await this.kv.get<DatabaseSession>(["sessions", sessionId])).value;
    if (!session) {
      return null;
    }
    const result = (await this.kv.get<User>(["users", session.userId])).value;
    if (!result) return null;
    return transformIntoDatabaseUser(result);
  }
}

function transformIntoDatabaseSession(raw: Session): DatabaseSession {
  const { id, userId, expiresAt, ...attributes } = raw;
  return {
    userId,
    id,
    expiresAt: new Date(expiresAt),
    attributes,
  };
}

function transformIntoDatabaseUser(raw: User): DatabaseUser {
  const { id, ...attributes } = raw;
  return {
    id,
    attributes,
  };
}
