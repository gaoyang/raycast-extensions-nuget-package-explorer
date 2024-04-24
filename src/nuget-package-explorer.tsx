import { Action, ActionPanel, List, open } from "@raycast/api";
import { useEffect, useState } from "react";
import nugetService from "./services/nugetService";
import { INugetPackage } from "./services/interfaces";

export default function Command() {
  const [nugetPackages, setNugetPackages] = useState<INugetPackage[]>([]);

  useEffect(() => {
    nugetService.getNugetPackagesAsync().then((packages) => {
      setNugetPackages(packages);
    });
  }, []);

  return (
    <List isShowingDetail searchBarPlaceholder="Search Nuget package">
      {nugetPackages.map((item, index) => (
        <List.Item
          key={index}
          title={item.name}
          icon={{ source: item.icon || "icon.png", fallback: "icon.png" }}
          actions={
            <ActionPanel>
              <Action title="Open Folder" onAction={() => open(item.path)} />
            </ActionPanel>
          }
          detail={
            <List.Item.Detail
              markdown={`
![icon](${item.icon || "icon.png"}?raycast-width=100&raycast-height=100)   
${item.description || ""}
`}
              metadata={
                <List.Item.Detail.Metadata>
                  {item.authors && <List.Item.Detail.Metadata.Label title="Authors" text={item.authors} />}
                  {item.owners && <List.Item.Detail.Metadata.Label title="Owners" text={item.owners} />}

                  {(item.projectUrl || item.licenseUrl) && (
                    <List.Item.Detail.Metadata.TagList title="Links">
                      {item.projectUrl && (
                        <List.Item.Detail.Metadata.TagList.Item
                          text="Project ↗"
                          color="PrimaryText"
                          onAction={() => open(item.projectUrl!)}
                        />
                      )}
                      {item.repositoryUrl && (
                        <List.Item.Detail.Metadata.TagList.Item
                          text="Repository ↗"
                          onAction={() => open(item.repositoryUrl!)}
                        />
                      )}
                      {item.licenseUrl && (
                        <List.Item.Detail.Metadata.TagList.Item
                          text="License ↗"
                          onAction={() => open(item.licenseUrl!)}
                        />
                      )}
                    </List.Item.Detail.Metadata.TagList>
                  )}

                  {item.tags && <List.Item.Detail.Metadata.Label title="Tags" text={item.tags} />}
                </List.Item.Detail.Metadata>
              }
            />
          }
        ></List.Item>
      ))}
    </List>
  );
}
