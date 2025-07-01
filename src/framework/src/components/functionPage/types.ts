import { ISceneTree } from "@/core/scene/iscene"

export type CreatePageProps = {
    creationType: 'schema' | 'patch',
    resourceTree: ISceneTree,
    onCreationSuccess: (resourceTree: ISceneTree, creationType: 'schema' | 'patch') => void
}