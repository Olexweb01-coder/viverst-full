import { JSDOM } from 'jsdom'
import { performance as nodePerformance } from 'node:perf_hooks'

const dom = new JSDOM(
  '<!doctype html><html><head></head><body><div id="root"></div></body></html>',
  { url: 'http://localhost/', pretendToBeVisual: true },
)

const { window } = dom

/* --- APIs jsdom doesn't implement that the app relies on --- */

window.matchMedia = (q) => ({
  matches: false, media: q, onchange: null,
  addListener() {}, removeListener() {},
  addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false },
})

class Observer {
  constructor(cb) { this.cb = cb }
  observe(el) {
    // report the element as visible so whileInView / useInView actually fire
    this.cb([{ isIntersecting: true, intersectionRatio: 1, target: el,
               boundingClientRect: el.getBoundingClientRect?.() ?? {} }], this)
  }
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}
window.IntersectionObserver = Observer
window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }

window.PointerEvent = window.PointerEvent || window.MouseEvent
window.Element.prototype.setPointerCapture = function () {}
window.Element.prototype.releasePointerCapture = function () {}
window.Element.prototype.hasPointerCapture = function () { return false }
window.Element.prototype.scrollIntoView = function () {}

// give every element a non-zero box so the orbit's measure() has real numbers
window.Element.prototype.getBoundingClientRect = function () {
  return { width: 520, height: 447, top: 100, left: 100, right: 620, bottom: 547, x: 100, y: 100, toJSON() {} }
}
Object.defineProperty(window.HTMLElement.prototype, 'offsetWidth', { get: () => 168, configurable: true })
Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', { get: () => 34, configurable: true })
Object.defineProperty(window.HTMLCanvasElement.prototype, 'clientWidth', { get: () => 1280, configurable: true })
Object.defineProperty(window.HTMLCanvasElement.prototype, 'clientHeight', { get: () => 720, configurable: true })

// a real-enough 2D context, so the wave's drawing code genuinely executes
let strokeCalls = 0
window.HTMLCanvasElement.prototype.getContext = function () {
  return {
    setTransform() {}, fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {},
    stroke() { strokeCalls++ }, closePath() {}, save() {}, restore() {}, clearRect() {},
    createLinearGradient() { return { addColorStop() {} } },
    set fillStyle(_) {}, set strokeStyle(_) {}, set lineWidth(_) {},
    set lineCap(_) {}, set globalCompositeOperation(_) {},
  }
}
window.__strokeCalls = () => strokeCalls

window.document.fonts = { ready: Promise.resolve(), check: () => true, load: () => Promise.resolve() }
window.scrollTo = () => {}

/* --- publish to the node global scope --- */
const copy = [
  'window', 'document', 'navigator', 'location', 'history', 'HTMLElement', 'Element', 'Node',
  'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'PopStateEvent', 'PointerEvent',
  'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'matchMedia',
  'IntersectionObserver', 'ResizeObserver', 'SVGElement', 'DOMRect', 'CSS',
]
for (const k of copy) {
  if (window[k] === undefined) continue
  try {
    Object.defineProperty(globalThis, k, { value: window[k], writable: true, configurable: true })
  } catch {
    /* some node globals are locked down; the app doesn't need those replaced */
  }
}
globalThis.self = window
// jsdom's performance shim delegates back to the global one, so swapping it in
// recurses forever. Give the window node's native implementation instead.
Object.defineProperty(window, 'performance', {
  value: nodePerformance, writable: true, configurable: true,
})

await import('../test-dist/mount.js')

// let the animation loops run a while, then confirm the canvas was really painted
await new Promise((r) => setTimeout(r, 90000))
console.log(` canvas stroke calls during the run: ${window.__strokeCalls()}`)
if (window.__strokeCalls() === 0) {
  console.log('  ✗ the wave field never painted')
  process.exitCode = 1
}
process.exit(process.exitCode ?? 0)
