import { INugetPackage } from "./interfaces";
import fs from "fs";

const packagesPath = `${process.env.HOME}/.nuget/packages`;

function getNuspecField(nuspec: string, field: string): string | undefined {
  const match = nuspec.match(new RegExp(`<${field}>(.*)</${field}>`));
  return match ? match[1] : undefined;
}

export default {
  getNugetPackagesAsync: async (): Promise<INugetPackage[]> => {
    if (!fs.existsSync(packagesPath)) return [];
    const packages: INugetPackage[] = [];
    fs.readdirSync(packagesPath).forEach((packageName) => {
      if (packageName === ".DS_Store") return;
      const pkg: INugetPackage = {
        id: packageName,
        name: packageName,
        description: "",
        tags: [],
        versions: [],
        authors: "",
      };
      let intact = false;
      fs.readdirSync(`${packagesPath}/${packageName}`).forEach((packageVersion) => {
        const nuspecPath = `${packagesPath}/${packageName}/${packageVersion}/${packageName}.nuspec`;
        if (!fs.existsSync(nuspecPath)) return;
        const nuspec = fs.readFileSync(nuspecPath, "utf8");
        pkg.versions.push(packageVersion);
        pkg.description = getNuspecField(nuspec, "description") || "";
        pkg.tags = getNuspecField(nuspec, "tags")?.split(" ") || [];
        pkg.authors = getNuspecField(nuspec, "authors") || "";

        const iconPath = `${packagesPath}/${packageName}/${packageVersion}/icon.png`;
        if (!pkg.icon && fs.existsSync(iconPath)) {
          pkg.icon = iconPath;
        }
        intact = true;
      });

      if (intact) packages.push(pkg);
    });
    return packages;
  },
};
