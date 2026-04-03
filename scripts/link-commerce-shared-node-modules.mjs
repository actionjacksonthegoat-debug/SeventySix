import { lstat, rm, symlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** @type {Readonly<Record<string, string>>} */
const APP_DIRECTORY_BY_NAME =
{
  sveltekit: "seventysixcommerce-sveltekit",
  tanstack: "seventysixcommerce-tanstack"
};

/**
 * Retrieves the app argument from the current process arguments.
 * @returns {string}
 */
function getAppArgument()
{
  const appFlagIndex = process.argv.indexOf("--app");
  if (appFlagIndex === -1 || appFlagIndex + 1 >= process.argv.length)
  {
    throw new Error("Missing required argument: --app <sveltekit|tanstack>");
  }

  return process.argv[appFlagIndex + 1].trim().toLowerCase();
}

/**
 * Returns the repository root directory for this script.
 * @returns {string}
 */
function getRepositoryRoot()
{
  const scriptFilePath = fileURLToPath(import.meta.url);
  const scriptsDirectory = dirname(scriptFilePath);
  return resolve(scriptsDirectory, "..");
}

/**
 * Creates a shared node_modules symlink/junction targeting the selected app node_modules.
 * @returns {Promise<void>}
 */
async function linkSharedNodeModules()
{
  const selectedApp = getAppArgument();
  const appDirectoryName = APP_DIRECTORY_BY_NAME[selectedApp];

  if (!appDirectoryName)
  {
    throw new Error(`Unsupported app '${selectedApp}'. Expected one of: ${Object.keys(APP_DIRECTORY_BY_NAME).join(", ")}`);
  }

  const repositoryRoot = getRepositoryRoot();
  const ecommerceRoot = join(repositoryRoot, "ECommerce");
  const appNodeModulesPath = join(ecommerceRoot, appDirectoryName, "node_modules");
  const sharedNodeModulesPath = join(ecommerceRoot, "seventysixcommerce-shared", "node_modules");

  await lstat(appNodeModulesPath);

  await rm(
    sharedNodeModulesPath,
    {
      force: true,
      recursive: true
    }
  );

  const linkType = process.platform === "win32" ? "junction" : "dir";
  await symlink(appNodeModulesPath, sharedNodeModulesPath, linkType);

  console.log(`Linked ${sharedNodeModulesPath} -> ${appNodeModulesPath}`);
}

await linkSharedNodeModules();