import backImage from './backImage/backImage';
import passwordCheck from './passwordCheck/passwordCheck';
import volumeSlider from './volumeSlider/volumeSlider';

export default angular.module('app.directives', [
  backImage.name,
  passwordCheck.name,
  volumeSlider.name
]);
