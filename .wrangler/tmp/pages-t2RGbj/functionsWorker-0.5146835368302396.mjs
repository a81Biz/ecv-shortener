var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// core/response.ts
var json = /* @__PURE__ */ __name((data, init = {}) => new Response(JSON.stringify(data), {
  headers: { "content-type": "application/json; charset=utf-8", ...init.headers || {} },
  status: init.status ?? 200
}), "json");
var notFound = /* @__PURE__ */ __name(() => new Response("Not Found", { status: 404 }), "notFound");
var redirectNoCache = /* @__PURE__ */ __name((url, status = 302) => new Response(null, {
  status,
  headers: {
    Location: url,
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    Pragma: "no-cache",
    Expires: "0"
  }
}), "redirectNoCache");

// core/security/access.ts
function getAuthenticatedEmail(req) {
  const email = req.headers.get("Cf-Access-Authenticated-User-Email");
  return email && email.length > 0 ? email : null;
}
__name(getAuthenticatedEmail, "getAuthenticatedEmail");
function requireAccess(req) {
  const email = getAuthenticatedEmail(req);
  if (!email) throw new Response("Unauthorized", { status: 401 });
  return email;
}
__name(requireAccess, "requireAccess");

// admin/api/admin/flush.ts
var onRequestPost = /* @__PURE__ */ __name(async (ctx) => {
  requireAccess(ctx.request);
  let deleted = 0;
  let cursor = void 0;
  do {
    const page = await ctx.env.LINKS.list({ cursor });
    for (const k of page.keys) {
      await ctx.env.LINKS.delete(k.name);
      deleted++;
    }
    cursor = page.list_complete ? void 0 : page.cursor;
  } while (cursor);
  return json({ ok: true, deleted });
}, "onRequestPost");

