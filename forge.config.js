module.exports = {
  packagerConfig: {
    asar: true,
    icon: 'assets/icon.png',
    overwrite: true,
    ignore: [
        '.git',
        'node_modules',
        '.github',
        'test',
        'spec',
        'assets',
        'out',
        '.gitignore'
    ],
    prune: true
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        icon: 'assets/icon.ico',
        setupIcon: 'assets/setup.ico'
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        icon: 'assets/icon.icns'
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        icon: 'assets/icon.png'
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        icon: 'assets/icon.png'
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
