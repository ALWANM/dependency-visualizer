// src/types.d.ts
export interface ProjectReference {
  $: {
    Include: string;
  };
}

export interface PackageReference {
  $: {
    Include: string;
  };
}

export interface ItemGroup {
  ProjectReference?: ProjectReference[];
  PackageReference?: PackageReference[];
}
export interface DependencyData {
  file: string;
  references: string[];
}

export interface Project {
  ItemGroup: ItemGroup[];
}

export interface Csproj {
  Project: Project;
}
export interface Node {
  id: string;
}

export interface Link {
  source: string;
  target: string;
}
