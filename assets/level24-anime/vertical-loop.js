/** Draw a continuous vertical background with alternating mirrored tiles.
 * Source images need no matching north/south edge pixels: every junction
 * joins an edge to itself. Period = twice the drawn tile height.
 * Positive scroll moves the scenery down. Works with opaque or alpha layers.
 * Draw into a clipped gameplay viewport with its origin at (0,0).
 */
window.nv24VerticalLoop = function drawVerticalLoop(ctx, image, scroll, width, height) {
  if (!image || !image.width || !image.height) return;
  const tileH = image.height * width / image.width;
  const offset = ((scroll % (tileH * 2)) + tileH * 2) % (tileH * 2);
  const first = Math.floor(-offset / tileH);
  const last = Math.ceil((height - offset) / tileH);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, width, height); ctx.clip();
  for (let i = first; i <= last; i++) {
    const y = offset + i * tileH;
    ctx.save();
    if (((i % 2) + 2) % 2) {
      ctx.translate(0, y + tileH); ctx.scale(1, -1);
    } else ctx.translate(0, y);
    ctx.drawImage(image, 0, 0, width, tileH);
    ctx.restore();
  }
  ctx.restore();
}
