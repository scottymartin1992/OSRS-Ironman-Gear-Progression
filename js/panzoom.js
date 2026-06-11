export function initPanZoom(svg, content, opts = {}) {
  const NAT_W = opts.naturalWidth ?? 13850;
  const NAT_H = opts.naturalHeight ?? 11250;

  let vbX = 0;
  let vbY = 0;
  let vbW = NAT_W;
  let vbH = NAT_H;

  const MIN_SCALE = opts.minScale ?? 0.2;
  const MAX_SCALE = opts.maxScale ?? 12;
  const ZOOM_SENS = opts.zoomSensitivity ?? 0.00055;
  const ZOOM_STEP_CAP = opts.zoomStepCap ?? 0.3;
  let PAN_DAMP = opts.panDamp ?? 0.9;
  const EDGE_PAD_PX = opts.edgePaddingPx ?? 8;

  content.classList.add("pannable");

  function applyViewBox() {
    const padX = EDGE_PAD_PX * (vbW / svg.clientWidth);
    const padY = EDGE_PAD_PX * (vbH / svg.clientHeight);

    const minX = -vbW + padX;
    const maxX = NAT_W - padX;
    const minY = -vbH + padY;
    const maxY = NAT_H - padY;

    vbX = Math.max(minX, Math.min(maxX, vbX));
    vbY = Math.max(minY, Math.min(maxY, vbY));

    svg.setAttribute("viewBox", `${vbX} ${vbY} ${vbW} ${vbH}`);
  }

  function clientToSvg(evtLike) {
    const pt = svg.createSVGPoint();
    pt.x = evtLike.clientX;
    pt.y = evtLike.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  svg.addEventListener(
    "wheel",
    (evt) => {
      evt.preventDefault();

      const p = clientToSvg(evt);

      const step = Math.max(
        -ZOOM_STEP_CAP,
        Math.min(ZOOM_STEP_CAP, -evt.deltaY * ZOOM_SENS)
      );

      const factor = Math.exp(step);

      let newW = vbW / factor;
      const minW = NAT_W / MAX_SCALE;
      const maxW = NAT_W / MIN_SCALE;

      newW = Math.max(minW, Math.min(maxW, newW));

      const newH = newW * (vbH / vbW);

      const rx = (p.x - vbX) / vbW;
      const ry = (p.y - vbY) / vbH;

      vbX = p.x - rx * newW;
      vbY = p.y - ry * newH;
      vbW = newW;
      vbH = newH;

      applyViewBox();
    },
    { passive: false }
  );

  let dragging = false;
  let sx = 0;
  let sy = 0;
  let svx = 0;
  let svy = 0;

  function isLeftMouse(evt) {
    return evt.button === 0 && evt.buttons === 1;
  }

  function startDrag(evt) {
    // Touch can still drag.
    if (evt.touches) {
      evt.preventDefault();

      dragging = true;
      content.classList.add("dragging");

      const e = evt.touches[0];

      sx = e.clientX;
      sy = e.clientY;
      svx = vbX;
      svy = vbY;

      return;
    }

    // Mouse drag ONLY starts with left button.
    if (!isLeftMouse(evt)) {
      dragging = false;
      content.classList.remove("dragging");
      return;
    }

    evt.preventDefault();

    dragging = true;
    content.classList.add("dragging");

    sx = evt.clientX;
    sy = evt.clientY;
    svx = vbX;
    svy = vbY;
  }

  function doDrag(evt) {
    if (!dragging) return;

    // If this is mouse movement and left button is no longer held, stop.
    if (!evt.touches && evt.buttons !== 1) {
      endDrag();
      return;
    }

    const e = evt.touches ? evt.touches[0] : evt;

    const pxToSvgX = vbW / svg.clientWidth;
    const pxToSvgY = vbH / svg.clientHeight;

    vbX = svx - (e.clientX - sx) * PAN_DAMP * pxToSvgX;
    vbY = svy - (e.clientY - sy) * PAN_DAMP * pxToSvgY;

    applyViewBox();
  }

  function endDrag() {
    dragging = false;
    content.classList.remove("dragging");
  }

  content.addEventListener("mousedown", startDrag);
  window.addEventListener("mousemove", doDrag);
  window.addEventListener("mouseup", endDrag);

  content.addEventListener("touchstart", startDrag, { passive: false });
  window.addEventListener("touchmove", doDrag, { passive: false });
  window.addEventListener("touchend", endDrag);

  content.addEventListener("contextmenu", () => {
    endDrag();
  });

  window.addEventListener("resize", applyViewBox);

  function resetView() {
    vbX = 0;
    vbY = 0;
    vbW = NAT_W;
    vbH = NAT_H;
    applyViewBox();
  }

  resetView();

  return {
    resetView,
    applyViewBox,
    setPanDamp(value) {
      PAN_DAMP = value;
    },
  };
}