const scroll = new LocomotiveScroll({
  el: document.querySelector("#main"),
  smooth: true,
});

// ------- mouse MouseFollower ------- start
// var cursor = new MouseFollower();

const cursor = new MouseFollower({
  el: null,
  container: document.body,
  className: 'mf-cursor',
  innerClassName: 'mf-cursor-inner',
  textClassName: 'mf-cursor-text',
  mediaClassName: 'mf-cursor-media',
  mediaBoxClassName: 'mf-cursor-media-box',
  iconSvgClassName: 'mf-svgsprite',
  iconSvgNamePrefix: '-',
  iconSvgSrc: '',
  dataAttr: 'cursor',
  hiddenState: '-hidden',
  textState: '-text',
  iconState: '-icon',
  activeState: '-active',
  mediaState: '-media',
  stateDetection: {
    '-pointer': 'a,button',
    '-hidden': 'iframe'
  },
  visible: true,
  visibleOnState: false,
  visibleTimeout: 300, // disappear timeout
  speed: 0.55,
  ease: 'expo.out',
  overwrite: true,
  skewing: 2,
  skewingText: 1,
  skewingIcon: 2,
  skewingMedia: 2,
  skewingDelta: 0.001,
  skewingDeltaMax: 0.15,
  stickDelta: 0.15,
  showTimeout: 20,
  hideOnLeave: true,
  hideTimeout: 300,
  hideMediaTimeout: 300
});

const magnetic = new Magnetic(el, {
  y: 0.2, // horizontal delta
  x: 0.2, // vertical delta
  s: 0.2, // speed
  rs: 0.7 // release speed
});
$('[data-magnetic]').each(function () { new Magnetic(this); });

(function () {
  const btn = document.querySelectorAll('nav > .a');
  const cursor = document.querySelector('.cursor');

  const update = function (e) {
    const span = this.querySelector('span');

    if (e.type === 'mouseleave') {
      span.style.cssText = '';
    } else {
      const { offsetX: x, offsetY: y } = e,
        { offsetWidth: width, offsetHeight: height } = this,
        walk = 20,
        xWalk = x / width * (walk * 2) - walk,
        yWalk = y / height * (walk * 2) - walk;

      span.style.cssText = `transform: translate(${xWalk}px, ${yWalk}px);`;
    }
  };

  const handleCurosr = e => {
    const { clientX: x, clientY: y } = e;
    cursor.style.cssText = `left: ${x}px; top: ${y}px;`;
  };

  btn.forEach(b => b.addEventListener('mousemove', update));
  btn.forEach(b => b.addEventListener('mouseleave', update));
  window.addEventListener('mousemove', handleCurosr);
})();



// var $mouseX = 0, $mouseY = 0;
// var $xp = 0, $yp =0;

// $(document).mousemove(function(e){
//     $mouseX = e.pageX;
//     $mouseY = e.pageY;    
// });

// var $loop = setInterval(function(){
// // change 12 to alter damping higher is slower
// $xp += (($mouseX - $xp)/10);
// $yp += (($mouseY - $yp)/10);
// $(".cursor").css({left:$xp +'px', top:$yp +'px'});  
// }, 12);


// ------- mouse MouseFollower end


// ------- horizontalLoop ------- strat

function horizontalLoop(items, config) {
  items = gsap.utils.toArray(items);
  config = config || {};
  let tl = gsap.timeline({ repeat: config.repeat, paused: config.paused, defaults: { ease: "none" }, onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100) }),
    length = items.length,
    startX = items[0].offsetLeft,
    times = [],
    widths = [],
    xPercents = [],
    curIndex = 0,
    pixelsPerSecond = (config.speed || 1) * 100,
    snap = config.snap === false ? v => v : gsap.utils.snap(config.snap || 1), // some browsers shift by a pixel to accommodate flex layouts, so for example if width is 20% the first element's width might be 242px, and the next 243px, alternating back and forth. So we snap to 5 percentage points to make things look more natural
    totalWidth, curX, distanceToStart, distanceToLoop, item, i;
  gsap.set(items, { // convert "x" to "xPercent" to make things responsive, and populate the widths/xPercents Arrays to make lookups faster.
    xPercent: (i, el) => {
      let w = widths[i] = parseFloat(gsap.getProperty(el, "width", "px"));
      xPercents[i] = snap(parseFloat(gsap.getProperty(el, "x", "px")) / w * 100 + gsap.getProperty(el, "xPercent"));
      return xPercents[i];
    }
  });
  gsap.set(items, { x: 0 });
  totalWidth = items[length - 1].offsetLeft + xPercents[length - 1] / 100 * widths[length - 1] - startX + items[length - 1].offsetWidth * gsap.getProperty(items[length - 1], "scaleX") + (parseFloat(config.paddingRight) || 0);
  for (i = 0; i < length; i++) {
    item = items[i];
    curX = xPercents[i] / 100 * widths[i];
    distanceToStart = item.offsetLeft + curX - startX;
    distanceToLoop = distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");
    tl.to(item, { xPercent: snap((curX - distanceToLoop) / widths[i] * 100), duration: distanceToLoop / pixelsPerSecond }, 0)
      .fromTo(item, { xPercent: snap((curX - distanceToLoop + totalWidth) / widths[i] * 100) }, { xPercent: xPercents[i], duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond, immediateRender: false }, distanceToLoop / pixelsPerSecond)
      .add("label" + i, distanceToStart / pixelsPerSecond);
    times[i] = distanceToStart / pixelsPerSecond;
  }
  function toIndex(index, vars) {
    vars = vars || {};
    (Math.abs(index - curIndex) > length / 2) && (index += index > curIndex ? -length : length); // always go in the shortest direction
    let newIndex = gsap.utils.wrap(0, length, index),
      time = times[newIndex];
    if (time > tl.time() !== index > curIndex) { // if we're wrapping the timeline's playhead, make the proper adjustments
      vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
      time += tl.duration() * (index > curIndex ? 1 : -1);
    }
    curIndex = newIndex;
    vars.overwrite = true;
    return tl.tweenTo(time, vars);
  }
  tl.next = vars => toIndex(curIndex + 1, vars);
  tl.previous = vars => toIndex(curIndex - 1, vars);
  tl.current = () => curIndex;
  tl.toIndex = (index, vars) => toIndex(index, vars);
  tl.times = times;
  tl.progress(1, true).progress(0, true); // pre-render for performance
  if (config.reversed) {
    tl.vars.onReverseComplete();
    tl.reverse();
  }
  return tl;
}

const boxes = gsap.utils.toArray(".bigname");
const loop = horizontalLoop(boxes, { paused: false, repeat: -1 });

// ------- horizontalLoop end