// infra/qr/QrSvg.ts
var SIZE = 21;
var EC_LEN = 7;
var MODE_BYTE = 4;
var GF_EXP = new Array(512);
var GF_LOG = new Array(256);
(/* @__PURE__ */ __name(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 256) x ^= 285;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
}, "initGF"))();
function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[(GF_LOG[a] + GF_LOG[b]) % 255];
}
__name(gfMul, "gfMul");
function rsGeneratorPoly(deg) {
  let poly = [1];
  for (let i = 0; i < deg; i++) {
    const mult = [1, GF_EXP[i]];
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], mult[0]);
      next[j + 1] ^= gfMul(poly[j], mult[1]);
    }
    poly = next;
  }
  return poly;
}
__name(rsGeneratorPoly, "rsGeneratorPoly");
function rsEncode(data, ecLen) {
  const gen = rsGeneratorPoly(ecLen);
  const res = new Array(ecLen).fill(0);
  for (const d of data) {
    const factor = d ^ res[0];
    res.shift();
    res.push(0);
    for (let i = 0; i < gen.length; i++) {
      res[i] ^= gfMul(gen[i], factor);
    }
  }
  return res;
}
__name(rsEncode, "rsEncode");
var BitBuf = class {
  static {
    __name(this, "BitBuf");
  }
  bits = [];
  push(val, len) {
    for (let i = len - 1; i >= 0; i--) this.bits.push(val >> i & 1);
  }
  toBytes() {
    const out = [];
    for (let i = 0; i < this.bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = b << 1 | (this.bits[i + j] || 0);
      out.push(b);
    }
    return out;
  }
};
function buildDataBytes(s) {
  const enc = new TextEncoder().encode(s);
  const bb = new BitBuf();
  bb.push(MODE_BYTE, 4);
  bb.push(enc.length, 8);
  for (const b of enc) bb.push(b, 8);
  const totalDataBytes = 19;
  const neededBits = totalDataBytes * 8;
  const remain = neededBits - bb.bits.length;
  if (remain > 0) {
    const term = Math.min(4, remain);
    bb.push(0, term);
  }
  while (bb.bits.length % 8 !== 0) bb.push(0, 1);
  let data = bb.toBytes();
  while (data.length < totalDataBytes) {
    data.push(236, 17);
  }
  data = data.slice(0, totalDataBytes);
  return data;
}
__name(buildDataBytes, "buildDataBytes");
function initMatrix() {
  const m = Array.from({ length: SIZE }, () => Array(SIZE).fill(-1));
  const placeFinder = /* @__PURE__ */ __name((r, c) => {
    for (let i = -1; i <= 7; i++) {
      for (let j = -1; j <= 7; j++) {
        const rr = r + i, cc = c + j;
        if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE) continue;
        const isBorder = i === -1 || j === -1 || i === 7 || j === 7;
        const isSquare = i >= 0 && i <= 6 && j >= 0 && j <= 6;
        const isCenter = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        m[rr][cc] = isSquare ? isCenter ? 1 : isBorder ? 0 : 1 : 0;
      }
    }
  }, "placeFinder");
  placeFinder(0, 0);
  placeFinder(0, SIZE - 7);
  placeFinder(SIZE - 7, 0);
  for (let i = 8; i < SIZE - 8; i++) {
    m[6][i] = i % 2 === 0 ? 1 : 0;
    m[i][6] = i % 2 === 0 ? 1 : 0;
  }
  m[SIZE - 8][8] = 1;
  return m;
}
__name(initMatrix, "initMatrix");
function writeData(m, bytes) {
  const bits = [];
  for (const b of bytes) for (let i = 7; i >= 0; i--) bits.push(b >> i & 1);
  const isFunc = /* @__PURE__ */ __name((r, c) => m[r][c] !== -1, "isFunc");
  let dirUp = true;
  let col = SIZE - 1;
  let bi = 0;
  while (col > 0) {
    if (col === 6) col--;
    for (let i = 0; i < SIZE; i++) {
      const row = dirUp ? SIZE - 1 - i : i;
      for (let dc = 0; dc < 2; dc++) {
        const c = col - dc;
        if (isFunc(row, c)) continue;
        let v = bits[bi++] ?? 0;
        if ((row + c) % 2 === 0) v ^= 1;
        m[row][c] = v;
        if (bi >= bits.length) {
        }
      }
    }
    dirUp = !dirUp;
    col -= 2;
  }
}
__name(writeData, "writeData");
function placeFormatInfo(m) {
  const formatBits = 30660;
  for (let i = 0; i < 6; i++) m[i][8] = formatBits >> i & 1;
  m[7][8] = formatBits >> 6 & 1;
  m[8][8] = formatBits >> 7 & 1;
  m[8][7] = formatBits >> 8 & 1;
  for (let i = 9; i < 15; i++) m[8][14 - i + 9] = formatBits >> i & 1;
  for (let i = 0; i < 8; i++) m[8][SIZE - 1 - i] = formatBits >> i & 1;
  for (let i = 0; i < 7; i++) m[SIZE - 1 - i][8] = formatBits >> i & 1;
}
__name(placeFormatInfo, "placeFormatInfo");
function matrixToSvg(m, scale = 6, margin = 2) {
  const dim = (SIZE + margin * 2) * scale;
  let rects = `<rect width="${dim}" height="${dim}" fill="#fff"/>`;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (m[r][c] === 1) {
        const x = (c + margin) * scale;
        const y = (r + margin) * scale;
        rects += `<rect x="${x}" y="${y}" width="${scale}" height="${scale}" fill="#000"/>`;
      }
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges">${rects}</svg>`;
}
__name(matrixToSvg, "matrixToSvg");
function QrSvg(data) {
  const m = initMatrix();
  const dataBytes = buildDataBytes(data);
  const ecBytes = rsEncode(dataBytes, EC_LEN);
  const all = dataBytes.concat(ecBytes);
  writeData(m, all);
  placeFormatInfo(m);
  return matrixToSvg(m);
}
__name(QrSvg, "QrSvg");

// admin/api/qr/[slug].ts
var onRequestGet = /* @__PURE__ */ __name(async (ctx) => {
  requireAccess(ctx.request);
  const { slug } = ctx.params;
  const short = `https://${ctx.env.PUBLIC_HOST}/${slug}`;
  const svg = QrSvg(short);
  return new Response(svg, { headers: { "content-type": "image/svg+xml" } });
}, "onRequestGet");

// ../packages/domain/src/entities/Link.ts
var Link = class {
  constructor(props) {
    this.props = props;
  }
  static {
    __name(this, "Link");
  }
};

// ../packages/domain/src/valueObjects/Slug.ts
var Slug = class _Slug {
  constructor(value) {
    this.value = value;
  }
  static {
    __name(this, "Slug");
  }
  static REGEX = /^[A-Za-z0-9_-]{1,32}$/;
  static create(raw) {
    if (!this.REGEX.test(raw)) throw new Error("Invalid slug");
    return new _Slug(raw);
  }
};

