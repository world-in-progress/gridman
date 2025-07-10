import { ISceneNode } from '@/core/scene/iscene'

export default class DefaultPageContext {
    serialize(): any {}

    static deserialize(input: any): DefaultPageContext {
        return new DefaultPageContext()
    }

    static async create(node: ISceneNode): Promise<DefaultPageContext> {
        return new DefaultPageContext()
    }
}