// src/types.d.ts
export interface ProjectReference {
  $: {
    Include: string;
  };
}

export interface ItemGroup {
  ProjectReference?: ProjectReference[];
}

export interface Project {
  ItemGroup: ItemGroup[];
}

export interface Csproj {
  Project: Project;
}
