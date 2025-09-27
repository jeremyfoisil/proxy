// netlify/functions/tiles.js
exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const { layer, z, x, y } = params;

    if (!layer || !z || !x || !y) {
      return { statusCode: 400, body: "Missing path params" };
    }

    // Optionnel: restreindre à ton site GitHub Pages
    const referer = event.headers.referer || "";
    const allowed = [
      "https://jeremyfoisil.github.io"
    ].filter(Boolean);
    if (allowed.length && !allowed.some(url => referer.startsWith(url))) {
      return { statusCode: 403, body: "Forbidden" };
    }

    const token = process.env.KERMAP_TOKEN;
    if (!token) {
      return { statusCode: 500, body: "Token not configured" };
    }

    const upstream = `https://prod-data.nimbo.earth/mapcache/tms/1.0.0/${encodeURIComponent(layer)}@EPSG:3857@png/${z}/${x}/${y}.png?kermap_token=${token}`;

    const r = await fetch(upstream);
    if (!r.ok) {
      return { statusCode: r.status, body: `Upstream error ${r.status}` };
    }

    const buf = Buffer.from(await r.arrayBuffer());

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
        "Access-Control-Allow-Origin": "*"
      },
      isBase64Encoded: true,
      body: buf.toString("base64")
    };
  } catch (e) {
    return { statusCode: 500, body: `Proxy error: ${e.message}` };
  }
};
