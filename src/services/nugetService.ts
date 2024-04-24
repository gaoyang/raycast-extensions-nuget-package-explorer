import { INugetPackage } from "./interfaces";
import fs from "fs";

const packagesPath = `${process.env.HOME}/.nuget/packages`;

function getNuspecField(nuspec: string, field: string): string | undefined {
  const match = nuspec.match(new RegExp(`<${field}>(.*)</${field}>`));
  return match ? match[1] : undefined;
}

function getNuspecAttr(nuspec: string, field: string, attr: string): string | undefined {
  const match = nuspec.match(new RegExp(`<${field} .* ${attr}="([^"]*)"`));
  return match ? match[1] : undefined;
}

export default {
  getNugetPackagesAsync: async (): Promise<INugetPackage[]> => {
    if (!fs.existsSync(packagesPath)) return [];
    const packages: INugetPackage[] = [];
    fs.readdirSync(packagesPath).forEach((packageId) => {
      if (packageId === ".DS_Store") return;
      const pkg: INugetPackage = {
        id: packageId,
        name: packageId,
        path: `${packagesPath}/${packageId}`,
        versions: [],
      };
      let intact = false;
      fs.readdirSync(`${packagesPath}/${packageId}`).forEach((packageVersion) => {
        const nuspecPath = `${packagesPath}/${packageId}/${packageVersion}/${packageId}.nuspec`;
        if (!fs.existsSync(nuspecPath)) return;
        const nuspec = fs.readFileSync(nuspecPath, "utf8");
        pkg.versions.push(packageVersion);
        pkg.name = getNuspecField(nuspec, "id") || packageId;
        pkg.description = getNuspecField(nuspec, "description");
        pkg.tags = getNuspecField(nuspec, "tags");
        pkg.authors = getNuspecField(nuspec, "authors");
        pkg.owners = getNuspecField(nuspec, "owners");
        if (pkg.owners === pkg.authors) delete pkg.owners;
        pkg.projectUrl = getNuspecField(nuspec, "projectUrl");
        pkg.licenseUrl = getNuspecField(nuspec, "licenseUrl");
        pkg.repositoryUrl = getNuspecAttr(nuspec, "repository", "url");
        const iconUrl = getNuspecField(nuspec, "iconUrl");
        if (iconUrl) {
          if (iconUrl.startsWith("http")) pkg.icon = iconUrl;
          else {
            const iconPath = `${packagesPath}/${packageId}/${packageVersion}/{iconUrl}`;
            if (!pkg.icon && fs.existsSync(iconPath)) {
              pkg.icon = iconPath;
            }
          }
        }

        intact = true;
      });

      if (intact) packages.push(pkg);
    });
    return packages;
  },
};
