exports.messages = {
	admin: "Run VS Code with admin privileges so the changes can be applied.",
	enabled:
		"Fluent UI for VSCode is enabled. Restart to take effect. " +
		"If Code complains that it is corrupted, CLICK DON'T SHOW AGAIN.",
	disabled: "Fluent UI for VSCode disabled and reverted to default. Restart to take effect.",
	already_disabled: "Fluent UI for VSCode already disabled.",
	somethingWrong: "Something went wrong: ",
	restartIde: "Restart Visual Studio Code",
	notfound: "Fluent UI for VSCode not found.",
	notConfigured:
		"Fluent UI for VSCode path not configured. " +
		'Please set "vscode_custom_css.imports" in your user settings.',
	reloadAfterVersionUpgrade:
		"Detected reloading CSS / JS after VSCode is upgraded. " + "Performing application only.",
	cannotLoad: url => `Cannot load '${url}'. Skipping.`
};
