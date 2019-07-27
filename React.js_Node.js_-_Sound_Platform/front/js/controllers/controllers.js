import BusinessTypeSelector from './BusinessTypeSelector';
import ChangePasswordModal from './ChangePasswordModal';
import CustomerAgeSelector from './CustomerAgeSelector';
import Login from './Login';
import MusicFlavorSelector from './MusicFlavorSelector';
import MusicStyleSelector from './MusicStyleSelector';
import Register from './Register';
import Subscribe from './Subscribe';

export default angular.module('app.controllers', [])
  .controller('BusinessTypeCtrl', BusinessTypeSelector)
  .controller('ChangePasswordModalCtrl', ChangePasswordModal)
  .controller('CustomerAgeCtrl', CustomerAgeSelector)
  .controller('LoginCtl', Login)
  .controller('MusicFlavorCtrl', MusicFlavorSelector)
  .controller('MusicStyleCtrl', MusicStyleSelector)
  .controller('RegisterCtl', Register)
  .controller('SubscribeCtl', Subscribe);
