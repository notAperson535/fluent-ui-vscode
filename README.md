# Windows 11 for VSCode

### SPECIAL NOTE: If Visual Studio Code complains about that it is corrupted, simply click "More" and then click "Don't show again".
### NOTE: Every time after Visual Studio Code is updated, please re-enable Windows 11.

Custom CSS to your Visual Studio Code. Based on [be5invis](https://github.com/be5invis)’s [vscode-customize-css](https://github.com/be5invis/vscode-custom-css).

## Getting Started

1. Install this extension.

2. Restart Visual Studio Code with proper permission to modify itself:

   1. **Windows**: Restart with Administrator Permission.

   2. **MacOS and Linux**: See instructions below.

3 Open the command menu (ctrl+shift+p for Windows, command+shift+p for macOS), and then run `Enable Windows 11 for VSCode`.

4. Restart VSCode.


## Enabling dark mode

If you would like to use dark mode, just add this setting in the user settings json file for VSCode

```
"fluent-ui-vscode.theme": "dark"
```

## Extension commands

As you know to access the command palette and introduce commands you can use ***F1*** (all OSes), ***Ctrl+Shift+P*** (Windows & Linux) or ***Cmd+Shift+P*** (OS X).

- ***Enable Windows 11 for VSCode***: Enables Windows 11.
- ***Disable Windows 11 for VSCode***: Disables Windows 11.
- ***Reload Windows 11 for VSCode***: Disables and then re-enables Windows 11.

## Windows users

**In Windows, make sure you run your Visual Studio Code in Administrator mode before enabling or disabling your custom style!**

## Mac and Linux users
**The extension would NOT work if Visual Studio Code cannot modify itself.** The cases include:

- Code files being read-only, like on a read-only file system or,
- Code is not started with the permissions to modify itself.

**You need to claim ownership on Visual Studio Code's installation directory, by running this command**:

```sh
sudo chown -R $(whoami) $(which code)
sudo chown -R $(whoami) /usr/share/code
```

The placeholder `<Path to Visual Studio Code>` means the path to VSCode installation. It is typically:

- `/Applications/Visual Studio Code.app/Contents/MacOS/Electron`, on MacOS;
- `/Applications/Visual Studio Code - Insiders.app/Contents/MacOS/Electron`, on MacOS when using Insiders branch;
- `/usr/share/code`, on most Linux;
- `/usr/lib/code/` or `/opt/visual-studio-code` on Arch Linux.

Mac and Linux package managers may have customized installation path. Please double check your path is correct.

# Disclaimer

This extension modifies some Visual Studio Code files so use it at your own risk.
Currently, this is not supported by the extension functionality that Visual Studio Code provides so this extension solves this issue by injecting code into:

- `electron-browser/index.html`.

The extension will keep a copy of the original file in case something goes wrong. That's what the disable command will do for you.

As this extension modifies Visual Studio Code files, it will get disabled with every Visual Studio Code update. You will have to enable it again via the command palette.

Take into account that this extension is still in beta, so you may find some bugs while playing with it. Please, report them to [the issues section of the Github's repo](https://github.com/notAperson535/fluent-ui-vscode/issues).
