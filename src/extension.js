const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const msg = require("./messages").messages;
const uuid = require("uuid");
const fetchfetch = require("node-fetch");
const Url = require("url");
const wallpaper = require("wallpaper");
var replace = require("replace");
const messages = require("./messages").messages;
const sharp = require("sharp");

function activate(context) {
	const appDir = path.dirname(require.main.filename);
	const base = path.join(appDir, "vs", "code");
	const htmlFile = path.join(base, "electron-sandbox", "workbench", "workbench.html");
	const BackupFilePath = uuid =>
		path.join(base, "electron-sandbox", "workbench", `workbench.${uuid}.bak-custom-css`);

	async function getContent(url) {
		if (/^file:/.test(url)) {
			const fp = Url.fileURLToPath(url);
			return await fs.promises.readFile(fp);
		} else {
			const response = await fetchfetch(url);
			return response.buffer();
		}
	}

	// ####  main commands ######################################################

	async function cmdInstall() {
		const uuidSession = uuid.v4();
		await createBackup(uuidSession);
		await performPatch(uuidSession);
	}

	async function cmdReinstall() {
		await uninstallImpl();
		await cmdInstall();
	}

	async function cmdUninstall() {
		await uninstallImpl();
		disabledRestart();
	}

	async function uninstallImpl() {
		const backupUuid = await getBackupUuid(htmlFile);
		if (!backupUuid) return;
		const backupPath = BackupFilePath(backupUuid);
		await restoreBackup(backupPath);
		await deleteBackupFiles();
	}

	// #### Backup ################################################################

	async function getBackupUuid(htmlFilePath) {
		try {
			const htmlContent = await fs.promises.readFile(htmlFilePath, "utf-8");
			const m = htmlContent.match(
				/<!-- !! VSCODE-CUSTOM-CSS-SESSION-ID ([0-9a-fA-F-]+) !! -->/
			);
			if (!m) return null;
			else return m[1];
		} catch (e) {
			vscode.window.showInformationMessage(msg.somethingWrong + e);
			throw e;
		}
	}

	async function createBackup(uuidSession) {
		try {
			let html = await fs.promises.readFile(htmlFile, "utf-8");
			html = clearExistingPatches(html);
			await fs.promises.writeFile(BackupFilePath(uuidSession), html, "utf-8");
		} catch (e) {
			vscode.window.showInformationMessage(msg.admin);
			throw e;
		}
	}

	async function restoreBackup(backupFilePath) {
		try {
			if (fs.existsSync(backupFilePath)) {
				await fs.promises.unlink(htmlFile);
				await fs.promises.copyFile(backupFilePath, htmlFile);
			}
		} catch (e) {
			vscode.window.showInformationMessage(msg.admin);
			throw e;
		}
	}

	async function deleteBackupFiles() {
		const htmlDir = path.dirname(htmlFile);
		const htmlDirItems = await fs.promises.readdir(htmlDir);
		for (const item of htmlDirItems) {
			if (item.endsWith(".bak-custom-css")) {
				await fs.promises.unlink(path.join(htmlDir, item));
			}
		}
	}

	// Wallpaper

	async function getDesktopBackground() {
		try {
			const wallPath = await wallpaper.get();


			if (wallPath) {
				const img = await sharp(wallPath).toBuffer()

				var base64str = "data:image/png;base64," + img.toString('base64');

				replace({
					regex: "dummybgurl",
					replacement: base64str,
					paths: [path.join(__dirname, "/windows11vscode.css")],
					recursive: true,
					silent: true,
				});
			}

			return false;
		} catch (e) {
			vscode.window.showInformationMessage(messages.admin);
			throw e;
		}
	}

	// #### Patching ##############################################################

	async function performPatch(uuidSession) {
		let config = [""]
		getDesktopBackground();

		const colortheme = vscode.workspace.getConfiguration().get("windows-11-vscode.theme");
		if (colortheme == "dark") {
			config = ["file:///" + (path.join(__dirname, "/windows11vscode.css")).replaceAll("\\", "/"), "file:///" + (path.join(__dirname, "/darkmodevars.css")).replaceAll("\\", "/")]
		}
		else if (colortheme == "darkblue") {
			config = ["file:///" + (path.join(__dirname, "/windows11vscode.css")).replaceAll("\\", "/"), "file:///" + (path.join(__dirname, "/darkbluevars.css")).replaceAll("\\", "/")]
		}
		else if (colortheme == "gray") {
			config = ["file:///" + (path.join(__dirname, "/windows11vscode.css")).replaceAll("\\", "/"), "file:///" + (path.join(__dirname, "/grayvars.css")).replaceAll("\\", "/")]
		}
		else if (colortheme == "green") {
			config = ["file:///" + (path.join(__dirname, "/windows11vscode.css")).replaceAll("\\", "/"), "file:///" + (path.join(__dirname, "/greenvars.css")).replaceAll("\\", "/")]
		}
		else if (colortheme == "fuchsia") {
			config = ["file:///" + (path.join(__dirname, "/windows11vscode.css")).replaceAll("\\", "/"), "file:///" + (path.join(__dirname, "/fuchsiavars.css")).replaceAll("\\", "/")]
		}
		else {
			config = ["file:///" + (path.join(__dirname, "/windows11vscode.css")).replaceAll("\\", "/")]
		}

		vscode.window.showInformationMessage(config)

		let html = await fs.promises.readFile(htmlFile, "utf-8");
		html = clearExistingPatches(html);

		const injectHTML = await patchHtml(config);
		html = html.replace(/<meta.*http-equiv="Content-Security-Policy".*>/, "");

		let indicatorJS = "";

		html = html.replace(
			/(<\/html>)/,
			`<!-- !! VSCODE-CUSTOM-CSS-SESSION-ID ${uuidSession} !! -->\n` +
			"<!-- !! VSCODE-CUSTOM-CSS-START !! -->\n" +
			indicatorJS +
			injectHTML +
			"<!-- !! VSCODE-CUSTOM-CSS-END !! -->\n</html>"
		);
		try {
			await fs.promises.writeFile(htmlFile, html, "utf-8");
		} catch (e) {
			vscode.window.showInformationMessage(msg.admin);
			disabledRestart();
		}
		enabledRestart();
	}
	function clearExistingPatches(html) {
		html = html.replace(
			/<!-- !! VSCODE-CUSTOM-CSS-START !! -->[\s\S]*?<!-- !! VSCODE-CUSTOM-CSS-END !! -->\n*/,
			""
		);
		html = html.replace(/<!-- !! VSCODE-CUSTOM-CSS-SESSION-ID [\w-]+ !! -->\n*/g, "");
		return html;
	}

	function patchIsProperlyConfigured(config) {
		return config && config.imports && config.imports instanceof Array;
	}

	async function patchHtml(config) {
		let res = "";
		for (const item of config) {
			const imp = await patchHtmlForItem(item);
			if (imp) res += imp;
		}
		return res;
	}
	async function patchHtmlForItem(url) {
		if (!url) return "";
		if (typeof url !== "string") return "";

		// Copy the resource to a staging directory inside the extension dir
		let parsed = new Url.URL(url);
		const ext = path.extname(parsed.pathname);

		try {
			const fetched = await getContent(url);
			if (ext === ".css") {
				return `<style>${fetched}</style>`;
			} else if (ext === ".js") {
				return `<script>${fetched}</script>`;
			} else {
				console.log(`Unsupported extension type: ${ext}`);
			}
		} catch (e) {
			console.error(e);
			vscode.window.showWarningMessage(msg.cannotLoad(url));
			return "";
		}
	}

	function reloadWindow() {
		// reload vscode-window
		vscode.commands.executeCommand("workbench.action.reloadWindow");
	}
	function enabledRestart() {
		vscode.window
			.showInformationMessage(msg.enabled, { title: msg.restartIde })
			.then(reloadWindow);
	}
	function disabledRestart() {
		vscode.window
			.showInformationMessage(msg.disabled, { title: msg.restartIde })
			.then(reloadWindow);
	}

	const installWindows11VSCode = vscode.commands.registerCommand(
		"extension.enableWindows11VSCode",
		cmdInstall
	);
	const uninstallWindows11VSCode = vscode.commands.registerCommand(
		"extension.disableWindows11VSCode",
		cmdUninstall
	);
	const reloadWindows11VSCode = vscode.commands.registerCommand(
		"extension.reloadWindows11VSCode",
		cmdReinstall
	);

	context.subscriptions.push(installWindows11VSCode);
	context.subscriptions.push(uninstallWindows11VSCode);
	context.subscriptions.push(reloadWindows11VSCode);

	console.log("windows-11-vscode is active!");
	console.log("Application directory:", appDir);
	console.log("Main HTML file:", htmlFile);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
