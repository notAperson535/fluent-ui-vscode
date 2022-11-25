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

	// Wallpaper

	var base64img = ""

	async function getDesktopBackground() {
		const wallPath = await wallpaper.get();

		const img = await sharp(wallPath).toBuffer()

		base64img = "data:image/png;base64," + img.toString('base64');
	}

	async function getContent(url) {
		if (/^file:/.test(url)) {
			const fp = Url.fileURLToPath(url);
			var output = await fs.promises.readFile(fp);
			output = output.toString();
			output = output.replace("dummybgurl", base64img);
			output = Buffer.from(output);
			return await output;
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

	// #### Patching ##############################################################

	async function performPatch(uuidSession) {
		let config = vscode.workspace.getConfiguration("windows-11-vscode")
		let cssfiles = [""]

		const backgroundonoroff = config.get("enableBackground")
		if (backgroundonoroff == false) {
			void 0;
		}
		else {
			await getDesktopBackground();
		}

		const colortheme = config.get("theme");

		let windows11vscodeCSS = "file:///" + (path.join(__dirname, "/windows11vscode.css")).replaceAll("\\", "/")
		let darkvars = "file:///" + (path.join(__dirname, "/darkmodevars.css")).replaceAll("\\", "/")
		let darkbluevars = "file:///" + (path.join(__dirname, "/darkbluevars.css")).replaceAll("\\", "/")
		let grayvars = "file:///" + (path.join(__dirname, "/grayvars.css")).replaceAll("\\", "/")
		let greenvars = "file:///" + (path.join(__dirname, "/greenvars.css")).replaceAll("\\", "/")
		let fuchsiavars = "file:///" + (path.join(__dirname, "/fuchsiavars.css")).replaceAll("\\", "/")

		if (colortheme == "dark") {
			cssfiles = [windows11vscodeCSS, darkvars]
		}
		else if (colortheme == "darkblue") {
			cssfiles = [windows11vscodeCSS, darkbluevars]
		}
		else if (colortheme == "gray") {
			cssfiles = [windows11vscodeCSS, grayvars]
		}
		else if (colortheme == "green") {
			cssfiles = [windows11vscodeCSS, greenvars]
		}
		else if (colortheme == "fuchsia") {
			cssfiles = [windows11vscodeCSS, fuchsiavars]
		}
		else {
			cssfiles = [windows11vscodeCSS]
		}

		let html = await fs.promises.readFile(htmlFile, "utf-8");
		html = clearExistingPatches(html);

		const injectHTML = await patchHtml(cssfiles);
		html = html.replace(/<meta.*http-equiv="Content-Security-Policy".*>/, "");

		let indicatorJS = "";

		html = html.replace(
			/(<\/head>)/,
			`<!-- !! VSCODE-CUSTOM-CSS-SESSION-ID ${uuidSession} !! -->\n` +
			"<!-- !! VSCODE-CUSTOM-CSS-START !! -->\n" +
			indicatorJS +
			injectHTML +
			"<!-- !! VSCODE-CUSTOM-CSS-END !! -->\n</head>"
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

	async function patchHtml(cssfiles) {
		let res = "";
		for (const item of cssfiles) {
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

		const fetched = await getContent(url);
		if (ext === ".css") {
			return `<style>${fetched}</style>`;
		} else if (ext === ".js") {
			return `<script>${fetched}</script>`;
		} else {
			console.log(`Unsupported extension type: ${ext}`);
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
