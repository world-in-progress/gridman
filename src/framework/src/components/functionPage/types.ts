import { ResourceTree } from "@/core/tree/scene"

export type CreatePageProps = {
    creationType: 'schema' | 'patch',
    resourceTree: ResourceTree,
    onCreationSuccess: (resourceTree: ResourceTree, creationType: 'schema' | 'patch') => void
}