// ../packages/domain/src/valueObjects/TargetUrl.ts
var TargetUrl = class _TargetUrl {
  constructor(value) {
    this.value = value;
  }
  static {
    __name(this, "TargetUrl");
  }
  static create(raw) {
    const normalized = raw.startsWith("http") ? raw : `https://${raw}`;
    try {
      const url = new URL(normalized);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw 0;
      return new _TargetUrl(url.toString());
    } catch {
      throw new Error("Invalid URL");
    }
  }
};

// ../packages/domain/src/usecases/CreateLink.ts
async function CreateLink(repo, input) {
  const slug = Slug.create(input.slug ?? generateShortSlug());
  const target = TargetUrl.create(input.targetUrl);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const link = new Link({
    slug: slug.value,
    targetUrl: target.value,
    active: true,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
    clickCount: 0,
    tags: input.tags ?? []
  });
  await repo.create(link);
  return link;
}
__name(CreateLink, "CreateLink");
function generateShortSlug() {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const len = 3;
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
__name(generateShortSlug, "generateShortSlug");

// ../packages/domain/src/usecases/UpdateLink.ts
async function UpdateLink(repo, input) {
  const current = await repo.get(input.slug);
  if (!current) throw new Error("Not found");
  const updated = new Link({
    ...current.props,
    targetUrl: input.targetUrl ? TargetUrl.create(input.targetUrl).value : current.props.targetUrl,
    tags: input.tags ?? current.props.tags,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  await repo.update(updated);
  return updated;
}
__name(UpdateLink, "UpdateLink");

// ../packages/domain/src/usecases/ToggleLink.ts
async function ToggleLink(repo, slug, active) {
  const link = await repo.toggle(slug, active);
  return link;
}
__name(ToggleLink, "ToggleLink");

// ../packages/domain/src/usecases/GetLink.ts
async function GetLink(repo, slug) {
  return repo.get(slug);
}
__name(GetLink, "GetLink");

// ../packages/domain/src/usecases/ListLinks.ts
async function ListLinks(repo, opts) {
  return repo.list(opts);
}
__name(ListLinks, "ListLinks");

// ../packages/domain/src/dto/LinkDTO.ts
function toDTO(link) {
  return { ...link.props };
}
__name(toDTO, "toDTO");

// ../packages/domain/src/usecases/DeleteLink.ts
async function DeleteLink(repo, slug) {
  if (!slug || !/^[a-zA-Z0-9-_]+$/.test(slug)) {
    throw new Error("Invalid slug");
  }
  const deleted = await repo.delete(slug);
  return { ok: true, deleted };
}
__name(DeleteLink, "DeleteLink");

// infra/kv/KvLinkRepository.ts
var KvLinkRepository = class {
  constructor(kv) {
    this.kv = kv;
  }
  static {
    __name(this, "KvLinkRepository");
  }
  async create(link) {
    const key = `link:${link.props.slug}`;
    const exists = await this.kv.get(key);
    if (exists) throw new Error("Slug already exists");
    await this.kv.put(key, JSON.stringify(link.props));
  }
  async get(slug) {
    const raw = await this.kv.get(`link:${slug}`);
    return raw ? new Link(JSON.parse(raw)) : null;
  }
  async update(link) {
    await this.kv.put(`link:${link.props.slug}`, JSON.stringify(link.props));
  }
  async toggle(slug, active) {
    const current = await this.get(slug);
    if (!current) throw new Error("Not found");
    const updated = new Link({ ...current.props, active, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    await this.update(updated);
    return updated;
  }
  async delete(slug) {
    const key = `link:${slug}`;
    const exists = await this.kv.get(key);
    if (!exists) return false;
    await this.kv.delete(key);
    return true;
  }
  async list(opts) {
    const MAX = opts.limit ?? 50;
    const list = await this.kv.list({ prefix: "link:" });
    const items = [];
    for (const k of list.keys) {
      const slug = k.name.replace("link:", "");
      const link = await this.get(slug);
      if (!link) continue;
      if (opts.active !== void 0 && link.props.active !== opts.active) continue;
      if (opts.search && !link.props.slug.includes(opts.search) && !link.props.targetUrl.includes(opts.search)) continue;
      if (opts.owner && link.props.createdBy !== opts.owner) continue;
      items.push(link);
      if (items.length >= MAX) break;
    }
    return { items };
  }
  async incrementClick(slug) {
    const l = await this.get(slug);
    if (!l) return;
    l.props.clickCount += 1;
    await this.update(l);
  }
  async touchLastAccess(slug, isoDate) {
    const l = await this.get(slug);
    if (!l) return;
    l.props.lastAccessAt = isoDate;
    await this.update(l);
  }
};

// admin/api/[slug]/state.ts
var onRequestPatch = /* @__PURE__ */ __name(async (ctx) => {
  requireAccess(ctx.request);
  const { slug } = ctx.params;
  const body = await ctx.request.json();
  const repo = new KvLinkRepository(ctx.env.LINKS);
  const link = await ToggleLink(repo, slug, Boolean(body.active));
  return json({ ok: true, link: toDTO(link) });
}, "onRequestPatch");

// admin/api/create.ts
var onRequestPost2 = /* @__PURE__ */ __name(async (ctx) => {
  const email = requireAccess(ctx.request);
  const body = await ctx.request.json();
  const repo = new KvLinkRepository(ctx.env.LINKS);
  try {
    const link = await CreateLink(repo, {
      slug: body.slug,
      targetUrl: body.targetUrl,
      tags: body.tags,
      createdBy: email
    });
    const short = `https://${ctx.env.PUBLIC_HOST}/${link.props.slug}`;
    return json({ ok: true, short, link: toDTO(link) });
  } catch (e) {
    if (e instanceof Error && e.message === "Slug already exists") {
      return json({ ok: false, error: "SLUG_EXISTS", message: "El slug ya existe" }, { status: 409 });
    }
    throw e;
  }
}, "onRequestPost");

// admin/api/links.ts
var onRequestGet2 = /* @__PURE__ */ __name(async (ctx) => {
  requireAccess(ctx.request);
  const url = new URL(ctx.request.url);
  const opts = {
    search: url.searchParams.get("search") ?? void 0,
    owner: url.searchParams.get("owner") ?? void 0,
    active: url.searchParams.get("active") ? url.searchParams.get("active") === "true" : void 0,
    cursor: url.searchParams.get("cursor") ?? void 0,
    limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : void 0
  };
  const repo = new KvLinkRepository(ctx.env.LINKS);
  const res = await ListLinks(repo, opts);
  return json({ items: res.items.map(toDTO), nextCursor: res.nextCursor });
}, "onRequestGet");

// admin/api/whoami.ts
var onRequestGet3 = /* @__PURE__ */ __name(async (ctx) => {
  const email = getAuthenticatedEmail(ctx.request);
  if (!email) return new Response("Unauthorized", { status: 401 });
  return json({ email });
}, "onRequestGet");

// ui/api/links.ts
var onRequestGet4 = /* @__PURE__ */ __name(async (ctx) => {
  const url = new URL(ctx.request.url);
  const opts = {
    search: url.searchParams.get("search") ?? void 0,
    owner: url.searchParams.get("owner") ?? void 0,
    active: url.searchParams.get("active") ? url.searchParams.get("active") === "true" : void 0,
    cursor: url.searchParams.get("cursor") ?? void 0,
    limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : void 0
  };
  const repo = new KvLinkRepository(ctx.env.LINKS);
  const res = await ListLinks(repo, opts);
  return json({ items: res.items.map(toDTO), nextCursor: res.nextCursor });
}, "onRequestGet");

// admin/api/[slug].ts
var onRequestGet5 = /* @__PURE__ */ __name(async (ctx) => {
  requireAccess(ctx.request);
  const { slug } = ctx.params;
  const repo = new KvLinkRepository(ctx.env.LINKS);
  const link = await GetLink(repo, slug);
  if (!link) return new Response("Not Found", { status: 404 });
  return json({ link: toDTO(link) });
}, "onRequestGet");
var onRequestPut = /* @__PURE__ */ __name(async (ctx) => {
  requireAccess(ctx.request);
  const { slug } = ctx.params;
  const body = await ctx.request.json();
  const repo = new KvLinkRepository(ctx.env.LINKS);
  const link = await UpdateLink(repo, { slug, targetUrl: body.targetUrl, tags: body.tags });
  return json({ ok: true, link: toDTO(link) });
}, "onRequestPut");
var onRequestDelete = /* @__PURE__ */ __name(async (ctx) => {
  try {
    requireAccess(ctx.request);
    const { slug } = ctx.params;
    const repo = new KvLinkRepository(ctx.env.LINKS);
    const { deleted } = await DeleteLink(repo, slug);
    if (!deleted) return json({ ok: false, error: "Not found", slug }, 404);
    return json({ ok: true, deleted: true, slug });
  } catch (err) {
    const msg = err?.message || "Unexpected error";
    const code = msg.includes("Unauthorized") ? 401 : 500;
    return json({ ok: false, error: msg }, code);
  }
}, "onRequestDelete");

// ui/api/[slug].ts
var onRequestGet6 = /* @__PURE__ */ __name(async (ctx) => {
  const { slug } = ctx.params;
  const repo = new KvLinkRepository(ctx.env.LINKS);
  const link = await GetLink(repo, slug);
  if (!link) return new Response("Not Found", { status: 404 });
  return json({ link: toDTO(link) });
}, "onRequestGet");

// public/redirect.ts
async function handlePublicRedirect(ctx, slug) {
  const repo = new KvLinkRepository(ctx.env.LINKS);
  const link = await repo.get(slug);
  if (!link || !link.props.active) return notFound();
  await Promise.all([
    repo.incrementClick(slug),
    repo.touchLastAccess(slug, (/* @__PURE__ */ new Date()).toISOString())
  ]);
  return redirectNoCache(link.props.targetUrl, 302);
}
__name(handlePublicRedirect, "handlePublicRedirect");

// [[path]].ts
var onRequest = /* @__PURE__ */ __name(async (ctx) => {
  const url = new URL(ctx.request.url);
  const path = url.pathname;
  const host = url.host.toLowerCase();
  if (path.startsWith("/assets/") || path === "/favicon.ico" || path === "/robots.txt" || path.startsWith("/icons/") || path.startsWith("/images/") || path.startsWith("/static/") || path === "/app.css") {
    return ctx.env.ASSETS.fetch(ctx.request);
  }
  if (path.startsWith("/ui/api/")) return ctx.env.ASSETS.fetch(ctx.request);
  if (host.startsWith("admin.")) {
    if (path === "/") {
      return Response.redirect(`${url.protocol}//${host}/admin/links`, 302);
    }
    return ctx.env.ASSETS.fetch(ctx.request);
  }
  if (path.startsWith("/admin/api/")) return ctx.env.ASSETS.fetch(ctx.request);
  if (path.startsWith("/admin")) return ctx.env.ASSETS.fetch(ctx.request);
  if (path === "/" || path === "/index.html") return ctx.env.ASSETS.fetch(ctx.request);
  const m = path.match(/^\/([A-Za-z0-9_-]{1,32})$/);
  if (m) return handlePublicRedirect(ctx, m[1]);
  return notFound();
}, "onRequest");

// ../.wrangler/tmp/pages-t2RGbj/functionsRoutes-0.6226420228633474.mjs
var routes = [
  {
    routePath: "/admin/api/admin/flush",
    mountPath: "/admin/api/admin",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/admin/api/qr/:slug",
    mountPath: "/admin/api/qr",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/admin/api/:slug/state",
    mountPath: "/admin/api/:slug",
    method: "PATCH",
    middlewares: [],
    modules: [onRequestPatch]
  },
  {
    routePath: "/admin/api/create",
    mountPath: "/admin/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/admin/api/links",
    mountPath: "/admin/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/admin/api/whoami",
    mountPath: "/admin/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/ui/api/links",
    mountPath: "/ui/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/admin/api/:slug",
    mountPath: "/admin/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/admin/api/:slug",
    mountPath: "/admin/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/admin/api/:slug",
    mountPath: "/admin/api",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut]
  },
  {
    routePath: "/ui/api/:slug",
    mountPath: "/ui/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/:path*",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];

// ../node_modules/.pnpm/path-to-regexp@6.3.0/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/.pnpm/wrangler@4.33.1_@cloudflare+workers-types@4.20250828.0/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../node_modules/.pnpm/wrangler@4.33.1_@cloudflare+workers-types@4.20250828.0/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/.pnpm/wrangler@4.33.1_@cloudflare+workers-types@4.20250828.0/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-6IT0Ew/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../node_modules/.pnpm/wrangler@4.33.1_@cloudflare+workers-types@4.20250828.0/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-6IT0Ew/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.5146835368302396.mjs.map
