import type { BrowserContext } from '@playwright/test';
import manifest from '../../src/data/draft-region-groups.json' with { type: 'json' };
import players from '../../src/data/years/2017.json' with { type: 'json' };
import { ROLES } from '../../src/game/types';
import type { GamePlan } from '../../src/game/plan';
import type { OnlineDuelRoom } from '../../src/online/room';

type Submission = { picks: string[]; plan: GamePlan };
type Room = {
  code: string;
  host: number;
  guest: number | null;
  hostTeam: Submission | null;
  guestTeam: Submission | null;
  closed: 'cancelled' | 'expired' | null;
};

const offers = ROLES.map((role) => ({
  role,
  year: 2017,
  regionGroup: manifest.groups
    .find((entry) => entry.year === 2017)!
    .groups.find((group) => group.canonicalRegions.includes('LCK'))!.id,
  optionIds: players
    .filter((player) => player.role === role && player.region === 'LCK')
    .slice(0, 3)
    .map((player) => player.id),
}));

// This fixture models the HTTP contract only. SQL authorization remains covered
// by smoke-online-duel.sql; these tests make no claim about a remote database.
export class InvitationServer {
  private rooms = new Map<string, Room>();
  private identities = 0;
  signups = 0;
  reads = 0;
  datasetVersion = manifest.datasetVersion;
  failReads = false;
  failSubmissions = false;

  private snapshot(room: Room, user: number): OnlineDuelRoom {
    const seat = user === room.host ? 'host' : 'guest';
    const own = seat === 'host' ? room.hostTeam : room.guestTeam;
    const complete = Boolean(room.hostTeam && room.guestTeam);
    return {
      code: room.code,
      seed: '0123456789abcdef',
      datasetVersion: this.datasetVersion,
      offers,
      seat,
      state: room.closed ?? (complete ? 'complete' : room.guest ? 'drafting' : 'waiting_guest'),
      expiresAt: '2099-10-06T00:00:00Z',
      hostReady: Boolean(room.hostTeam),
      guestReady: Boolean(room.guestTeam),
      myPicks: own?.picks ?? null,
      myPlan: own?.plan ?? null,
      hostPicks: complete ? room.hostTeam!.picks : null,
      guestPicks: complete ? room.guestTeam!.picks : null,
      hostPlan: complete ? room.hostTeam!.plan : null,
      guestPlan: complete ? room.guestTeam!.plan : null,
    };
  }

  close(code: string, state: 'cancelled' | 'expired') {
    this.rooms.get(code)!.closed = state;
  }

  async attach(context: BrowserContext) {
    // Exercise HTTP failures without PWA caching. The regular suite covers the
    // worker; here the browser behaves as one without Service Worker support.
    await context.addInitScript(() => {
      Reflect.deleteProperty(Navigator.prototype, 'serviceWorker');
    });
    const user = ++this.identities;
    const subject = `00000000-0000-4000-8000-${String(user).padStart(12, '0')}`;
    const jwt =
      [
        { alg: 'HS256', typ: 'JWT' },
        { sub: subject, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 },
      ]
        .map((value) => Buffer.from(JSON.stringify(value)).toString('base64url'))
        .join('.') + '.test';
    await context.route('https://duel-tests.supabase.test/**', async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const reply = (body: unknown, status = 200) => route.fulfill({ status, json: body });
      const reject = (code: string, status = 400) =>
        reply({ code, message: 'Test RPC failure' }, status);
      if (path === '/auth/v1/signup') {
        this.signups++;
        await reply({
          access_token: jwt,
          refresh_token: `test-refresh-${user}`,
          token_type: 'bearer',
          expires_in: 3600,
          user: {
            id: subject,
            aud: 'authenticated',
            role: 'authenticated',
            is_anonymous: true,
            app_metadata: {},
            user_metadata: {},
            created_at: new Date().toISOString(),
          },
        });
        return;
      }
      if (request.headers().authorization !== `Bearer ${jwt}`) {
        await reject('42501', 403);
        return;
      }
      const rpc = path.split('/').at(-1);
      if (rpc === 'create_duel_room') {
        const code = this.rooms.size.toString(16).toUpperCase().padStart(12, 'A');
        this.rooms.set(code, {
          code,
          host: user,
          guest: null,
          hostTeam: null,
          guestTeam: null,
          closed: null,
        });
        await reply(code);
        return;
      }
      const body = request.postDataJSON() as {
        p_code: string;
        p_picks: string[];
        p_plan: GamePlan;
      };
      const room = this.rooms.get(body.p_code);
      if (!room) {
        await reject('42501', 403);
        return;
      }
      if (rpc === 'join_duel_room') {
        if (room.closed) {
          await reject('22023');
          return;
        }
        if (room.host !== user && room.guest !== user) {
          if (room.guest !== null) {
            await reject('42501', 403);
            return;
          }
          room.guest = user;
        }
      }
      if (room.host !== user && room.guest !== user) {
        await reject('42501', 403);
        return;
      }
      if (rpc === 'get_duel_room') {
        this.reads++;
        if (this.failReads) {
          await reject('unavailable', 503);
          return;
        }
      } else if (rpc === 'submit_duel_team') {
        if (this.failSubmissions) {
          await reject('unavailable', 503);
          return;
        }
        if (
          room.closed ||
          !body.p_picks?.every((id, index) => offers[index]?.optionIds.includes(id)) ||
          body.p_picks.length !== 5
        ) {
          await reject('22023');
          return;
        }
        const key = room.host === user ? 'hostTeam' : 'guestTeam';
        const team = { picks: body.p_picks, plan: body.p_plan };
        if (room[key] && JSON.stringify(room[key]) !== JSON.stringify(team)) {
          await reject('22023');
          return;
        }
        room[key] = team;
      } else if (rpc === 'cancel_duel_room') room.closed = 'cancelled';
      else if (rpc !== 'join_duel_room') {
        await reject('unknown_rpc', 404);
        return;
      }
      await reply(this.snapshot(room, user));
    });
  }
}
