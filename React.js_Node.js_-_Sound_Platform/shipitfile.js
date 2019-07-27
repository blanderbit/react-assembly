'use strict';

const path = require('path');

module.exports = function(shipit) {
  require('shipit-deploy')(shipit);

  shipit.initConfig({
    default: {
      workspace: '/tmp/github-monitor',
      deployTo: '/home/soundsuit/app',
      repositoryUrl: 'git@bitbucket.org:jseberg/soundsuitnow2.git',
      ignores: ['.git', 'node_modules'],
      keepReleases: 5,
      deleteOnRollback: false,
      shallowClone: true,
      branch: 'master'
    },
    prod: {
      servers: 'soundsuit@46.101.183.117'
    }
  });

  const originalPublish = shipit.tasks['deploy:publish'].fn;

  shipit.task('deploy:publish', function(cb) {
    return cb(null);
  });

  shipit.task('deploy:install', function(cb) {
    const relativeReleasePath = path.join('releases', shipit.releaseDirname);

    const fullReleasePath = path.join(shipit.config.deployTo, 'releases', shipit.releaseDirname);

    return shipit
      .remote(`. ~/.nvm/nvm.sh && echo "NVM loaded" && cd ${fullReleasePath} && rm -rf generated/admin && rm -rf generated/electron-app && rm -rf generated/play && npm install && NODE_ENV=production npm run build`);
  });

  shipit.task('deploy:update-symlink', ['deploy:install'], originalPublish);

  shipit.task('deploy:restart', ['deploy:update-symlink'], () => {
    return shipit
      .remote('supervisorctl -c /etc/supervisor/supervisord.conf restart soundsuit');
  });

  shipit.on('deployed', () => {
    shipit.start('deploy:restart');
  });

  shipit.task('soundsuit:restart', () => {
    return shipit
      .remote('supervisorctl -c /etc/supervisor/supervisord.conf restart soundsuit');
  });

  shipit.on('rollbacked', () => {
    shipit.start('soundsuit:restart');
  });
};
