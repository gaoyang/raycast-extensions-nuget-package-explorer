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

function parseNuGetVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
  build: number;
  suffix?: string;
  suffixNumber?: number;
} {
  const [versionPart, suffixPart] = version.split("-");
  const [major, minor, patch, build] = versionPart.split(".").map(Number);
  const [suffix, suffixNumber] = suffixPart?.split(".") || ["", "0"];
  return { major, minor, patch, build, suffix, suffixNumber: parseInt(suffixNumber) };
}

function compareNuGetVersions(versionA: string, versionB: string): number {
  const parsedVersionA = parseNuGetVersion(versionA);
  const parsedVersionB = parseNuGetVersion(versionB);

  if (parsedVersionA.major !== parsedVersionB.major) {
    return parsedVersionA.major - parsedVersionB.major;
  }
  if (parsedVersionA.minor !== parsedVersionB.minor) {
    return parsedVersionA.minor - parsedVersionB.minor;
  }
  if (parsedVersionA.patch !== parsedVersionB.patch) {
    return parsedVersionA.patch - parsedVersionB.patch;
  }
  if (parsedVersionA.build !== parsedVersionB.build) {
    return parsedVersionA.patch - parsedVersionB.patch;
  }
  if (parsedVersionA.suffix && !parsedVersionB.suffix) {
    return -1;
  }
  if (!parsedVersionA.suffix && parsedVersionB.suffix) {
    return 1;
  }
  if (parsedVersionA.suffix && parsedVersionB.suffix) {
    if (parsedVersionA.suffix !== parsedVersionB.suffix) {
      return parsedVersionA.suffix.localeCompare(parsedVersionB.suffix);
    }
    if (parsedVersionA.suffixNumber && !parsedVersionB.suffixNumber) {
      return -1;
    }
    if (!parsedVersionA.suffixNumber && parsedVersionB.suffixNumber) {
      return 1;
    }
    if (
      parsedVersionA.suffixNumber &&
      parsedVersionB.suffixNumber &&
      parsedVersionA.suffixNumber !== parsedVersionB.suffixNumber
    ) {
      return parsedVersionA.suffixNumber - parsedVersionB.suffixNumber;
    }
  }

  return 0;
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
      fs.readdirSync(`${packagesPath}/${packageId}`)
        .sort(compareNuGetVersions)
        .reverse()
        .forEach((packageVersion) => {
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
          const iconUrl = getNuspecField(nuspec, "iconUrl") ?? getNuspecField(nuspec, "icon");
          let iconPath = `${packagesPath}/${packageId}/${packageVersion}/icon.png`;
          if (!pkg.icon) {
            if (fs.existsSync(iconPath)) pkg.icon = iconPath;
            else if (iconUrl && iconUrl.startsWith("http")) {
              pkg.icon = iconUrl;
            } else if (iconUrl) {
              iconPath = `${packagesPath}/${packageId}/${packageVersion}/${iconUrl}`;
              if (fs.existsSync(iconPath)) pkg.icon = iconPath;
            }
          }

          intact = true;
        });

      if (intact) packages.push(pkg);
    });
    return packages;
  },
};
