import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs";
import path from "path";

type Path = string;

interface TArgs {
  directory: string;
  all?: boolean;
  individual?: boolean;
  file_path?: string;
}

/**
 *
 * Gets all the file paths in a directory.
 * @param dir The directory to search.
 * @returns An array of file paths.
 *
 * */
function getAllFiles(dir: Path): Path[] {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  let filePaths: string[] = [];

  dirents.forEach((dirent) => {
    if (dirent.isDirectory()) {
      filePaths = filePaths.concat(getAllFiles(path.join(dir, dirent.name)));
    } else {
      filePaths.push(path.join(dir, dirent.name));
    }
  });

  return filePaths;
}

/**
 * Creates an empty report file in the same directory as the source file.
 * @param sourceFile
 * @returns The path to the newly created report file.
 */
function createEmptyReport(sourceFile: Path): Path | null {
  try {
    const dir = path.dirname(sourceFile);
    const baseName = path.basename(sourceFile, path.extname(sourceFile));
    const reportFile = path.join(dir, `${baseName}.report.txt`);
    const report = "";
    writeReport(report, reportFile);
    return reportFile;
  } catch (err) {
    console.error("tiratana: failed to create an empty report. ", err);
    return null;
  }
}

/**
 * Writes the report to a file.
 * @param report The report to write.
 * @param reportFile The file to write the report to.
 */
function writeReport(report: string, reportFile: Path): void {
  try {
    // NOTE: although this is just an abstraction over one function call,
    // we want to have custom logic in here for future
    // things like templating and file formats, etc.
    if (!report) {
      console.error("tiratana: no report supplied. ");
      return;
    }

    fs.writeFileSync(reportFile, report);
  } catch (err) {
    console.error("tiratana: failed to create an empty report. ", err);
    return;
  }
}

/*
 *
 * Generates a report of the number of files in a directory.
 * @param sourceFile The source file to generate a report for.
 * @returns void
 *
 */
function generateReport(sourceFile: Path): void {}

async function initArgs(): Promise<TArgs> {
  const argv = await yargs(hideBin(process.argv))
    .option("directory", {
      type: "string",
      demandOption: true,
      describe: "The directory to process",
    })
    .option("all", {
      type: "boolean",
      default: false,
      describe: "Process all files",
    })
    .option("individual", {
      type: "boolean",
      default: false,
      describe: "Generate individual reports",
    })
    .option("file_path", {
      type: "string",
      default: "",
      describe: "The path of a specific file to process",
    }).argv;

  return {
    directory: argv.directory as string,
    all: argv.all as boolean,
    individual: argv.individual as boolean,
    file_path: argv.file_path as string,
  };
}

/**
 *
 * @param directory The directory to process.
 * @returns void
 */
async function run(): Promise<void> {
  const args = await initArgs();

  const { directory } = args;

  if (!args.directory) {
    console.log("tiratana: no directory provided. Exiting.");
    process.exit(1);
  }
  const files = getAllFiles(args.directory);

  files.forEach((sourceFile) => {
    try {
      generateReport(sourceFile);
      const reportFile = createEmptyReport(sourceFile);
      const report = `tiratana: found ${files.length} files.`;

      if (reportFile) {
        writeReport(report, reportFile);
      }
    } catch (err) {
      console.error(`tiratana: failed to process ${sourceFile}`, err);
    }
  });

  console.log(`tiratana: processed ${files.length} files in ${directory}.`);
}
