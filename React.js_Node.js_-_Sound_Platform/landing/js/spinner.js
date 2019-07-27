const throttle = require('lodash/throttle');
const $ = require('jquery');

function initProgressBar() {
  const bars = Array.from(document.getElementsByClassName('js-progress-circle'))
    .map((cont) => {
      const bar = new window.ProgressBar.Circle(cont, {
        strokeWidth: 6,
        easing: 'easeInOut',
        duration: 2500,
        color: '#3cb6b6',
        trailColor: '#cacaca',
        trailWidth: 6,
        svgStyle: null,
        step: (state, circle) => {
          const value = Math.round(circle.value() * 100);
          if (value === 0) {
            circle.setText('');
          } else {
            circle.setText(`${value}%`);
          }
        }
      });

      bar.path.style.strokeLinecap = 'round';

      const dst = parseInt(cont.dataset.dst || '100', 10) / 100;

      return { bar, dst };
    });

  const animateBars = () => {
    bars.forEach((el) => {
      el.bar.animate(el.dst);
    });
  };

  const $firstBar = $(document.getElementsByClassName('js-progress-circle')[0]);

  if (!$firstBar.length) return;

  const checkIfShouldAnimate = () => {
    const top = $firstBar.offset().top;
    const hH = $firstBar.outerHeight();
    const wH = $(window).height();
    const wS = $(window).scrollTop();

    if (wS > (top + hH - wH)) {
      return true;
    }
    return false;
  };

  const animate = () => {
    animateBars();
    $('.progress-circle').animate({ opacity: 1 }, 100);
  };

  if (checkIfShouldAnimate()) {
    animate();
    return;
  }

  const onScroll = throttle(() => {
    if (checkIfShouldAnimate()) {
      animate();
      document.removeEventListener('scroll', onScroll);
    }
  }, 300);

  document.addEventListener('scroll', onScroll, false);
}

export default initProgressBar;
