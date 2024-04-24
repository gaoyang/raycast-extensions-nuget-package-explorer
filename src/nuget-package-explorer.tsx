import { List } from "@raycast/api";
import { useEffect, useState } from "react";
import nugetService from "./services/nugetService";
import { INugetPackage } from "./services/interfaces";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [nugetPackages, setNugetPackages] = useState<INugetPackage[]>([]);

  useEffect(() => {
    nugetService.getNugetPackagesAsync().then((packages) => {
      setNugetPackages(packages);
    });
  }, []);

  return (
    <List isShowingDetail onSearchTextChange={setSearchText}>
      {nugetPackages.map((item, index) => (
        <List.Item
          key={index}
          title={item.name}
          icon={item.icon || "icon.png"}
          detail={
            <List.Item.Detail
              markdown={`![icon](${item.icon || "icon.png"}?raycast-width=100&raycast-height=100)  
              ${item.description}`}
              metadata={
                <List.Item.Detail.Metadata>
                  <List.Item.Detail.Metadata.Label title="Authors" text={item.authors} />
                  <List.Item.Detail.Metadata.TagList title="Type">
                    {item.tags.map((tag, index) => (
                      <List.Item.Detail.Metadata.TagList.Item key={index} text={tag} />
                    ))}
                  </List.Item.Detail.Metadata.TagList>
                </List.Item.Detail.Metadata>
              }
            />
          }
        ></List.Item>
      ))}
    </List>
  );
}
